# sentiment_matches.py
# A Flask blueprint that calculates pet match scores based on sentiment analysis
# of users' survey responses, sums with pet-attribute scores, and filters by species.

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from textblob import TextBlob
from matches import calculate_pet_match_score

sentiment_bp = Blueprint('sentiment_bp', __name__)

def analyze_sentiment(text):
    """
    Analyze sentiment polarity of the text (-1.0 to 1.0).
    """
    return TextBlob(text).sentiment.polarity

def calculate_sentiment_match_score(curr_responses, other_responses):
    """
    Compute a 0–10 score based on average sentiment similarity.
    """
    total_similarity = 0.0
    count = 0
    for question, curr in curr_responses.items():
        other = other_responses.get(question, "")
        if curr and other:
            diff = abs(analyze_sentiment(curr) - analyze_sentiment(other))
            similarity = max(0.0, 1.0 - diff)
            total_similarity += similarity
            count += 1

    return (total_similarity / count * 10) if count else 0.0

@sentiment_bp.route('/sentiment-matches', methods=['GET', 'OPTIONS'])

def get_sentiment_matches():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # Verify Firebase token
    auth_header = request.headers.get('Authorization', '')
    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != 'Bearer':
        return jsonify({'error': 'Missing or malformed token'}), 401

    try:
        uid = auth.verify_id_token(parts[1])['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    db = firestore.client()

    # Load current user's petProfile
    user_snap = db.collection('users').document(uid).get()
    if not user_snap.exists:
        return jsonify({'error': 'User not found'}), 404

    user_data = user_snap.to_dict()
    current_pet = user_data.get('petProfile', {})
    species = current_pet.get('species', '').strip().lower()

    # Load current user's survey responses (or empty)
    survey_snap = (
        db.collection('users').document(uid)
          .collection('surveyResponses').document('sentimentSurvey')
          .get()
    )
    curr_responses = survey_snap.to_dict().get('responses', {}) if survey_snap.exists else {}

    matches = []
    # Iterate all other users
    for doc in db.collection('users').stream():
        other_uid = doc.id
        if other_uid == uid:
            continue

        other_data = doc.to_dict()
        other_pet = other_data.get('petProfile', {})
        other_species = other_pet.get('species', '').strip().lower()

        # **Filter by species match only**
        if not species or other_species != species:
            continue

        # Load other user's survey
        other_survey_snap = (
            db.collection('users').document(other_uid)
              .collection('surveyResponses').document('sentimentSurvey')
              .get()
        )
        other_responses = other_survey_snap.to_dict().get('responses', {}) if other_survey_snap.exists else {}

        # Calculate scores
        pet_score = calculate_pet_match_score(current_pet, other_pet)
        sentiment_score = calculate_sentiment_match_score(curr_responses, other_responses)
        final_score = pet_score + sentiment_score

        matches.append({
            'uid': other_uid,
            'petProfile': other_pet,
            'petMatchScore': pet_score,
            'sentimentMatchScore': sentiment_score,
            'finalMatchScore': final_score
        })

    # Sort by combined score descending
    matches.sort(key=lambda m: m['finalMatchScore'], reverse=True)
    return jsonify({'matches': matches}), 200

# Note: Requires textblob:
#   pip install textblob
#   python -m textblob.download_corpora

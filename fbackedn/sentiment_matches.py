# sentiment_matches.py
# A Flask blueprint that calculates pet match scores based on sentiment analysis of users' survey responses

from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from flask_cors import cross_origin
from textblob import TextBlob
from matches import calculate_pet_match_score  # import pet-attribute match function

sentiment_bp = Blueprint('sentiment_bp', __name__)


def analyze_sentiment(text):
    """
    Analyze the sentiment polarity of the given text.
    Returns a float between -1.0 (very negative) and 1.0 (very positive).
    """
    blob = TextBlob(text)
    return blob.sentiment.polarity


def calculate_sentiment_match_score(current_responses, other_responses):
    """
    Compare sentiment of responses between two users.
    Returns a score scaled from 0 to 10 based on average sentiment similarity.
    """
    score = 0.0
    count = 0
    for question, curr_resp in current_responses.items():
        other_resp = other_responses.get(question)
        if curr_resp and other_resp:
            curr_sent = analyze_sentiment(curr_resp)
            other_sent = analyze_sentiment(other_resp)
            diff = abs(curr_sent - other_sent)
            similarity = max(0.0, 1.0 - diff)
            score += similarity
            count += 1

    if count > 0:
        return (score / count) * 10
    return 0.0


@sentiment_bp.route('/sentiment-matches', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_sentiment_matches():
    """
    Endpoint to retrieve a list of users sorted by combined pet and sentiment match score.
    Reads each user's survey under users/{uid}/surveyResponses/sentimentSurvey.
    """
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # Verify Firebase Auth token
    token_header = request.headers.get('Authorization')
    if not token_header:
        return jsonify({'error': 'Missing token'}), 401
    try:
        token = token_header.split()[1]
        decoded = auth.verify_id_token(token)
        current_uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    db = firestore.client()

    # Fetch current user's pet profile
    current_user_doc = db.collection('users').document(current_uid).get()
    if not current_user_doc.exists:
        return jsonify({'error': 'User not found'}), 404
    current_user = current_user_doc.to_dict()
    current_pet = current_user.get('petProfile', {})

    # Fetch current user's survey responses
    survey_doc = db.collection('users').document(current_uid) \
                  .collection('surveyResponses').document('sentimentSurvey').get()
    if not survey_doc.exists:
        return jsonify({'error': 'No survey responses found for current user'}), 400
    survey_data = survey_doc.to_dict()
    current_responses = survey_data.get('responses', {})

    matches = []
    # Iterate through all users
    users = db.collection('users').stream()
    for doc in users:
        uid = doc.id
        if uid == current_uid:
            continue
        user_data = doc.to_dict()
        other_pet = user_data.get('petProfile', {})

        # Fetch other user's survey
        other_survey_doc = db.collection('users').document(uid) \
                           .collection('surveyResponses').document('sentimentSurvey').get()
        if not other_survey_doc.exists:
            continue
        other_survey = other_survey_doc.to_dict()
        other_responses = other_survey.get('responses', {})

        # Compute scores
        sentiment_score = calculate_sentiment_match_score(current_responses, other_responses)
        pet_score = calculate_pet_match_score(current_pet, other_pet)
        final_score = pet_score + sentiment_score

        # Build match entry
        match_entry = {
            'uid': uid,
            'petProfile': other_pet,
            'petMatchScore': pet_score,
            'sentimentMatchScore': sentiment_score,
            'finalMatchScore': final_score
        }
        matches.append(match_entry)

    # Sort by finalMatchScore descending
    matches.sort(key=lambda x: x['finalMatchScore'], reverse=True)
    return jsonify({'matches': matches}), 200

# Note: Requires textblob corpora: python -m textblob.download_corpora

# matches.py
from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from flask_cors import cross_origin

matches_bp = Blueprint('matches_bp', __name__)

def calculate_pet_match_score(current_pet, other_pet):
    score = 0
    # Species: if same, add 5 points
    if current_pet.get('species') and other_pet.get('species'):
        if current_pet['species'].strip().lower() == other_pet['species'].strip().lower():
            score += 5
    # Breed: if same, add 3 points
    if current_pet.get('breed') and other_pet.get('breed'):
        if current_pet['breed'].strip().lower() == other_pet['breed'].strip().lower():
            score += 3
    # Sex: if same add 1, if different add 2
    if current_pet.get('sex') and other_pet.get('sex'):
        if current_pet['sex'].strip().lower() == other_pet['sex'].strip().lower():
            score += 1
        else:
            score += 2
    # Colour: if match exactly, add 1
    if current_pet.get('colour') and other_pet.get('colour'):
        if current_pet['colour'].strip().lower() == other_pet['colour'].strip().lower():
            score += 1
    # Location: if one string appears in the other, add 2 points
    if current_pet.get('location') and other_pet.get('location'):
        if (current_pet['location'].strip().lower() in other_pet['location'].strip().lower() or
            other_pet['location'].strip().lower() in current_pet['location'].strip().lower()):
            score += 2
    return score

@matches_bp.route('/matches', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_pet_matches():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.status_code = 200
        return response

    # Verify token from the Authorization header
    token_header = request.headers.get('Authorization')
    if not token_header:
        return jsonify({'error': 'Missing token'}), 401

    try:
        token = token_header.split(" ")[1]
        decoded = auth.verify_id_token(token)
        current_uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    db = firestore.client()

    # Get the current user's record
    current_doc = db.collection('users').document(current_uid).get()
    if not current_doc.exists:
        return jsonify({'error': 'Current user not found'}), 404
    current_user = current_doc.to_dict()

    if 'petProfile' not in current_user:
        return jsonify({'error': 'No pet profile found for current user'}), 400
    current_pet = current_user['petProfile']

    matches = []
    # Iterate through all user documents and consider only those with a pet profile
    for doc in db.collection('users').stream():
        if doc.id == current_uid:
            continue
        other_user = doc.to_dict()
        if 'petProfile' not in other_user:
            continue
        other_pet = other_user['petProfile']
        match_score = calculate_pet_match_score(current_pet, other_pet)
        # Optionally add the match score to the response
        other_user['petMatchScore'] = match_score
        other_user['uid'] = doc.id
        matches.append(other_user)

    # Sort the matches by the pet match score in descending order
    matches = sorted(matches, key=lambda x: x.get('petMatchScore', 0), reverse=True)
    return jsonify({'matches': matches}), 200

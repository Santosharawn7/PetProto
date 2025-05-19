# update_pet_profile.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore

update_pet_profile_bp = Blueprint('update_pet_profile_bp', __name__)

@update_pet_profile_bp.route('/update_pet_profile', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_pet_profile():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.status_code = 200
        return response

    token_header = request.headers.get('Authorization')
    if not token_header:
        return jsonify({'error': 'Missing token'}), 401

    try:
        token = token_header.split(" ")[1]  # expecting "Bearer <token>"
        decoded = auth.verify_id_token(token)
        uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    data = request.json
    # Add 'dob' as required field
    required_fields = ['species', 'breed', 'sex', 'colour', 'image', 'location', 'name', 'dob']
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': 'Missing fields: ' + ', '.join(missing)}), 400

    db = firestore.client()
    try:
        # Update the user's document by setting a subdocument called "petProfile"
        db.collection('users').document(uid).update({
            'petProfile': {
                'species': data.get('species'),
                'breed': data.get('breed'),
                'sex': data.get('sex'),
                'colour': data.get('colour'),
                'image': data.get('image'),
                'location': data.get('location'),
                'name': data.get('name'),
                'dob': data.get('dob')  # <-- Added DOB field
            }
        })
        return jsonify({'message': 'Pet profile updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

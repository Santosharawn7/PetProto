# update_registration.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore

update_registration_bp = Blueprint('update_registration_bp', __name__)

@update_registration_bp.route('/update_registration', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_registration():
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
    # Required registration fields for new Google users:
    required_fields = ['firstName', 'lastName', 'preferredUsername', 'phone', 'sex', 'address']
    missing = [field for field in required_fields if field not in data or not data[field]]
    if missing:
        return jsonify({'error': 'Missing registration fields: ' + ', '.join(missing)}), 400

    db = firestore.client()
    try:
        # Update only the registration fields in the user's document
        db.collection('users').document(uid).update({
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'preferredUsername': data.get('preferredUsername'),
            'phone': data.get('phone'),
            'sex': data.get('sex'),
            'address': data.get('address')
        })
        return jsonify({'message': 'Registration information updated successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

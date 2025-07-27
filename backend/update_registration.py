# update_registration.py

from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from flask_cors import cross_origin
from user_types import ALLOWED_USER_TYPES

update_registration_bp = Blueprint('update_registration_bp', __name__)

@update_registration_bp.route('/update-registration', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_registration():
    if request.method == 'OPTIONS':
        return '', 204

    token_header = request.headers.get('Authorization')
    if not token_header or not token_header.startswith("Bearer "):
        return jsonify({'error': 'Missing or invalid token'}), 401

    try:
        token = token_header.split(" ")[1]
        decoded = auth.verify_id_token(token)
        uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = [
        'firstName', 'lastName', 'preferredUsername', 'phone',
        'sex', 'address', 'userType'
    ]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

    # Validate userType
    if data['userType'] not in ALLOWED_USER_TYPES:
        return jsonify({'error': f'Invalid userType. Must be one of: {", ".join(ALLOWED_USER_TYPES)}'}), 400

    db = firestore.client()
    users_ref = db.collection('users')

    # Check for duplicate username or phone
    existing_user_query = users_ref.where('preferredUsername', '==', data['preferredUsername']).get()
    for doc in existing_user_query:
        if doc.id != uid:
            return jsonify({'error': 'Username already taken. Please choose a different one.'}), 409

    existing_phone_query = users_ref.where('phone', '==', data['phone']).get()
    for doc in existing_phone_query:
        if doc.id != uid:
            return jsonify({'error': 'Phone number already registered. Please use a different number.'}), 409

    # Prepare user data to update
    update_data = {
        'firstName': data['firstName'].strip(),
        'lastName': data['lastName'].strip(),
        'preferredUsername': data['preferredUsername'].strip(),
        'phone': data['phone'].strip(),
        'sex': data['sex'].strip(),
        'address': data['address'].strip(),
        'userType': data['userType'],
        'profileCompleted': True,
    }

    # You can also add: 'lastUpdated': firestore.SERVER_TIMESTAMP,

    user_ref = users_ref.document(uid)
    user_ref.set(update_data, merge=True)

    updated_user = user_ref.get().to_dict()
    updated_user['uid'] = uid  # Always include UID

    return jsonify({'success': True, 'user': updated_user}), 200

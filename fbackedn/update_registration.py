# update_registration.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import firestore

update_registration_bp = Blueprint('update_registration_bp', __name__)

# Allowed user types
ALLOWED_USER_TYPES = {
    "Admin",
    "Pet Parent",
    "Pet Shop Owner",
    "Veterinarian",
    "Pet Sitter"
}

@update_registration_bp.route('/update-registration', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_registration():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json
    if not data or 'uid' not in data:
        return jsonify({'error': 'Missing user UID'}), 400

    uid = data['uid']

    # Fetch user doc
    db = firestore.client()
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404

    # Prepare updates
    update_fields = {}
    updatable_fields = [
        'firstName', 'lastName', 'preferredUsername',
        'phone', 'email', 'sex', 'address'
    ]

    for field in updatable_fields:
        if field in data:
            update_fields[field] = data[field]

    # Handle userType (if provided)
    if 'userType' in data:
        user_type = data['userType']
        if user_type not in ALLOWED_USER_TYPES:
            return jsonify({'error': f'Invalid userType: {user_type}. Allowed types: {", ".join(ALLOWED_USER_TYPES)}'}), 400
        update_fields['userType'] = user_type

    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400

    try:
        user_ref.update(update_fields)
        return jsonify({'message': 'User profile updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

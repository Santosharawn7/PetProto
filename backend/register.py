# register.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import firestore

register_bp = Blueprint('register_bp', __name__)

# --- Allowed user types (consistent with login.py) ---
ALLOWED_USER_TYPES = {
    "admin",
    "pet_parent", 
    "pet_shop_owner",
    "veterinarian",
    "pet_sitter"
}

# User-friendly display names for frontend
USER_TYPE_DISPLAY_NAMES = {
    "admin": "Admin",
    "pet_parent": "Pet Parent",
    "pet_shop_owner": "Pet Shop Owner", 
    "veterinarian": "Veterinarian",
    "pet_sitter": "Pet Sitter"
}

@register_bp.route('/user-types', methods=['GET'])
@cross_origin()
def get_user_types():
    """
    Endpoint to provide allowed user types for registration dropdown.
    Returns: JSON object with value and display name pairs.
    """
    user_types = [
        {"value": key, "display": display} 
        for key, display in USER_TYPE_DISPLAY_NAMES.items()
    ]
    return jsonify(user_types), 200

@register_bp.route('/register', methods=['POST', 'OPTIONS'])
@cross_origin()
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json
    required_fields = [
        'uid', 'firstName', 'lastName', 'preferredUsername',
        'phone', 'email', 'sex', 'address', 'userType'
    ]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    # Validate userType
    if data['userType'] not in ALLOWED_USER_TYPES:
        allowed_display = ", ".join(USER_TYPE_DISPLAY_NAMES.values())
        return jsonify({'error': f'Invalid userType: {data["userType"]}. Allowed types: {allowed_display}'}), 400

    try:
        user_data = {
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'preferredUsername': data['preferredUsername'],
            'phone': data['phone'],
            'email': data['email'],
            'sex': data['sex'],
            'address': data['address'],
            'uid': data['uid'],
            'userType': data['userType']
        }

        db = firestore.client()
        db.collection('users').document(data['uid']).set(user_data)

        return jsonify({'message': 'User data saved successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
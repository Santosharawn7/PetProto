from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import firestore, auth
from user_types import ALLOWED_USER_TYPES, USER_TYPE_DISPLAY_NAMES
import logging

register_bp = Blueprint('register_bp', __name__)

def set_user_custom_claims(uid, user_type):
    """Helper function to set Firebase custom claims"""
    try:
        # Set custom claims for the user
        auth.set_custom_user_claims(uid, {
            'userType': user_type
        })
        logging.info(f"✅ Custom claims set for user {uid}: userType = {user_type}")
        return True
    except Exception as e:
        logging.error(f"❌ Error setting custom claims for {uid}: {e}")
        return False

@register_bp.route('/user-types', methods=['GET'])
@cross_origin()
def get_user_types():
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

    # Validate userType (must be canonical)
    user_type = data['userType']
    if user_type not in ALLOWED_USER_TYPES:
        return jsonify({'error': f'Invalid userType: {user_type}'}), 400

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
            'userType': user_type   # only canonical type
        }

        # Save to Firestore
        db = firestore.client()
        db.collection('users').document(data['uid']).set(user_data)
        
        # Set Firebase custom claims
        claims_success = set_user_custom_claims(data['uid'], user_type)
        
        response_data = {
            'message': 'User data saved successfully',
            'customClaimsSet': claims_success
        }
        
        if not claims_success:
            response_data['warning'] = 'User registered but custom claims failed to set'
        
        return jsonify(response_data), 201

    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'error': str(e)}), 500
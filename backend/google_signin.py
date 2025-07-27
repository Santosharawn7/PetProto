# google_signin.py

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import firebase_admin
from firebase_admin import auth, firestore

# Import allowed user types from your shared config
from user_types import ALLOWED_USER_TYPES, USER_TYPE_DISPLAY_NAMES

google_signin_bp = Blueprint('google_signin_bp', __name__)

# Default user type for Google sign-in
DEFAULT_USER_TYPE = 'pet_parent'

@google_signin_bp.route('/google_signin', methods=['POST', 'OPTIONS'])
@cross_origin()
def google_signin():
    if request.method == 'OPTIONS':
        response = jsonify({"message": "Preflight OK"})
        response.status_code = 200
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response

    data = request.json
    id_token = data.get('idToken')
    if not id_token:
        return jsonify({"error": "Missing id token"}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')

        db = firestore.client()
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if user_doc.exists:
            # Existing user
            user_data = user_doc.to_dict()
            user_type = user_data.get('userType', DEFAULT_USER_TYPE)

            # Update last login/displayName/photoURL for freshness
            update_data = {
                'lastLogin': firestore.SERVER_TIMESTAMP,
                'displayName': decoded_token.get('name'),
                'photoURL': decoded_token.get('picture')
            }
            user_ref.update(update_data)
        else:
            # New user setup
            user_type = DEFAULT_USER_TYPE

            try:
                user = auth.get_user(uid)
            except firebase_admin.auth.UserNotFoundError:
                user = auth.create_user(
                    uid=uid,
                    email=email,
                    display_name=decoded_token.get("name"),
                    photo_url=decoded_token.get("picture")
                )

            new_user = {
                'email': email,
                'displayName': decoded_token.get('name'),
                'photoURL': decoded_token.get('picture'),
                'uid': uid,
                'userType': user_type,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'lastLogin': firestore.SERVER_TIMESTAMP,
                'authProvider': 'google',
                # You can prefill some fields if you want
                'firstName': decoded_token.get('name', '').split(' ')[0] if decoded_token.get('name') else '',
                'lastName': ' '.join(decoded_token.get('name', '').split(' ')[1:]) if decoded_token.get('name') and len(decoded_token.get('name', '').split(' ')) > 1 else '',
                'preferredUsername': email.split('@')[0] if email else '',
                'phone': '',
                'sex': '',
                'address': ''
            }
            user_ref.set(new_user)

        # Optionally create a Firebase custom token for advanced flows
        custom_token = auth.create_custom_token(uid)

        response_data = {
            "message": "Google sign in successful",
            "uid": uid,
            "email": email,
            "userType": user_type,
            "displayName": decoded_token.get('name'),
            "photoURL": decoded_token.get('picture'),
            "customToken": custom_token.decode('utf-8') if hasattr(custom_token, 'decode') else custom_token,
            "isNewUser": not user_doc.exists
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@google_signin_bp.route('/update_user_type', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_user_type():
    """
    Endpoint to update user type for Google sign-in users.
    """
    if request.method == 'OPTIONS':
        response = jsonify({"message": "Preflight OK"})
        response.status_code = 200
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response

    data = request.json
    uid = data.get('uid')
    new_user_type = data.get('userType')

    if not uid or not new_user_type:
        return jsonify({"error": "Missing uid or userType"}), 400

    if new_user_type not in ALLOWED_USER_TYPES:
        allowed_types = ', '.join(USER_TYPE_DISPLAY_NAMES.values())
        return jsonify({"error": f"Invalid userType. Allowed types: {allowed_types}"}), 400

    try:
        db = firestore.client()
        db.collection('users').document(uid).update({
            'userType': new_user_type,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return jsonify({"message": "User type updated successfully", "userType": new_user_type}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


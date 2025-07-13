# google_signin.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import firebase_admin
from firebase_admin import auth, firestore

google_signin_bp = Blueprint('google_signin_bp', __name__)

# Default user type for Google sign-in users (can be changed as needed)
DEFAULT_USER_TYPE = 'pet_parent'

# Allowed user types (consistent with register.py)
ALLOWED_USER_TYPES = {
    "admin",
    "pet_parent", 
    "pet_shop_owner",
    "veterinarian",
    "pet_sitter"
}

@google_signin_bp.route('/google_signin', methods=['POST', 'OPTIONS'])
@cross_origin()
def google_signin():
    if request.method == 'OPTIONS':
        # Manually handle preflight requests if needed.
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
        # Verify the Google ID token using Firebase Admin SDK
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        # Initialize Firestore client
        db = firestore.client()
        
        # Check if user already exists in Firestore
        user_doc = db.collection('users').document(uid).get()
        
        if user_doc.exists:
            # Existing user - get their data including userType
            user_data = user_doc.to_dict()
            user_type = user_data.get('userType', DEFAULT_USER_TYPE)
            
            # Update last login info if needed
            update_data = {
                'lastLogin': firestore.SERVER_TIMESTAMP,
                'displayName': decoded_token.get('name'),
                'photoURL': decoded_token.get('picture')
            }
            db.collection('users').document(uid).update(update_data)
            
        else:
            # New user - create with default user type
            user_type = DEFAULT_USER_TYPE
            
            # Create user in Firebase Authentication if doesn't exist
            try:
                user = auth.get_user(uid)
            except firebase_admin.auth.UserNotFoundError:
                user = auth.create_user(
                    uid=uid,
                    email=email,
                    display_name=decoded_token.get("name"),
                    photo_url=decoded_token.get("picture")
                )
            
            # Create user document in Firestore
            user_data = {
                'email': email,
                'displayName': decoded_token.get('name'),
                'photoURL': decoded_token.get('picture'),
                'uid': uid,
                'userType': user_type,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'lastLogin': firestore.SERVER_TIMESTAMP,
                'authProvider': 'google',
                # Set default values for required fields
                'firstName': decoded_token.get('name', '').split(' ')[0] if decoded_token.get('name') else '',
                'lastName': ' '.join(decoded_token.get('name', '').split(' ')[1:]) if decoded_token.get('name') and len(decoded_token.get('name', '').split(' ')) > 1 else '',
                'preferredUsername': email.split('@')[0] if email else '',
                'phone': '',
                'sex': '',
                'address': ''
            }
            
            db.collection('users').document(uid).set(user_data)
        
        # Generate a custom token for the user (this acts like the idToken from regular login)
        custom_token = auth.create_custom_token(uid)
        
        # Prepare response data consistent with regular login
        response_data = {
            "message": "Google sign in successful",
            "uid": uid,
            "email": email,
            "userType": user_type,
            "displayName": decoded_token.get('name'),
            "photoURL": decoded_token.get('picture'),
            "customToken": custom_token.decode('utf-8'),
            "isNewUser": not user_doc.exists
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@google_signin_bp.route('/update_user_type', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_user_type():
    """
    Endpoint to update user type for Google sign-in users
    This can be used if you want to allow users to select their type after Google sign-in
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
        return jsonify({"error": f"Invalid userType. Allowed types: {', '.join(ALLOWED_USER_TYPES)}"}), 400
    
    try:
        db = firestore.client()
        
        # Update user type in Firestore
        db.collection('users').document(uid).update({
            'userType': new_user_type,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({"message": "User type updated successfully", "userType": new_user_type}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400
# google_signin.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import firebase_admin
from firebase_admin import auth, firestore

google_signin_bp = Blueprint('google_signin_bp', __name__)

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
        
        # Optionally, you might get or create the user in Firebase Authentication:
        try:
            user = auth.get_user(uid)
        except firebase_admin.auth.UserNotFoundError:
            # If user does not exist, create one (if you wish)
            user = auth.create_user(
                uid=uid,
                email=decoded_token.get("email"),
                display_name=decoded_token.get("name"),
                photo_url=decoded_token.get("picture")
            )
        
        # Optionally, update Firestore with user details:
        db = firestore.client()
        user_data = {
            'email': decoded_token.get('email'),
            'displayName': decoded_token.get('name'),
            'photoURL': decoded_token.get('picture'),
            'uid': uid
        }
        db.collection('users').document(uid).set(user_data, merge=True)
        
        return jsonify({"message": "Google sign in successful", "uid": uid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

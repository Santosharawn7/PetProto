# login.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import requests
from firebase_admin import firestore

login_bp = Blueprint('login_bp', __name__)

# Replace with your actual Firebase Web API Key
FIREBASE_API_KEY = 'AIzaSyCOOEKSMcSF_dQkFScyJWtBePqHJwsCHF8'

@login_bp.route('/login', methods=['POST', 'OPTIONS'])
  # This helps set some CORS headers automatically
def login():
    if request.method == 'OPTIONS':
        # Manually handle the preflight OPTIONS request
        # If your Flask backend doesn't respond properly to the OPTIONS request, the browser will block the actual request, and your React app will see CORS errors.
        response = jsonify({'message': 'CORS preflight successful'})
        response.status_code = 200
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response

    # For POST requests:
    data = request.json
    if not data or 'identifier' not in data or 'password' not in data:
        return jsonify({'error': 'Missing identifier or password'}), 400

    # Using .get() method for safe since afraid of having "None" as return
    identifier = data.get('identifier')
    password = data.get('password')

    # Check if the identifier is an email or username
    if "@" in identifier:
        email = identifier
    else:
        # Look up the email using the preferredUsername from Firestore
        db = firestore.client() # initializes a Firestore client (talk to the Firestore database)
        users_ref = db.collection('users')
        query = users_ref.where('preferredUsername', '==', identifier).limit(1).stream()
        user_doc = next(query, None) # next() is used to grab the first result from the generator query.
        if not user_doc:
            return jsonify({'error': 'User not found'}), 404
        user_data = user_doc.to_dict()
        email = user_data.get('email')
        if not email:
            return jsonify({'error': 'Email not found for user'}), 404

    # Use Firebase's REST API to sign in the user
    sign_in_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}'
    payload = {
        'email': email,
        'password': password,
        'returnSecureToken': True # asks Firebase to return: idToken, refreshToken, localId (user's UID)
    }
    
    firebase_response = requests.post(sign_in_url, json=payload)
    
    # Handle login failure
    if firebase_response.status_code != 200:
        fb_error = firebase_response.json().get('error', {})
        message = fb_error.get('message', 'Authentication failed')

        # Map Firebase error codes to friendly messages
        friendly_messages = {
            "EMAIL_NOT_FOUND": "No account found with that email.",
            "INVALID_PASSWORD": "Incorrect password.",
            "USER_DISABLED": "This account has been disabled.",
            "INVALID_EMAIL": "Invalid email format."
        }

        return jsonify({'error': friendly_messages.get(message, message)}), 401

    # Login succeeded
    data = firebase_response.json()

    # Check if email is verified
    lookup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}"
    id_token = data['idToken']
    verify_response = requests.post(lookup_url, json={"idToken": id_token})

    if verify_response.status_code != 200:
        return jsonify({'error': 'Failed to verify email status'}), 500

    user_info = verify_response.json().get('users', [])[0]
    if not user_info.get('emailVerified', False):
        return jsonify({'error': 'Email not verified. Please check your inbox.'}), 403

    # Everything OK
    return jsonify(data), 200

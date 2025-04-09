# login.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import requests
from firebase_admin import firestore

login_bp = Blueprint('login_bp', __name__)

# Replace with your actual Firebase Web API Key
FIREBASE_API_KEY = 'AIzaSyCOOEKSMcSF_dQkFScyJWtBePqHJwsCHF8'

@login_bp.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()  # This helps set some CORS headers automatically
def login():
    if request.method == 'OPTIONS':
        # Manually handle the preflight OPTIONS request
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

    identifier = data.get('identifier')
    password = data.get('password')

    # Check if the identifier is an email or username
    if "@" in identifier:
        email = identifier
    else:
        # Look up the email using the preferredUsername from Firestore
        db = firestore.client()
        users_ref = db.collection('users')
        query = users_ref.where('preferredUsername', '==', identifier).limit(1).stream()
        user_doc = next(query, None)
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
        'returnSecureToken': True
    }
    firebase_response = requests.post(sign_in_url, json=payload)
    if firebase_response.status_code == 200:
        return jsonify(firebase_response.json()), 200
    else:
        return jsonify(firebase_response.json()), firebase_response.status_code

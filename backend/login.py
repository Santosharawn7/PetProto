# backend/login.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
import logging

login_bp = Blueprint('login_bp', __name__)

@login_bp.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    data = request.json
    if not data or 'idToken' not in data:
        return jsonify({'error': 'Missing idToken'}), 400
    
    try:
        id_token = data['idToken']
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email', '')

        db = firestore.client()
        doc = db.collection('users').document(uid).get()
        user_data = doc.to_dict() if doc.exists else {}
        # Flatten any accidental wrap
        if user_data and "user" in user_data:
            user_data = {**user_data["user"], **{k: v for k, v in user_data.items() if k != "user"}}

        # Compose user object
        response_data = dict(
            uid=uid,
            email=email,
            userType=user_data.get('userType', 'pet_parent'),
            firstName=user_data.get('firstName', ''),
            lastName=user_data.get('lastName', ''),
            preferredUsername=user_data.get('preferredUsername', ''),
            phone=user_data.get('phone', ''),
            sex=user_data.get('sex', ''),
            address=user_data.get('address', ''),
            petProfile=user_data.get('petProfile', None)
        )
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'error': f'Authentication failed: {str(e)}'}), 401

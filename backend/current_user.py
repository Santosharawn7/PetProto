from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from flask_cors import cross_origin

current_user_bp = Blueprint('current_user_bp', __name__)

@current_user_bp.route('/current_user', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_current_user():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.status_code = 200
        return response

    token_header = request.headers.get('Authorization')
    if not token_header:
        return jsonify({'error': 'Missing token'}), 401

    try:
        token = token_header.split(" ")[1]
        decoded = auth.verify_id_token(token)
        uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    db = firestore.client()
    doc = db.collection('users').document(uid).get()
    if doc.exists:
        data = doc.to_dict()
        # Attach petProfile at top level if you want
        pet_profile = data.get('petProfile', None)
        if pet_profile:
            data['petProfile'] = pet_profile
        return jsonify(data), 200
    else:
        return jsonify({'error': 'User not found'}), 404

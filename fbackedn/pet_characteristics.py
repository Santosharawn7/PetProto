from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore

pet_characteristics_bp = Blueprint('pet_characteristics_bp', __name__)

@pet_characteristics_bp.route('/pet-characteristics', methods=['POST', 'OPTIONS'])

def set_pet_characteristics():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # Authenticate
    token_header = request.headers.get('Authorization')
    if not token_header:
        return jsonify({'error': 'Missing token'}), 401
    try:
        token = token_header.split(" ")[1]
        decoded = auth.verify_id_token(token)
        uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token: ' + str(e)}), 401

    data = request.json or {}
    characteristics = data.get('characteristics', [])
    if not isinstance(characteristics, list) or len(characteristics) > 3:
        return jsonify({'error': 'You must provide a list of up to 3 characteristics.'}), 400

    db = firestore.client()
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404

    # Update (merge) the petProfile.characteristics array
    user_ref.update({
        'petProfile.characteristics': characteristics
    })

    return jsonify({'message': 'Characteristics updated', 'characteristics': characteristics}), 200

@pet_characteristics_bp.route('/pet-characteristics', methods=['GET'])

def get_pet_characteristics():
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
    user_doc = db.collection('users').document(uid).get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404
    pet_profile = user_doc.to_dict().get('petProfile', {})
    return jsonify({'characteristics': pet_profile.get('characteristics', [])}), 200

# user_profile.py
from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
from flask_cors import cross_origin

user_profile_bp = Blueprint('user_profile_bp', __name__)

def get_authenticated_user_uid(token_header):
    if not token_header or not token_header.startswith("Bearer "):
        return None, jsonify({'error': 'Missing or invalid token'}), 401
    try:
        token = token_header.split(" ")[1]
        decoded = auth.verify_id_token(token)
        return decoded['uid'], None, None
    except Exception as e:
        return None, jsonify({'error': 'Invalid token: ' + str(e)}), 401

@user_profile_bp.route('/user/profile', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_profile():
    if request.method == 'OPTIONS':
        return '', 204
    token_header = request.headers.get('Authorization')
    uid, error_resp, code = get_authenticated_user_uid(token_header)
    if error_resp: return error_resp, code

    db = firestore.client()
    doc = db.collection('users').document(uid).get()
    if doc.exists:
        user = doc.to_dict()
        user['uid'] = uid
        return jsonify(user), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@user_profile_bp.route('/user/profile', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_profile():
    if request.method == 'OPTIONS':
        return '', 204
    token_header = request.headers.get('Authorization')
    uid, error_resp, code = get_authenticated_user_uid(token_header)
    if error_resp: return error_resp, code

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    allowed_fields = [
        'firstName', 'lastName', 'preferredUsername', 'phone', 'sex', 'address', 'userType', 'displayName', 'photoURL'
    ]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400

    db = firestore.client()
    user_ref = db.collection('users').document(uid)
    user_ref.set(update_data, merge=True)
    user = user_ref.get().to_dict()
    user['uid'] = uid
    return jsonify({'success': True, 'user': user}), 200

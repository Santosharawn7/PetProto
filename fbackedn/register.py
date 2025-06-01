# # register.py
# from flask import Blueprint, request, jsonify
# from flask_cors import cross_origin
# from firebase_admin import auth, firestore

# register_bp = Blueprint('register_bp', __name__)

# @register_bp.route('/register', methods=['POST', 'OPTIONS'])
# 
# def register():
#     if request.method == 'OPTIONS':
#         # Handle the preflight OPTIONS request
#         return jsonify({}), 200

#     data = request.json
#     # Define required fields
#     required_fields = [
#         'firstName', 'lastName', 'preferredUsername',
#         'phone', 'email', 'sex', 'address', 'password'
#     ]
#     missing = [field for field in required_fields if field not in data]
#     if missing:
#         return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

#     try:
#         # 1. Create user in Firebase Authentication
#         user = auth.create_user(
#             email=data['email'],
#             email_verified=False,
#             password=data['password'],
#             display_name=f"{data['firstName']} {data['lastName']}",
#             phone_number=data['phone']  # Ensure proper formatting (E.164 recommended)
#         )
#         # 2. Save user profile in Firestore
#         user_data = {
#             'firstName': data['firstName'],
#             'lastName': data['lastName'],
#             'preferredUsername': data['preferredUsername'],
#             'phone': data['phone'],
#             'email': data['email'],
#             'sex': data['sex'],
#             'address': data['address'],
#             'uid': user.uid
#         }

#         db = firestore.client()
#         db.collection('users').document(user.uid).set(user_data)

#          # 3. Generate email verification link
#         link = auth.generate_email_verification_link(data['email'])
        
#         return jsonify({
#             'message': 'User registered successfully. Verification email sent.',
#             'uid': user.uid,
#         }), 201

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


# register.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import firestore

register_bp = Blueprint('register_bp', __name__)

@register_bp.route('/register', methods=['POST', 'OPTIONS'])

def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json
    required_fields = [
        'uid', 'firstName', 'lastName', 'preferredUsername',
        'phone', 'email', 'sex', 'address'
    ]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        user_data = {
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'preferredUsername': data['preferredUsername'],
            'phone': data['phone'],
            'email': data['email'],
            'sex': data['sex'],
            'address': data['address'],
            'uid': data['uid']
        }
        
        db = firestore.client()
        db.collection('users').document(data['uid']).set(user_data)

        return jsonify({'message': 'User data saved successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

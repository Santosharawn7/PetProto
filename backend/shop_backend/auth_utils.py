from flask import request, jsonify
from functools import wraps
from firebase_admin import auth, firestore
import json

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        token_header = request.headers.get('Authorization', '')
        if not token_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        id_token = token_header.split(' ')[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
            
            # Debug: Print the decoded token
            print("=== DECODED TOKEN DEBUG ===")
            print(json.dumps(decoded_token, indent=2, default=str))
            print("=== END DEBUG ===")
            
            # Also log to Flask's logger for better visibility
            from flask import current_app
            current_app.logger.info(f"Decoded token: {decoded_token}")
            
        except Exception as e:
            print(f"Token verification failed: {e}")
            return jsonify({'error': 'Invalid or expired token'}), 401
        return f(*args, **kwargs)
    return decorated

def require_owner(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        user = getattr(request, "user", None)
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        # Get UID from the token
        uid = user.get('uid')
        if not uid:
            return jsonify({'error': 'Invalid user token - no UID'}), 401

        print(f"=== CHECKING OWNER PERMISSIONS FOR UID: {uid} ===")

        try:
            # Fetch user data from Firestore to get userType
            db = firestore.client()
            user_doc = db.collection('users').document(uid).get()
            
            if not user_doc.exists:
                print(f"❌ User document not found for UID: {uid}")
                return jsonify({
                    'error': 'User profile not found. Please complete your registration.',
                    'debug': {'uid': uid}
                }), 404

            user_data = user_doc.to_dict()
            print(f"📋 Firestore user data: {json.dumps(user_data, indent=2, default=str)}")

            # Check for userType in the Firestore data
            user_type = user_data.get('userType')
            
            if not user_type:
                print("❌ No userType found in Firestore user data")
                return jsonify({
                    'error': 'User type not set. Please complete your profile.',
                    'debug': {
                        'uid': uid,
                        'available_fields': list(user_data.keys()) if user_data else []
                    }
                }), 400

            print(f"🔍 Found userType in Firestore: '{user_type}'")
            
            # Normalize the user type for comparison
            normalized_type = user_type.replace(' ', '_').replace('-', '_').lower()
            print(f"🔧 Normalized userType: '{normalized_type}'")
            
            # Valid owner types (expanded list to be more flexible)
            valid_owner_types = [
                'pet_shop_owner',      # Primary format from your registration
                'petshopowner', 
                'shop_owner', 
                'shopowner', 
                'owner',
                'pet_shop_owner',      # Just in case there are variations
                'pet shop owner'       # Handle spaces
            ]
            
            # Normalize valid types too
            normalized_valid_types = [t.replace(' ', '_').replace('-', '_').lower() for t in valid_owner_types]
            
            print(f"🎯 Valid normalized types: {normalized_valid_types}")
            
            if normalized_type in normalized_valid_types:
                print("✅ User authorized as pet shop owner")
                # Store the full user data in request for use in the route
                request.user_data = user_data
                return f(*args, **kwargs)
            else:
                print(f"❌ User type '{normalized_type}' not in valid types")
                return jsonify({
                    'error': 'Access denied. Only Pet Shop Owners can perform this action.',
                    'debug': {
                        'your_userType': user_type,
                        'normalized': normalized_type,
                        'valid_types': valid_owner_types,
                        'uid': uid
                    }
                }), 403

        except Exception as e:
            print(f"❌ Error checking owner permissions: {e}")
            return jsonify({
                'error': 'Failed to verify permissions. Please try again.',
                'debug': {'uid': uid, 'error': str(e)}
            }), 500

    return decorated
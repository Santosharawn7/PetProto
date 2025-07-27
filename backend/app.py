from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import os
import json
import logging

# ---- PetProto Blueprints ----
from register import register_bp
from login import login_bp
from google_signin import google_signin_bp
from matches import matches_bp
from update_pet_profile import update_pet_profile_bp
from update_registration import update_registration_bp
from current_user import current_user_bp
from sentiment_matches import sentiment_bp
from social_requests import requests_bp
from social_chats import chat_bp
from social_search import search_bp
from social_events import events_bp
from social_events import posts_bp
from social_reactions import reactions_bp
from pet_characteristics import pet_characteristics_bp

# ---- Shop Blueprints (use absolute imports!) ----
from shop_backend.products import products_bp
from shop_backend.cart import cart_bp
from shop_backend.orders import orders_bp
from shop_backend.dashboard import dashboard_bp
from shop_backend.db import db as shop_db

# --- Load environment variables ---
load_dotenv()

app = Flask(__name__)

# ---- Configure Logging ----
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# ---- CORS CONFIG ----
CORS(app, origins=[
    "https://frontend-2o3e.onrender.com",
    "https://pet-proto.vercel.app/",      # Production (Vercel)
    "http://localhost:5173",             # Local React Vite default
    "http://localhost:3000",             # Local React alternative
    "http://127.0.0.1:5173",             # Localhost with IP
    "http://127.0.0.1:3000"
])

# --- Firebase credentials loading ---
cred = None
cred_json = os.environ.get("GOOGLE_CREDENTIALS")

if cred_json:
    try:
        cred = credentials.Certificate(json.loads(cred_json))
        print("✅ Loaded Firebase credentials from environment variable.")
    except Exception as e:
        print("❌ Error loading credentials from GOOGLE_CREDENTIALS:", e)
        raise
elif os.path.exists("serviceAccountKey.json"):
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        print("✅ Loaded Firebase credentials from serviceAccountKey.json file.")
    except Exception as e:
        print("❌ Error loading credentials from file:", e)
        raise
else:
    raise RuntimeError("❌ No Firebase credentials found! Set GOOGLE_CREDENTIALS env variable or provide serviceAccountKey.json.")

firebase_admin.initialize_app(cred)
db = firestore.client()
print("✅ Firebase initialized successfully")

# --- Shop SQLAlchemy DB Config (only for shop models) ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///mini_amazon.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
shop_db.init_app(app)

with app.app_context():
    shop_db.create_all()
    print("✅ Shop database initialized successfully")

# ---- Optional: Add a health check endpoint ----
@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'Server is running'}, 200

# ---- Optional: Add debug endpoint to check custom claims ----
@app.route('/debug/user-claims/<uid>', methods=['GET'])
def debug_user_claims(uid):
    """Debug endpoint to check what custom claims a user has"""
    if not app.debug:  # Only available in debug mode
        return {'error': 'Not available in production'}, 403
    
    try:
        from firebase_admin import auth
        user_record = auth.get_user(uid)
        return {
            'uid': uid,
            'email': user_record.email,
            'custom_claims': user_record.custom_claims or {},
            'email_verified': user_record.email_verified,
            'disabled': user_record.disabled
        }, 200
    except Exception as e:
        return {'error': str(e)}, 400

# ---- Blueprints Registration ----
# PetProto Blueprints
app.register_blueprint(register_bp)
app.register_blueprint(login_bp)
app.register_blueprint(google_signin_bp)
app.register_blueprint(matches_bp)
app.register_blueprint(update_pet_profile_bp)
app.register_blueprint(update_registration_bp)
app.register_blueprint(current_user_bp)
app.register_blueprint(sentiment_bp)
app.register_blueprint(requests_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(search_bp)
app.register_blueprint(events_bp)
app.register_blueprint(reactions_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(pet_characteristics_bp)

# Shop Blueprints
app.register_blueprint(products_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(dashboard_bp)

print("✅ All blueprints registered successfully")

if __name__ == '__main__':
    print("🚀 Starting Flask application...")
    app.run(debug=True)
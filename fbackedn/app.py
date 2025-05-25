# app.py
from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from register import register_bp
from login import login_bp  # import the login blueprint
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

app = Flask(__name__)
CORS(app)  # Enable CORS globally

# Initialize Firebase Admin with your service account key
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# (Optional) Create Firestore client instance if needed elsewhere
db = firestore.client()

# Register Blueprints for registration and login
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

if __name__ == '__main__':
    app.run(debug=True)

# social_chats.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from datetime import datetime

chat_bp = Blueprint('chat_bp', __name__)

def _get_user_uid(req):
    hdr = req.headers.get('Authorization', '').split()
    if len(hdr) != 2 or hdr[0] != 'Bearer':
        return None
    try:
        return auth.verify_id_token(hdr[1])['uid']
    except:
        return None

@chat_bp.route('/chats', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def chats():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_user_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    db = firestore.client()

    if request.method == 'GET':
        # Corrected: use keyword args on where, and proper DESCENDING direction
        query = (
            db.collection('chats')
              .where(field_path='participants', op_string='array_contains', value=uid)
              .order_by('lastUpdated', direction=firestore.Query.DESCENDING)
        )
        snaps = query.stream()
        chats = []
        for snap in snaps:
            c = snap.to_dict()
            c['id'] = snap.id
            chats.append(c)
        return jsonify({'chats': chats}), 200

    # POST → create a chat
    data = request.json or {}
    participants = data.get('participants', [])
    if uid not in participants:
        participants.append(uid)
    is_group = bool(data.get('isGroup'))
    new_chat = {
        'participants': participants,
        'isGroup': is_group,
        'lastUpdated': datetime.utcnow()
    }
    chat_ref = db.collection('chats').document()
    chat_ref.set(new_chat)
    return jsonify({'chatId': chat_ref.id}), 201

@chat_bp.route('/chats/<chat_id>/messages', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def messages(chat_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_user_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    db = firestore.client()
    chat_doc = db.collection('chats').document(chat_id).get()
    if not chat_doc.exists or uid not in chat_doc.to_dict().get('participants', []):
        return jsonify({'error': 'Forbidden'}), 403

    if request.method == 'GET':
        # Use proper ASCENDING direction
        query = (
            db.collection('chats')
              .document(chat_id)
              .collection('messages')
              .order_by('sentAt', direction=firestore.Query.ASCENDING)
        )
        snaps = query.stream()
        messages = []
        for snap in snaps:
            m = snap.to_dict()
            m['id'] = snap.id
            messages.append(m)
        return jsonify({'messages': messages}), 200

    # POST → send a message
    data = request.json or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'Empty message'}), 400

    msg = {
        'from': uid,
        'text': text,
        'sentAt': datetime.utcnow()
    }
    msg_ref = (
        db.collection('chats')
          .document(chat_id)
          .collection('messages')
          .document()
    )
    msg_ref.set(msg)

    # Update chat's lastUpdated timestamp
    db.collection('chats').document(chat_id).update({
        'lastUpdated': datetime.utcnow()
    })

    return jsonify({'messageId': msg_ref.id}), 201

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

def _get_display_name(db, uid):
    user_doc = db.collection('users').document(uid).get()
    if user_doc.exists:
        data = user_doc.to_dict()
        # Prefer petProfile.name, then displayName, then UID
        return data.get('petProfile', {}).get('name') or data.get('displayName') or uid
    return uid

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
        query = (
            db.collection('chats')
              .where('participants', 'array_contains', uid)
              .order_by('lastUpdated', direction=firestore.Query.DESCENDING)
        )
        snaps = query.stream()
        chats = []
        for snap in snaps:
            c = snap.to_dict()
            c['id'] = snap.id
            other_uids = [u for u in c.get('participants', []) if u != uid]
            # Show display name (prefer petProfile.name)
            other_names = []
            for ouid in other_uids:
                other_names.append(_get_display_name(db, ouid))
            c['otherUserName'] = ", ".join(other_names)
            c['otherUserUid'] = other_uids[0] if other_uids else None
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
            m['authorName'] = _get_display_name(db, m.get('from', ''))
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

# -- NEW: Find or create a chat with another user (1-1 only) --
@chat_bp.route('/chat-with-user/<friend_uid>', methods=['POST', 'OPTIONS'])
@cross_origin()
def chat_with_user(friend_uid):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_user_uid(request)
    if not uid or not friend_uid or uid == friend_uid:
        return jsonify({'error': 'Unauthorized or bad friend UID'}), 401

    db = firestore.client()
    # Find existing 1-1 chat (order-agnostic)
    existing = db.collection('chats') \
        .where('participants', 'array_contains', uid) \
        .where('isGroup', '==', False) \
        .stream()
    for chat in existing:
        chat_data = chat.to_dict()
        if set(chat_data.get('participants', [])) == set([uid, friend_uid]):
            return jsonify({'chatId': chat.id}), 200
    # Otherwise, create
    chat_ref = db.collection('chats').document()
    chat_ref.set({
        'participants': [uid, friend_uid],
        'isGroup': False,
        'lastUpdated': datetime.utcnow()
    })
    return jsonify({'chatId': chat_ref.id}), 201

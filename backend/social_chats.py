from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from flask_socketio import emit, join_room, leave_room
from firebase_admin import auth, firestore
from datetime import datetime
import json

chat_bp = Blueprint('chat_bp', __name__)

# Initialize SocketIO (you'll need to pass this from your main app)
# In your main Flask app file, add: socketio = SocketIO(app, cors_allowed_origins="*")
# Then pass it here or import it

def _get_user_uid(req):
    hdr = req.headers.get('Authorization', '').split()
    if len(hdr) != 2 or hdr[0] != 'Bearer':
        return None
    try:
        return auth.verify_id_token(hdr[1])['uid']
    except:
        return None

def _get_user_uid_from_token(token):
    """Helper to get UID from token string"""
    try:
        return auth.verify_id_token(token)['uid']
    except:
        return None

def _get_display_name(db, uid):
    user_doc = db.collection('users').document(uid).get()
    if user_doc.exists:
        data = user_doc.to_dict()
        # Prefer petProfile.name, then displayName, then UID
        return data.get('petProfile', {}).get('name') or data.get('displayName') or uid
    return uid

def _get_pet_avatar(db, uid):
    user_doc = db.collection('users').document(uid).get()
    if user_doc.exists:
        return user_doc.to_dict().get('petProfile', {}).get('image')
    return None

def _get_last_message(db, chat_id):
    """Get the last message from a chat"""
    try:
        query = (
            db.collection('chats')
              .document(chat_id)
              .collection('messages')
              .order_by('sentAt', direction=firestore.Query.DESCENDING)
              .limit(1)
        )
        msgs = list(query.stream())
        if msgs:
            msg_data = msgs[0].to_dict()
            return {
                'text': msg_data.get('text', ''),
                'sentAt': msg_data.get('sentAt'),
                'from': msg_data.get('from')
            }
    except Exception as e:
        print(f"Error getting last message: {e}")
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
            c['otherUserAvatar'] = _get_pet_avatar(db, c['otherUserUid'])
            
            # Get last message
            last_msg = _get_last_message(db, snap.id)
            c['lastMessage'] = last_msg
            
            # Format last message text for preview
            if last_msg:
                if last_msg['from'] == uid:
                    c['lastMessagePreview'] = f"You: {last_msg['text']}"
                else:
                    c['lastMessagePreview'] = last_msg['text']
                c['lastMessageTime'] = last_msg['sentAt']
            else:
                c['lastMessagePreview'] = "No messages yet"
                c['lastMessageTime'] = c.get('lastUpdated')
            
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

@chat_bp.route('/friends', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_friends():
    """Get all friends/users that the current user can chat with"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_user_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    db = firestore.client()
    
    try:
        # Get current user's friends from their document
        user_doc = db.collection('users').document(uid).get()
        friends_list = []
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            friends_uids = user_data.get('friends', [])
            
            # Get friend details
            for friend_uid in friends_uids:
                friend_doc = db.collection('users').document(friend_uid).get()
                if friend_doc.exists:
                    friend_data = friend_doc.to_dict()
                    friends_list.append({
                        'uid': friend_uid,
                        'displayName': _get_display_name(db, friend_uid),
                        'avatar': _get_pet_avatar(db, friend_uid),
                        'isOnline': friend_data.get('isOnline', False),
                        'lastSeen': friend_data.get('lastSeen')
                    })
        
        # If no friends found, get some sample users (for demo purposes)
        if not friends_list:
            # Get all users except current user (limit to 20 for performance)
            users_query = db.collection('users').limit(20).stream()
            for user_doc in users_query:
                if user_doc.id != uid:
                    user_data = user_doc.to_dict()
                    friends_list.append({
                        'uid': user_doc.id,
                        'displayName': _get_display_name(db, user_doc.id),
                        'avatar': _get_pet_avatar(db, user_doc.id),
                        'isOnline': user_data.get('isOnline', False),
                        'lastSeen': user_data.get('lastSeen')
                    })
        
        return jsonify({'friends': friends_list}), 200
        
    except Exception as e:
        print(f"Error getting friends: {e}")
        return jsonify({'error': 'Failed to fetch friends'}), 500

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

    # POST → send a message (now with real-time broadcasting)
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

    # NEW: Broadcast message to all users in the chat room via Socket.IO
    from flask import current_app
    socketio = current_app.extensions.get('socketio')
    if socketio:
        # Prepare message data for broadcasting
        broadcast_msg = {
            'id': msg_ref.id,
            'from': uid,
            'text': text,
            'sentAt': msg['sentAt'].isoformat(),
            'authorName': _get_display_name(db, uid)
        }
        
        # Emit to all clients in the chat room
        socketio.emit('new_message', broadcast_msg, room=f'chat_{chat_id}')
        print(f"📤 Broadcasting message to room: chat_{chat_id}")

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


# ============= SOCKET.IO EVENT HANDLERS =============

def init_socketio_events(socketio):
    """Initialize Socket.IO event handlers"""
    
    @socketio.on('connect')
    def handle_connect(auth_data=None):
        """Handle client connection"""
        print(f"Client connected: {request.sid}")
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        print(f"Client disconnected: {request.sid}")
    
    @socketio.on('join_chat')
    def handle_join_chat(data):
        """Handle user joining a chat room"""
        try:
            chat_id = data.get('chatId')
            token = data.get('token')
            
            print(f"🔐 Join chat request: chatId={chat_id}, token_length={len(token) if token else 0}")
            
            if not chat_id or not token:
                print("❌ Missing chatId or token")
                emit('error', {'message': 'Missing chatId or token'})
                return
            
            # Verify user authentication
            uid = _get_user_uid_from_token(token)
            if not uid:
                print("❌ Invalid token")
                emit('error', {'message': 'Invalid token'})
                return
            
            print(f"✅ User authenticated: {uid}")
            
            # Verify user is participant in this chat
            db = firestore.client()
            chat_doc = db.collection('chats').document(chat_id).get()
            if not chat_doc.exists:
                print(f"❌ Chat not found: {chat_id}")
                emit('error', {'message': 'Chat not found'})
                return
            
            chat_data = chat_doc.to_dict()
            if uid not in chat_data.get('participants', []):
                print(f"❌ User {uid} not authorized for chat {chat_id}")
                emit('error', {'message': 'Not authorized for this chat'})
                return
            
            # Join the room
            room_name = f'chat_{chat_id}'
            join_room(room_name)
            
            print(f"✅ User {uid} joined room: {room_name}")
            
            emit('joined_chat', {
                'chatId': chat_id,
                'message': f'Joined chat {chat_id}',
                'roomName': room_name
            })
            
        except Exception as e:
            print(f"❌ Error in join_chat: {str(e)}")
            emit('error', {'message': f'Failed to join chat: {str(e)}'})
    
    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        """Handle user leaving a chat room"""
        try:
            chat_id = data.get('chatId')
            if not chat_id:
                return
            
            room_name = f'chat_{chat_id}'
            leave_room(room_name)
            
            emit('left_chat', {
                'chatId': chat_id,
                'message': f'Left chat {chat_id}'
            })
            
            print(f"User left chat room: {room_name}")
            
        except Exception as e:
            print(f"Error in leave_chat: {str(e)}")
    
    @socketio.on('typing_start')
    def handle_typing_start(data):
        """Handle user started typing"""
        try:
            chat_id = data.get('chatId')
            token = data.get('token')
            
            if not chat_id or not token:
                return
            
            uid = _get_user_uid_from_token(token)
            if not uid:
                return
            
            db = firestore.client()
            user_name = _get_display_name(db, uid)
            
            # Broadcast to others in the room (exclude sender)
            room_name = f'chat_{chat_id}'
            emit('user_typing', {
                'userId': uid,
                'userName': user_name,
                'isTyping': True
            }, room=room_name, include_self=False)
            
        except Exception as e:
            print(f"Error in typing_start: {str(e)}")
    
    @socketio.on('typing_stop')
    def handle_typing_stop(data):
        """Handle user stopped typing"""
        try:
            chat_id = data.get('chatId')
            token = data.get('token')
            
            if not chat_id or not token:
                return
            
            uid = _get_user_uid_from_token(token)
            if not uid:
                return
            
            # Broadcast to others in the room (exclude sender)
            room_name = f'chat_{chat_id}'
            emit('user_typing', {
                'userId': uid,
                'isTyping': False
            }, room=room_name, include_self=False)
            
        except Exception as e:
            print(f"Error in typing_stop: {str(e)}")
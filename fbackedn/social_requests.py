# social_requests.py

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore, messaging
from datetime import datetime

requests_bp = Blueprint('requests_bp', __name__)

def send_push(to_uid, title, body, data=None):
    """
    Send an FCM push to a single user.
    Assumes you store their token in users/{uid}/fcmTokens/{tokenId}.
    """
    db = firestore.client()
    tokens = db.collection('users') \
               .document(to_uid) \
               .collection('fcmTokens') \
               .stream()
    for tk in tokens:
        token = tk.to_dict().get('token')
        if not token:
            continue
        msg = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            token=token
        )
        try:
            messaging.send(msg)
        except Exception as e:
            print("FCM send error:", e)

@requests_bp.route('/send-request', methods=['POST', 'OPTIONS'])
@cross_origin()
def send_request():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    to_uid = data.get('to')
    req_type = data.get('type')  # "friend" or "message"

    # auth
    token_header = request.headers.get('Authorization', '')
    parts = token_header.split()
    if len(parts) != 2 or parts[0] != 'Bearer':
        return jsonify({'error': 'Missing token'}), 401
    try:
        current_uid = auth.verify_id_token(parts[1])['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid token'}), 401

    if not to_uid or not req_type:
        return jsonify({'error': '"to" and "type" required'}), 400

    db = firestore.client()
    # create a request doc
    req_ref = db.collection('requests').document()
    req = {
        'from': current_uid,
        'to': to_uid,
        'type': req_type,
        'status': 'pending',
        'createdAt': datetime.utcnow()
    }
    req_ref.set(req)

    # update user documents
    db.collection('users').document(current_uid).update({
        'outgoingRequests': firestore.ArrayUnion([req_ref.id])
    })
    db.collection('users').document(to_uid).update({
        'incomingRequests': firestore.ArrayUnion([req_ref.id])
    })

    # send FCM notification
    send_push(
        to_uid,
        title="New Request",
        body=f"You have a new {req_type} request",
        data={'requestId': req_ref.id}
    )

    return jsonify({'message': 'Request sent', 'requestId': req_ref.id}), 201

@requests_bp.route('/requests', methods=['GET', 'OPTIONS'])
@cross_origin()
def list_requests():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    token_header = request.headers.get('Authorization', '')
    parts = token_header.split()
    if len(parts) != 2 or parts[0] != 'Bearer':
        return jsonify({'error': 'Missing token'}), 401
    try:
        current_uid = auth.verify_id_token(parts[1])['uid']
    except:
        return jsonify({'error': 'Invalid token'}), 401

    db = firestore.client()
    user_snap = db.collection('users').document(current_uid).get()
    user = user_snap.to_dict() or {}
    inc = user.get('incomingRequests', [])
    out = user.get('outgoingRequests', [])

    def fetch(ids):
        out = []
        for i in ids:
            doc = db.collection('requests').document(i).get()
            if doc.exists:
                out.append({**doc.to_dict(), 'id': i})
        return out

    return jsonify({
        'incoming': fetch(inc),
        'outgoing': fetch(out)
    }), 200

@requests_bp.route('/requests/<request_id>/respond', methods=['POST', 'OPTIONS'])
@cross_origin()
def respond_request(request_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    action = data.get('action')  # "accept", "reject", "block"
    if action not in ('accept', 'reject', 'block'):
        return jsonify({'error': 'Invalid action'}), 400

    token_header = request.headers.get('Authorization', '')
    parts = token_header.split()
    try:
        current_uid = auth.verify_id_token(parts[1])['uid']
    except:
        return jsonify({'error': 'Invalid token'}), 401

    db = firestore.client()
    req_doc = db.collection('requests').document(request_id).get()
    if not req_doc.exists:
        return jsonify({'error': 'Request not found'}), 404
    req = req_doc.to_dict()
    if req['to'] != current_uid:
        return jsonify({'error': 'Not authorized'}), 403

    # update status
    db.collection('requests').document(request_id).update({'status': action})

    # remove request from both users
    db.collection('users').document(req['from']).update({
        'outgoingRequests': firestore.ArrayRemove([request_id])
    })
    db.collection('users').document(req['to']).update({
        'incomingRequests': firestore.ArrayRemove([request_id])
    })

    # block?
    if action == 'block':
        db.collection('users').document(current_uid).update({
            'blockedUsers': firestore.ArrayUnion([req['from']])
        })

    # accept: create chat
    if action == 'accept':
        chat_ref = db.collection('chats').document()
        chat_ref.set({
            'participants': [req['from'], req['to']],
            'isGroup': False,
            'lastUpdated': datetime.utcnow()
        })
        send_push(
            req['from'],
            title="Request Accepted",
            body="Your request was accepted! Say hello.",
            data={'chatId': chat_ref.id}
        )

    # notify requester
    send_push(
        req['from'],
        title=f"Request {action.title()}",
        body=f"Your request was {action}",
        data={'requestId': request_id}
    )

    return jsonify({'message': f'Request {action}ed'}), 200

@requests_bp.route('/blocked', methods=['GET', 'OPTIONS'])
@cross_origin()
def list_blocked():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    token_header = request.headers.get('Authorization', '')
    parts = token_header.split()
    try:
        uid = auth.verify_id_token(parts[1])['uid']
    except:
        return jsonify({'error': 'Invalid token'}), 401
    db = firestore.client()
    user = db.collection('users').document(uid).get().to_dict()
    return jsonify({'blocked': user.get('blockedUsers', [])}), 200

@requests_bp.route('/approved-friends', methods=['GET', 'OPTIONS'])
@cross_origin()
def approved_friends():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    token_header = request.headers.get('Authorization', '')
    parts = token_header.split()
    if len(parts) != 2 or parts[0] != 'Bearer':
        return jsonify({'error': 'Missing token'}), 401
    try:
        current_uid = auth.verify_id_token(parts[1])['uid']
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401

    db = firestore.client()

    # Accept any typical "accepted" status for safety
    ACCEPTED_STATUSES = {'accept', 'accepted', 'approved'}

    # Fetch requests where current user is 'from' or 'to' and status is in ACCEPTED_STATUSES
    approved_from = db.collection('requests') \
        .where('from', '==', current_uid).stream()
    approved_to = db.collection('requests') \
        .where('to', '==', current_uid).stream()

    friend_uids = set()
    for r in approved_from:
        rdata = r.to_dict()
        if rdata.get('status', '').lower() in ACCEPTED_STATUSES:
            friend_uids.add(rdata['to'])
    for r in approved_to:
        rdata = r.to_dict()
        if rdata.get('status', '').lower() in ACCEPTED_STATUSES:
            friend_uids.add(rdata['from'])

    # Fetch friend user display names (petProfile.name preferred)
    friends = []
    for fid in friend_uids:
        user_doc = db.collection('users').document(fid).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            pet_name = user_data.get('petProfile', {}).get('name')
            display_name = pet_name or user_data.get('displayName') or fid
            friends.append({
                'uid': fid,
                'displayName': display_name
            })

    return jsonify({'friends': friends}), 200


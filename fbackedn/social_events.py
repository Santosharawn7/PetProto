# social_events.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from datetime import datetime

events_bp = Blueprint('events_bp', __name__)

def _get_uid(req):
    hdr = req.headers.get('Authorization','').split()
    if len(hdr) != 2 or hdr[0] != 'Bearer':
        return None
    try:
        return auth.verify_id_token(hdr[1])['uid']
    except:
        return None

@events_bp.route('/events', methods=['GET','POST','OPTIONS'])
@cross_origin()
def events():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    db = firestore.client()

    if request.method == 'GET':
        # order_by with keyword arg and DESCENDING enum
        snaps = (
            db.collection('events')
              .order_by('createdAt', direction=firestore.Query.DESCENDING)
              .stream()
        )
        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            out.append(d)
        return jsonify({'events': out}), 200

    # POST: create event
    data = request.json or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    if not title:
        return jsonify({'error': 'Title required'}), 400

    ev = {
        'author': uid,
        'title': title,
        'description': description,
        'createdAt': datetime.utcnow()
    }
    ref = db.collection('events').document()
    ref.set(ev)
    return jsonify({'eventId': ref.id}), 201

@events_bp.route('/events/<event_id>/comments', methods=['GET','POST','OPTIONS'])
@cross_origin()
def comments(event_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    db = firestore.client()

    if request.method == 'GET':
        snaps = (
            db.collection('events')
              .document(event_id)
              .collection('comments')
              .order_by('createdAt', direction=firestore.Query.ASCENDING)
              .stream()
        )
        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            out.append(d)
        return jsonify({'comments': out}), 200

    # POST: add comment or reply
    data = request.json or {}
    text = data.get('text', '').strip()
    parent = data.get('parentCommentId')
    if not text:
        return jsonify({'error': 'Text required'}), 400

    c = {
        'author': uid,
        'text': text,
        'parentCommentId': parent,
        'createdAt': datetime.utcnow()
    }
    cref = (
        db.collection('events')
          .document(event_id)
          .collection('comments')
          .document()
    )
    cref.set(c)
    return jsonify({'commentId': cref.id}), 201

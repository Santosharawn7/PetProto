# social_reactions.py

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from datetime import datetime

# Define the Blueprint at the top!
reactions_bp = Blueprint('reactions_bp', __name__)

def _get_uid(req):
    hdr = req.headers.get('Authorization', '').split()
    if len(hdr) != 2 or hdr[0] != 'Bearer':
        return None
    try:
        return auth.verify_id_token(hdr[1])['uid']
    except:
        return None

@reactions_bp.route('/reactions', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def reactions():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    db = firestore.client()
    entityType = request.method == 'GET' and request.args.get('entityType') or (request.json or {}).get('entityType')
    entityId   = request.method == 'GET' and request.args.get('entityId')   or (request.json or {}).get('entityId')
    if not entityType or not entityId:
        if request.method == 'GET':
            return jsonify({'reactions': []}), 200
        return jsonify({'error': 'entityType and entityId required'}), 400

    coll_path = f'reactions/{entityType}_{entityId}/items'
    coll = db.collection(coll_path)

    # --- GET is public: Anyone can read reactions ---
    if request.method == 'GET':
        snaps = coll.stream()
        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            out.append(d)
        return jsonify({'reactions': out}), 200

    # --- POST requires authentication! ---
    uid = _get_uid(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    rtype = data.get('type')
    if not rtype:
        return jsonify({'error': 'type required'}), 400

    # Check for an existing reaction by this user
    existing = coll.where('user', '==', uid).limit(1).get()
    now = datetime.utcnow()
    if existing:
        # update the existing reaction
        doc_ref = existing[0].reference
        doc_ref.update({
            'type': rtype,
            'updatedAt': now
        })
        return jsonify({'message': 'Reaction updated'}), 200
    else:
        # create a new reaction
        new_ref = coll.document()
        new_ref.set({
            'user': uid,
            'type': rtype,
            'createdAt': now
        })
        return jsonify({'reactionId': new_ref.id}), 201

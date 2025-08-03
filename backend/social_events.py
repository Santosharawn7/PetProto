from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from google.api_core.retry import Retry
from google.api_core.exceptions import RetryError
from datetime import datetime, timedelta

events_bp = Blueprint('events_bp', __name__)
posts_bp  = Blueprint('posts_bp', __name__)

def _get_uid(req):
    hdr = req.headers.get('Authorization','').split()
    if len(hdr)!=2 or hdr[0]!='Bearer': 
        return None
    try:
        return auth.verify_id_token(hdr[1])['uid']
    except:
        return None

SHORT_RETRY = Retry(initial=1.0, maximum=10.0, multiplier=2.0, deadline=30.0)

### POSTS (Social feed) ###

@posts_bp.route('/posts', methods=['GET','POST','OPTIONS'])
@cross_origin()
def posts():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    db = firestore.client()

    if request.method == 'GET':
        # list all posts, most recent first
        try:
            snaps = db.collection('posts')\
                      .order_by('createdAt', direction=firestore.Query.DESCENDING)\
                      .stream(retry=SHORT_RETRY, timeout=30.0)
        except RetryError:
            return jsonify({'error':'Try again later'}),503

        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            # fetch author displayName
            user_snap = db.collection('users').document(d['author']).get()
            if user_snap.exists:
                user_data = user_snap.to_dict()
                d['authorName'] = user_data.get('displayName', '')
            else:
                d['authorName'] = ''
            out.append(d)

        return jsonify({'posts': out}), 200

    # POST: new social post
    data = request.json or {}
    title       = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    image       = data.get('image')  # URL string, optional
    if not title:
        return jsonify({'error':'Title required'}),400

    post = {
        'author': uid,
        'title': title,
        'description': description,
        'image': image,
        'createdAt': datetime.utcnow()
    }
    ref = db.collection('posts').document()
    ref.set(post)
    return jsonify({'postId': ref.id}), 201

# ---- Edit (PUT) a post ----
@posts_bp.route('/posts/<post_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@cross_origin()
def edit_or_delete_post(post_id):
    db = firestore.client()
    uid = _get_uid(request)
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    ref = db.collection('posts').document(post_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({'error': 'Not found'}), 404

    data = snap.to_dict()
    if data.get('author') != uid:
        return jsonify({'error': 'Forbidden'}), 403

    if request.method == 'PUT':
        update = request.json or {}
        update_fields = {}
        if 'title' in update:
            update_fields['title'] = (update['title'] or '').strip()
        if 'description' in update:
            update_fields['description'] = (update['description'] or '').strip()
        if 'image' in update:
            update_fields['image'] = update['image']
        if update_fields:
            update_fields['updatedAt'] = datetime.utcnow()
            ref.update(update_fields)
        return jsonify({'success': True}), 200

    elif request.method == 'DELETE':
        ref.delete()
        return jsonify({'success': True}), 200

@posts_bp.route('/posts/<post_id>/comments', methods=['GET','POST','OPTIONS'])
@cross_origin()
def post_comments(post_id):
    if request.method == 'OPTIONS':
        return jsonify({}),200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    db = firestore.client()

    if request.method == 'GET':
        try:
            snaps = db.collection('posts')\
                      .document(post_id)\
                      .collection('comments')\
                      .order_by('createdAt', direction=firestore.Query.ASCENDING)\
                      .stream(retry=SHORT_RETRY, timeout=30.0)
        except RetryError:
            return jsonify({'error':'Try again later'}),503

        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            # also add comment authorName
            auth_snap = db.collection('users').document(d['author']).get()
            if auth_snap.exists:
                ad = auth_snap.to_dict()
                d['authorName'] = ad.get('displayName','')
            else:
                d['authorName'] = ''
            out.append(d)

        return jsonify({'comments': out}), 200

    # POST a new comment or reply
    data = request.json or {}
    text   = (data.get('text') or '').strip()
    parent = data.get('parentCommentId')
    if not text:
        return jsonify({'error':'Text required'}),400

    c = {
        'author': uid,
        'text': text,
        'parentCommentId': parent,
        'createdAt': datetime.utcnow()
    }
    cref = db.collection('posts')\
             .document(post_id)\
             .collection('comments')\
             .document()
    cref.set(c)
    return jsonify({'commentId': cref.id}), 201

### EVENTS (Dedicated RSVP-capable events) ###

@events_bp.route('/events', methods=['GET','POST','OPTIONS'])
@cross_origin()
def events():
    if request.method == 'OPTIONS':
        return jsonify({}),200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    db = firestore.client()

    if request.method == 'GET':
        # pagination params
        limit = min(int(request.args.get('limit',100)), 500)
        after = request.args.get('after')  # ISO timestamp

        query = db.collection('events')
        if after:
            try:
                dt = datetime.fromisoformat(after)
                query = query.where('createdAt','<',dt)
            except ValueError:
                return jsonify({'error':'Invalid after timestamp'}),400

        query = query.order_by('createdAt', direction=firestore.Query.DESCENDING)\
                     .limit(limit)

        try:
            snaps = query.stream(retry=SHORT_RETRY, timeout=30.0)
        except RetryError:
            return jsonify({'error':'Try again later'}),503

        out = []
        now = datetime.utcnow()
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id

            # ARCHIVE logic: if event dateFilter exists and is in the past, don't show
            event_date_str = d.get('dateFilter')
            if event_date_str:
                try:
                    # Handles ISO or YYYY-MM-DD
                    event_date = datetime.fromisoformat(event_date_str)
                except Exception:
                    # fallback: just show if parse fails
                    event_date = None
                if event_date and event_date < (now - timedelta(days=0)):  # Show until midnight of event day
                    continue

            # fetch author displayName
            user_snap = db.collection('users').document(d['author']).get()
            if user_snap.exists:
                ud = user_snap.to_dict()
                d['authorName'] = ud.get('displayName','')
            else:
                d['authorName'] = ''
            out.append(d)

        return jsonify({'events': out}),200

    # POST: create an event
    data       = request.json or {}
    title      = (data.get('title') or '').strip()
    description= (data.get('description') or '').strip()
    dateFilter = data.get('dateFilter')
    location   = (data.get('location') or '').strip()
    photos     = data.get('photos') or []
    if not title:
        return jsonify({'error':'Title required'}),400

    ev = {
        'author'    : uid,
        'title'     : title,
        'description': description,
        'dateFilter': dateFilter,
        'location'  : location,
        'photos'    : photos,
        'createdAt' : datetime.utcnow()
    }
    ref = db.collection('events').document()
    ref.set(ev)
    return jsonify({'eventId': ref.id}), 201

# --- Edit (PUT) and Delete (DELETE) event ---
@events_bp.route('/events/<event_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@cross_origin()
def edit_or_delete_event(event_id):
    db = firestore.client()
    uid = _get_uid(request)
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    ref = db.collection('events').document(event_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({'error': 'Not found'}), 404

    data = snap.to_dict()
    if data.get('author') != uid:
        return jsonify({'error': 'Forbidden'}), 403

    if request.method == 'PUT':
        update = request.json or {}
        update_fields = {}
        if 'title' in update:
            update_fields['title'] = (update['title'] or '').strip()
        if 'description' in update:
            update_fields['description'] = (update['description'] or '').strip()
        if 'dateFilter' in update:
            update_fields['dateFilter'] = update['dateFilter']
        if 'location' in update:
            update_fields['location'] = (update['location'] or '').strip()
        if 'photos' in update:
            update_fields['photos'] = update['photos']
        if update_fields:
            update_fields['updatedAt'] = datetime.utcnow()
            ref.update(update_fields)
        return jsonify({'success': True}), 200

    elif request.method == 'DELETE':
        ref.delete()
        return jsonify({'success': True}), 200

@events_bp.route('/events/<event_id>/comments', methods=['GET','POST','OPTIONS'])
@cross_origin()
def comments(event_id):
    if request.method=='OPTIONS':
        return jsonify({}),200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    db = firestore.client()

    if request.method == 'GET':
        snaps = db.collection('events')\
                  .document(event_id)\
                  .collection('comments')\
                  .order_by('createdAt', direction=firestore.Query.ASCENDING)\
                  .stream(retry=SHORT_RETRY, timeout=30.0)

        out = []
        for s in snaps:
            d = s.to_dict()
            d['id'] = s.id
            # comment authorName
            auth_snap = db.collection('users').document(d['author']).get()
            if auth_snap.exists:
                ad = auth_snap.to_dict()
                d['authorName'] = ad.get('displayName','')
            else:
                d['authorName'] = ''
            out.append(d)

        return jsonify({'comments':out}),200

    data = request.json or {}
    text   = (data.get('text') or '').strip()
    parent = data.get('parentCommentId')
    if not text:
        return jsonify({'error':'Text required'}),400

    c = {
        'author': uid,
        'text': text,
        'parentCommentId': parent,
        'createdAt': datetime.utcnow()
    }
    cref = db.collection('events')\
             .document(event_id)\
             .collection('comments')\
             .document()
    cref.set(c)
    return jsonify({'commentId': cref.id}),201

@events_bp.route('/events/<event_id>/rsvp', methods=['POST','OPTIONS'])
@cross_origin()
def rsvp(event_id):
    if request.method=='OPTIONS':
        return jsonify({}),200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    data   = request.json or {}
    status = data.get('status')
    if status not in ('yes','no','maybe'):
        return jsonify({'error':'Invalid status'}),400

    db = firestore.client()
    ref = db.collection('events')\
            .document(event_id)\
            .collection('rsvps')\
            .document(uid)
    ref.set({
        'user'     : uid,
        'status'   : status,
        'updatedAt': datetime.utcnow()
    })
    return jsonify({'rsvpId': ref.id}),200

# ------ NEW: GET RSVP endpoint for event ---------

@events_bp.route('/events/<event_id>/rsvps', methods=['GET','OPTIONS'])
@cross_origin()
def get_rsvps(event_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({'error':'Unauthorized'}),401

    db = firestore.client()
    snaps = db.collection('events')\
              .document(event_id)\
              .collection('rsvps')\
              .stream()
    out = []
    for s in snaps:
        d = s.to_dict()
        d['id'] = s.id
        # get author/displayName for RSVP user
        user_snap = db.collection('users').document(d['user']).get()
        if user_snap.exists:
            user_data = user_snap.to_dict()
            d['userName'] = user_data.get('displayName', '')
        else:
            d['userName'] = ''
        out.append(d)
    return jsonify({'rsvps': out}), 200

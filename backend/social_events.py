# social_events.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore
from google.api_core.retry import Retry
from google.api_core.exceptions import RetryError
from google.cloud import firestore as gcf
from datetime import datetime, timedelta
import logging

# --- Logging setup ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# --- Blueprints ---
events_bp = Blueprint("events_bp", __name__)
posts_bp = Blueprint("posts_bp", __name__)

# --- Auth helper ---
def _get_uid(req):
    """Extract Firebase UID from Authorization: Bearer <token> header."""
    hdr = req.headers.get("Authorization", "").split()
    if len(hdr) != 2 or hdr[0] != "Bearer":
        logger.debug("Auth header missing/invalid")
        return None
    try:
        decoded = auth.verify_id_token(hdr[1])
        uid = decoded.get("uid")
        logger.debug("Verified Firebase token for uid=%s", uid)
        return uid
    except Exception as e:
        logger.warning("Token verification failed: %s", e)
        return None

# --- Firestore retry policy ---
SHORT_RETRY = Retry(initial=1.0, maximum=10.0, multiplier=2.0, deadline=30.0)

# --- Comment helpers ---
def _comments_ref(db, parent_type: str, parent_id: str):
    """
    parent_type: 'posts' or 'events'
    parent_id:   document id in that collection
    """
    return db.collection(parent_type).document(parent_id).collection("comments")


def _delete_comment_tree(db, parent_type: str, parent_id: str, comment_id: str):
    """
    Recursively delete a comment and all of its descendants.
    """
    logger.debug(
        "Hard-deleting comment tree: type=%s parent=%s comment=%s",
        parent_type, parent_id, comment_id
    )
    col = _comments_ref(db, parent_type, parent_id)

    # delete children first
    children = col.where("parentCommentId", "==", comment_id).stream()
    for ch in children:
        _delete_comment_tree(db, parent_type, parent_id, ch.id)

    # finally delete this node
    col.document(comment_id).delete()
    logger.debug("Deleted comment doc: %s", comment_id)

# =====================================================================
#                               POSTS
# =====================================================================

@posts_bp.route("/posts", methods=["GET", "POST", "OPTIONS"])
@cross_origin()
def posts():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()

    if request.method == "GET":
        # List all posts (newest first)
        try:
            snaps = (
                db.collection("posts")
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .stream(retry=SHORT_RETRY, timeout=30.0)
            )
        except RetryError:
            return jsonify({"error": "Try again later"}), 503

        out = []
        for s in snaps:
            d = s.to_dict()
            d["id"] = s.id
            # Attach author displayName
            user_snap = db.collection("users").document(d.get("author", "")).get()
            if user_snap.exists:
                user_data = user_snap.to_dict()
                d["authorName"] = user_data.get("displayName", "")
            else:
                d["authorName"] = ""
            out.append(d)

        return jsonify({"posts": out}), 200

    # Create a post
    data = request.json or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    image = data.get("image")
    if not title:
        return jsonify({"error": "Title required"}), 400

    post = {
        "author": uid,
        "title": title,
        "description": description,
        "image": image,
        "createdAt": datetime.utcnow(),
    }
    ref = db.collection("posts").document()
    ref.set(post)
    logger.debug("Created post id=%s author=%s", ref.id, uid)
    return jsonify({"postId": ref.id}), 201


@posts_bp.route("/posts/<post_id>", methods=["PUT", "DELETE", "OPTIONS"])
@cross_origin()
def edit_or_delete_post(post_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()
    ref = db.collection("posts").document(post_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "Not found"}), 404

    data = snap.to_dict()
    if data.get("author") != uid:
        return jsonify({"error": "Forbidden"}), 403

    if request.method == "PUT":
        update = request.json or {}
        update_fields = {}
        if "title" in update:
            update_fields["title"] = (update["title"] or "").strip()
        if "description" in update:
            update_fields["description"] = (update["description"] or "").strip()
        if "image" in update:
            update_fields["image"] = update["image"]
        if update_fields:
            update_fields["updatedAt"] = datetime.utcnow()
            ref.update(update_fields)
            logger.debug("Updated post %s fields=%s", post_id, list(update_fields.keys()))
        return jsonify({"success": True}), 200

    # DELETE post
    # (If you want to also delete its comments, uncomment the block below.)
    # for c in ref.collection("comments").stream():
    #     _delete_comment_tree(db, "posts", post_id, c.id)
    ref.delete()
    logger.debug("Deleted post %s", post_id)
    return jsonify({"success": True}), 200


@posts_bp.route("/posts/<post_id>/comments", methods=["GET", "POST", "OPTIONS"])
@cross_origin()
def post_comments(post_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()

    if request.method == "GET":
        include_deleted = request.args.get("include_deleted", "false").lower() == "true"
        try:
            snaps = (
                db.collection("posts")
                .document(post_id)
                .collection("comments")
                .order_by("createdAt", direction=firestore.Query.ASCENDING)
                .stream(retry=SHORT_RETRY, timeout=30.0)
            )
        except RetryError:
            return jsonify({"error": "Try again later"}), 503

        out = []
        for s in snaps:
            d = s.to_dict()
            if not include_deleted and d.get("deleted") is True:
                continue  # hide soft-deleted comments by default
            d["id"] = s.id
            auth_snap = db.collection("users").document(d.get("author", "")).get()
            if auth_snap.exists:
                ad = auth_snap.to_dict()
                d["authorName"] = ad.get("displayName", "")
            else:
                d["authorName"] = ""
            out.append(d)

        return jsonify({"comments": out}), 200

    # POST a new comment (or reply)
    data = request.json or {}
    text = (data.get("text") or "").strip()
    parent = data.get("parentCommentId")
    if not text:
        return jsonify({"error": "Text required"}), 400

    c = {
        "author": uid,
        "text": text,
        "parentCommentId": parent,
        "createdAt": datetime.utcnow(),
    }
    cref = (
        db.collection("posts")
        .document(post_id)
        .collection("comments")
        .document()
    )
    cref.set(c)
    logger.debug("Created comment %s on post %s by %s", cref.id, post_id, uid)
    return jsonify({"commentId": cref.id}), 201


@posts_bp.route("/posts/<post_id>/comments/<comment_id>", methods=["PUT", "DELETE", "OPTIONS"])
@cross_origin()
def edit_or_delete_post_comment(post_id, comment_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()
    cref = db.collection("posts").document(post_id).collection("comments").document(comment_id)
    snap = cref.get()
    if not snap.exists:
        return jsonify({"error": "Not found"}), 404
    data = snap.to_dict()

    if data.get("author") != uid:
        return jsonify({"error": "Forbidden"}), 403

    if request.method == "PUT":
        body = request.json or {}
        new_text = (body.get("text") or "").strip()
        if not new_text:
            return jsonify({"error": "Text required"}), 400
        cref.update({"text": new_text, "updatedAt": datetime.utcnow(), "deleted": gcf.DELETE_FIELD})
        logger.debug("Edited comment %s on post %s", comment_id, post_id)
        return jsonify({"success": True}), 200

    # DELETE
    soft = False
    mode_q = (request.args.get("mode") or "").lower()
    if mode_q == "soft":
        soft = True
    else:
        jb = request.json or {}
        soft = bool(jb.get("soft"))

    if soft:
        cref.update({
            "text": "[deleted]",
            "deleted": True,
            "updatedAt": datetime.utcnow()
        })
        logger.debug("Soft-deleted comment %s on post %s", comment_id, post_id)
    else:
        _delete_comment_tree(db, "posts", post_id, comment_id)
        logger.debug("Hard-deleted comment %s on post %s", comment_id, post_id)

    return jsonify({"success": True}), 200


# =====================================================================
#                               EVENTS
# =====================================================================

@events_bp.route("/events", methods=["GET", "POST", "OPTIONS"])
@cross_origin()
def events():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()

    if request.method == "GET":
        # Pagination params
        limit = min(int(request.args.get("limit", 100)), 500)
        after = request.args.get("after")  # ISO timestamp

        query = db.collection("events")
        if after:
            try:
                dt = datetime.fromisoformat(after)
                query = query.where("createdAt", "<", dt)
            except ValueError:
                return jsonify({"error": "Invalid after timestamp"}), 400

        query = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit)

        try:
            snaps = query.stream(retry=SHORT_RETRY, timeout=30.0)
        except RetryError:
            return jsonify({"error": "Try again later"}), 503

        out = []
        now = datetime.utcnow()
        for s in snaps:
            d = s.to_dict()
            d["id"] = s.id

            # Archive logic (hide past events if dateFilter is present)
            event_date_str = d.get("dateFilter")
            if event_date_str:
                try:
                    event_date = datetime.fromisoformat(event_date_str)
                except Exception:
                    event_date = None
                if event_date and event_date < (now - timedelta(days=0)):
                    continue

            user_snap = db.collection("users").document(d.get("author", "")).get()
            if user_snap.exists:
                ud = user_snap.to_dict()
                d["authorName"] = ud.get("displayName", "")
            else:
                d["authorName"] = ""
            out.append(d)

        return jsonify({"events": out}), 200

    # Create event
    data = request.json or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    dateFilter = data.get("dateFilter")
    location = (data.get("location") or "").strip()
    photos = data.get("photos") or []
    if not title:
        return jsonify({"error": "Title required"}), 400

    ev = {
        "author": uid,
        "title": title,
        "description": description,
        "dateFilter": dateFilter,
        "location": location,
        "photos": photos,
        "createdAt": datetime.utcnow(),
    }
    ref = db.collection("events").document()
    ref.set(ev)
    logger.debug("Created event id=%s author=%s", ref.id, uid)
    return jsonify({"eventId": ref.id}), 201


@events_bp.route("/events/<event_id>", methods=["PUT", "DELETE", "OPTIONS"])
@cross_origin()
def edit_or_delete_event(event_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()
    ref = db.collection("events").document(event_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"error": "Not found"}), 404

    data = snap.to_dict()
    if data.get("author") != uid:
        return jsonify({"error": "Forbidden"}), 403

    if request.method == "PUT":
        update = request.json or {}
        update_fields = {}
        if "title" in update:
            update_fields["title"] = (update["title"] or "").strip()
        if "description" in update:
            update_fields["description"] = (update["description"] or "").strip()
        if "dateFilter" in update:
            update_fields["dateFilter"] = update["dateFilter"]
        if "location" in update:
            update_fields["location"] = (update["location"] or "").strip()
        if "photos" in update:
            update_fields["photos"] = update["photos"]
        if update_fields:
            update_fields["updatedAt"] = datetime.utcnow()
            ref.update(update_fields)
            logger.debug("Updated event %s fields=%s", event_id, list(update_fields.keys()))
        return jsonify({"success": True}), 200

    # DELETE event
    # (If you want to also delete its comments, uncomment the block below.)
    # for c in ref.collection("comments").stream():
    #     _delete_comment_tree(db, "events", event_id, c.id)
    ref.delete()
    logger.debug("Deleted event %s", event_id)
    return jsonify({"success": True}), 200


@events_bp.route("/events/<event_id>/comments", methods=["GET", "POST", "OPTIONS"])
@cross_origin()
def event_comments(event_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()

    if request.method == "GET":
        include_deleted = request.args.get("include_deleted", "false").lower() == "true"
        snaps = (
            db.collection("events")
            .document(event_id)
            .collection("comments")
            .order_by("createdAt", direction=firestore.Query.ASCENDING)
            .stream(retry=SHORT_RETRY, timeout=30.0)
        )
        out = []
        for s in snaps:
            d = s.to_dict()
            if not include_deleted and d.get("deleted") is True:
                continue
            d["id"] = s.id
            auth_snap = db.collection("users").document(d.get("author", "")).get()
            if auth_snap.exists:
                ad = auth_snap.to_dict()
                d["authorName"] = ad.get("displayName", "")
            else:
                d["authorName"] = ""
            out.append(d)

        return jsonify({"comments": out}), 200

    # POST comment
    data = request.json or {}
    text = (data.get("text") or "").strip()
    parent = data.get("parentCommentId")
    if not text:
        return jsonify({"error": "Text required"}), 400

    c = {
        "author": uid,
        "text": text,
        "parentCommentId": parent,
        "createdAt": datetime.utcnow(),
    }
    cref = (
        db.collection("events")
        .document(event_id)
        .collection("comments")
        .document()
    )
    cref.set(c)
    logger.debug("Created comment %s on event %s by %s", cref.id, event_id, uid)
    return jsonify({"commentId": cref.id}), 201


@events_bp.route("/events/<event_id>/comments/<comment_id>", methods=["PUT", "DELETE", "OPTIONS"])
@cross_origin()
def edit_or_delete_event_comment(event_id, comment_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()
    cref = db.collection("events").document(event_id).collection("comments").document(comment_id)
    snap = cref.get()
    if not snap.exists:
        return jsonify({"error": "Not found"}), 404
    data = snap.to_dict()

    if data.get("author") != uid:
        return jsonify({"error": "Forbidden"}), 403

    if request.method == "PUT":
        body = request.json or {}
        new_text = (body.get("text") or "").strip()
        if not new_text:
            return jsonify({"error": "Text required"}), 400
        cref.update({"text": new_text, "updatedAt": datetime.utcnow(), "deleted": gcf.DELETE_FIELD})
        logger.debug("Edited comment %s on event %s", comment_id, event_id)
        return jsonify({"success": True}), 200

    # DELETE
    soft = False
    mode_q = (request.args.get("mode") or "").lower()
    if mode_q == "soft":
        soft = True
    else:
        jb = request.json or {}
        soft = bool(jb.get("soft"))

    if soft:
        cref.update({
            "text": "[deleted]",
            "deleted": True,
            "updatedAt": datetime.utcnow()
        })
        logger.debug("Soft-deleted comment %s on event %s", comment_id, event_id)
    else:
        _delete_comment_tree(db, "events", event_id, comment_id)
        logger.debug("Hard-deleted comment %s on event %s", comment_id, event_id)

    return jsonify({"success": True}), 200


# =====================================================================
#                                 RSVPs
# =====================================================================

@events_bp.route("/events/<event_id>/rsvp", methods=["POST", "OPTIONS"])
@cross_origin()
def rsvp(event_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    status = data.get("status")
    if status not in ("yes", "no", "maybe"):
        return jsonify({"error": "Invalid status"}), 400

    db = firestore.client()
    ref = db.collection("events").document(event_id).collection("rsvps").document(uid)
    ref.set({"user": uid, "status": status, "updatedAt": datetime.utcnow()})
    logger.debug("RSVP %s by %s on event %s", status, uid, event_id)
    return jsonify({"rsvpId": ref.id}), 200


@events_bp.route("/events/<event_id>/rsvps", methods=["GET", "OPTIONS"])
@cross_origin()
def get_rsvps(event_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    uid = _get_uid(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    db = firestore.client()
    snaps = db.collection("events").document(event_id).collection("rsvps").stream()
    out = []
    for s in snaps:
        d = s.to_dict()
        d["id"] = s.id
        user_snap = db.collection("users").document(d.get("user", "")).get()
        if user_snap.exists:
            user_data = user_snap.to_dict()
            d["userName"] = user_data.get("displayName", "")
        else:
            d["userName"] = ""
        out.append(d)
    return jsonify({"rsvps": out}), 200
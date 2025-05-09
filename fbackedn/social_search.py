# social_search.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from firebase_admin import auth, firestore

search_bp = Blueprint('search_bp', __name__)

@search_bp.route('/search-users', methods=['GET','OPTIONS'])
@cross_origin()
def search_users():
    if request.method=='OPTIONS':
        return jsonify({}),200
    token = request.headers.get('Authorization','').split()
    try:
        auth.verify_id_token(token[1])
    except:
        return jsonify({'error':'Unauthorized'}),401

    q = request.args.get('q','').lower().strip()
    if not q:
        return jsonify({'users':[]}),200

    db = firestore.client()
    # three separate queries then merge
    results = {}
    for field in ('displayName','email','phone'):
        snaps = db.collection('users')\
                  .where(field, '>=', q)\
                  .where(field, '<=', q + '\uf8ff')\
                  .stream()
        for s in snaps:
            d=s.to_dict()
            results[s.id] = {'uid':s.id, 'displayName':d.get('displayName'), 'email':d.get('email'), 'phone':d.get('phone')}
    return jsonify({'users': list(results.values())}),200

# firestore_fix_user_types.py
from firebase_admin import firestore, initialize_app

# Run only ONCE!
initialize_app()
db = firestore.client()

fix_map = {
    "Pet Parent": "pet_parent",
    "Pet Shop Owner": "pet_shop_owner",
    "Veterinarian": "veterinarian",
    "Pet Sitter": "pet_sitter",
    "Admin": "admin"
}

users_ref = db.collection('users')
for doc in users_ref.stream():
    data = doc.to_dict()
    if "userType" in data and data["userType"] in fix_map:
        doc.reference.update({"userType": fix_map[data["userType"]]})
        print(f"Updated {doc.id}: {data['userType']} -> {fix_map[data['userType']]}")

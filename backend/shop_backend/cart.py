from flask import Blueprint, jsonify, request
from shop_backend.models import CartItem, Product, db

cart_bp = Blueprint('cart_bp', __name__)

@cart_bp.route('/api/cart/<session_id>', methods=['GET'])
def get_cart(session_id):
    items = CartItem.query.filter_by(session_id=session_id).all()
    return jsonify([i.to_dict() for i in items])

@cart_bp.route('/api/cart', methods=['POST', 'OPTIONS'])
def add_to_cart():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    session_id = data.get('session_id')

    if not all([product_id, session_id]):
        return jsonify({'error': 'Missing required fields'}), 400

    existing_item = CartItem.query.filter_by(product_id=product_id, session_id=session_id).first()
    if existing_item:
        existing_item.quantity += quantity
    else:
        cart_item = CartItem(product_id=product_id, quantity=quantity, session_id=session_id)
        db.session.add(cart_item)

    db.session.commit()
    return jsonify({'message': 'Item added to cart successfully'})

@cart_bp.route('/api/cart/<int:item_id>', methods=['PUT', 'OPTIONS'])
def update_cart_item(item_id):
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    quantity = data.get('quantity')
    if quantity is None:
        return jsonify({'error': 'Quantity is required'}), 400

    cart_item = CartItem.query.get_or_404(item_id)

    # If client sends 0 or negative, you may choose to delete instead.
    # For now we just set whatever quantity is provided.
    cart_item.quantity = quantity
    db.session.commit()
    return jsonify(cart_item.to_dict())

@cart_bp.route('/api/cart/<int:item_id>', methods=['DELETE', 'OPTIONS'])
def remove_cart_item(item_id):
    if request.method == 'OPTIONS':
        return '', 200

    cart_item = CartItem.query.get_or_404(item_id)
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'message': 'Item removed from cart successfully'})
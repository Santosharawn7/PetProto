from flask import Blueprint, jsonify, request
from shop_backend.models import Order, OrderItem, CartItem, Product, db

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return '', 204   # 204 is the common CORS preflight response
    data = request.get_json()
    session_id = data.get('session_id')
    shipping_address = data.get('shipping_address', '')
    buyer_name = data.get('buyer_name', '')
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400
    cart_items = CartItem.query.filter_by(session_id=session_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    total_amount = sum(item.product.price * item.quantity for item in cart_items)
    order = Order(
        session_id=session_id,
        total_amount=total_amount,
        shipping_address=shipping_address,
        buyer_name=buyer_name
    )
    db.session.add(order)
    db.session.flush()
    for cart_item in cart_items:
        if cart_item.product.stock >= cart_item.quantity:
            cart_item.product.stock -= cart_item.quantity
        else:
            return jsonify({'error': f'Not enough stock for {cart_item.product.name}'}), 400
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price=cart_item.product.price
        )
        db.session.add(order_item)
    CartItem.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    return jsonify(order.to_dict())

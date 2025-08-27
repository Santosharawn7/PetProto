# backend/shop_backend/orders.py
from flask import Blueprint, jsonify, request
from shop_backend.models import Order, OrderItem, CartItem, Product, db

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        # CORS preflight
        return '', 204

    data = request.get_json() or {}
    session_id = data.get('session_id')
    shipping_address = data.get('shipping_address', '')
    buyer_name = data.get('buyer_name', '')

    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400

    cart_items = CartItem.query.filter_by(session_id=session_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400

    # Calculate total
    total_amount = 0.0
    for item in cart_items:
        # guard against missing product
        if not item.product:
            return jsonify({'error': f'Product not found for cart item {item.id}'}), 400
        total_amount += float(item.product.price) * int(item.quantity)

    # Create order (keep status simple; you can switch to 'paid' after payment later)
    order = Order(
        session_id=session_id,
        total_amount=total_amount,
        status='pending',
        shipping_address=shipping_address,
        buyer_name=buyer_name
    )
    db.session.add(order)
    db.session.flush()  # get order.id

    # Convert cart items to order items & decrement stock
    for cart_item in cart_items:
        product: Product = cart_item.product
        qty = int(cart_item.quantity or 0)

        if int(product.stock or 0) < qty:
            db.session.rollback()
            return jsonify({'error': f'Not enough stock for {product.name}'}), 400

        # decrement stock
        product.stock = int(product.stock or 0) - qty

        db.session.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            price=float(product.price)  # unit price at purchase time
        ))

    # clear cart
    CartItem.query.filter_by(session_id=session_id).delete()

    db.session.commit()

    # IMPORTANT: return a flat object with id so frontend sees response.data.id
    return jsonify({
        'id': order.id,
        'status': order.status,
        'total_amount': float(order.total_amount),
        'buyer_name': order.buyer_name,
        'shipping_address': order.shipping_address
    })

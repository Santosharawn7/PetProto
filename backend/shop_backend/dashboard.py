from flask import Blueprint, jsonify, request
from shop_backend.models import Product, OrderItem, Order
from shop_backend.helpers import parse_address

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    products = Product.query.all()
    dashboard_data = []
    for product in products:
        order_items = OrderItem.query.filter_by(product_id=product.id).all()
        sold_quantity = sum(item.quantity for item in order_items)
        buyers = []
        for item in order_items:
            order = Order.query.get(item.order_id)
            if order:
                phone, location = parse_address(order.shipping_address or '')
                buyers.append({
                    'buyer_name': order.buyer_name or '',
                    'product_name': product.name,
                    'quantity': item.quantity,
                    'price_paid': item.price,
                    'payment_method': 'PayPal',
                    'phone_number': phone,
                    'location': location
                })
        dashboard_data.append({
            'id': product.id,
            'title': product.name,
            'image_url': product.image_url,
            'stock': product.stock,
            'sold': sold_quantity,
            'buyers': buyers
        })
    return jsonify(dashboard_data)

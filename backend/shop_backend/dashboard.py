# backend/shop_backend/dashboard.py
from flask import Blueprint, jsonify, request
from shop_backend.models import Product, OrderItem, Order
from shop_backend.helpers import parse_address

dashboard_bp = Blueprint('dashboard_bp', __name__)

def _buyers_for_product(product_id: int, product_name: str):
    """
    Build the buyers list for a product.
    """
    order_items = OrderItem.query.filter_by(product_id=product_id).all()
    buyers = []
    for item in order_items:
        order = Order.query.get(item.order_id)
        if not order:
            continue
        phone, location = parse_address(order.shipping_address or "")
        buyers.append({
            "buyer_name": order.buyer_name or "",
            "product_name": product_name,
            "quantity": int(item.quantity or 0),
            "price_paid": float(item.price or 0),     # unit price
            "payment_method": getattr(order, "payment_method", None) or "PayPal",
            "phone_number": phone,
            "location": location,
        })
    return buyers, order_items

def _product_row(product: Product):
    buyers, order_items = _buyers_for_product(product.id, product.name)
    sold_quantity = sum(int(oi.quantity or 0) for oi in order_items)

    return {
        "id": product.id,
        "name": product.name,                    # the key your React uses
        "image_url": product.image_url,
        "category": getattr(product, "category", None),
        "stock": int(product.stock or 0),
        "sold": int(sold_quantity),
        "buyers": buyers,                        # always provide an array
        "price": float(getattr(product, "price", 0) or 0),
        "description": getattr(product, "description", None),
    }

# Admin – all products (useful for debugging)
@dashboard_bp.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    products = Product.query.all()
    rows = [_product_row(p) for p in products]
    # wrap to match your frontend fetchProducts() expectation
    return jsonify({"products": rows})

# Owner view – what your React is calling in fetchProducts()
@dashboard_bp.route('/api/my-products', methods=['GET'])
def my_products():
    """
    Optionally scope by owner. If you don't send a header, it will return all products.
    To scope, send:  X-USER-ID: <owner_uid>
    """
    owner_id = request.headers.get("X-USER-ID")
    q = Product.query
    if owner_id and hasattr(Product, "owner_uid"):
        q = q.filter_by(owner_uid=owner_id)

    products = q.all()
    rows = [_product_row(p) for p in products]
    return jsonify({"products": rows})

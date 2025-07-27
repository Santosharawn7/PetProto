# shop_backend/products.py

from flask import Blueprint, jsonify, request
from shop_backend.models import Product, db
from shop_backend.auth_utils import require_auth, require_owner

products_bp = Blueprint('products_bp', __name__)

@products_bp.route('/api/products', methods=['GET'])
def get_products():
    """Get all products in the database"""
    try:
        products = Product.query.all()
        return jsonify([p.to_dict() for p in products])
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Failed to fetch products'}), 500

@products_bp.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories"""
    try:
        categories = db.session.query(Product.category).distinct().all()
        return jsonify([c[0] for c in categories if c[0]])
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500

@products_bp.route('/api/upload-item', methods=['POST', 'OPTIONS'])
@require_auth
@require_owner
def upload_item():
    """Upload a new product to the database (Pet Shop Owners only)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Get the request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'price', 'stock']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None or data[field] == '']
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate data types and values
        try:
            price = float(data['price'])
            if price <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid price format'}), 400
        
        try:
            stock = int(data['stock'])
            if stock < 0:
                return jsonify({'error': 'Stock cannot be negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid stock format'}), 400
        
        # Get UID from the authenticated user (set by require_auth decorator)
        uid = request.user.get('uid')
        if not uid:
            return jsonify({'error': 'User authentication failed'}), 401
        
        # Optional: Get additional user data from Firestore (set by require_owner decorator)
        user_data = getattr(request, 'user_data', {})
        print(f"📦 Creating product for user: {user_data.get('firstName', 'Unknown')} ({uid})")
        
        # Validate and clean the input data
        name = data['name'].strip()
        if len(name) > 100:
            return jsonify({'error': 'Product name too long (max 100 characters)'}), 400
        
        description = data.get('description', '').strip()
        if len(description) > 1000:
            return jsonify({'error': 'Description too long (max 1000 characters)'}), 400
        
        category = data.get('category', '').strip()
        if len(category) > 50:
            return jsonify({'error': 'Category name too long (max 50 characters)'}), 400
        
        image_url = data.get('image_url', '').strip()
        if image_url and len(image_url) > 500:
            return jsonify({'error': 'Image URL too long (max 500 characters)'}), 400
        
        # Check if product with same name already exists for this owner
        existing_product = Product.query.filter_by(name=name, owner_uid=uid).first()
        if existing_product:
            return jsonify({
                'error': 'You already have a product with this name. Please choose a different name.'
            }), 409
        
        # Create new product
        new_product = Product(
            name=name,
            description=description,
            price=price,
            image_url=image_url if image_url else None,
            category=category if category else None,
            stock=stock,
            owner_uid=uid
        )
        
        # Add to database
        db.session.add(new_product)
        db.session.commit()
        
        print(f"✅ Product created successfully: {new_product.name} (ID: {new_product.id})")
        
        # Return success response with the created product data
        return jsonify({
            'message': 'Product uploaded successfully!',
            'product': new_product.to_dict()
        }), 201
        
    except Exception as e:
        # Rollback the transaction in case of error
        db.session.rollback()
        print(f"❌ Error uploading product: {e}")
        return jsonify({
            'error': 'Failed to upload product. Please try again.',
            'debug': str(e) if request.args.get('debug') else None
        }), 500

@products_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product by ID"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(product.to_dict())
    except Exception as e:
        print(f"Error fetching product {product_id}: {e}")
        return jsonify({'error': 'Failed to fetch product'}), 500

@products_bp.route('/api/products/<int:product_id>', methods=['PUT'])
@require_auth
@require_owner
def update_product(product_id):
    """Update a product (only by the owner)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Get the product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if the user owns this product
        uid = request.user.get('uid')
        if product.owner_uid != uid:
            return jsonify({'error': 'You can only update your own products'}), 403
        
        # Get update data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Product name cannot be empty'}), 400
            if len(name) > 100:
                return jsonify({'error': 'Product name too long (max 100 characters)'}), 400
            product.name = name
        
        if 'description' in data:
            description = data['description'].strip()
            if len(description) > 1000:
                return jsonify({'error': 'Description too long (max 1000 characters)'}), 400
            product.description = description
        
        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'error': 'Price must be greater than 0'}), 400
                product.price = price
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid price format'}), 400
        
        if 'stock' in data:
            try:
                stock = int(data['stock'])
                if stock < 0:
                    return jsonify({'error': 'Stock cannot be negative'}), 400
                product.stock = stock
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid stock format'}), 400
        
        if 'category' in data:
            category = data['category'].strip()
            if len(category) > 50:
                return jsonify({'error': 'Category name too long (max 50 characters)'}), 400
            product.category = category if category else None
        
        if 'image_url' in data:
            image_url = data['image_url'].strip()
            if image_url and len(image_url) > 500:
                return jsonify({'error': 'Image URL too long (max 500 characters)'}), 400
            product.image_url = image_url if image_url else None
        
        # Commit changes
        db.session.commit()
        
        print(f"✅ Product updated successfully: {product.name} (ID: {product.id})")
        
        return jsonify({
            'message': 'Product updated successfully!',
            'product': product.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating product {product_id}: {e}")
        return jsonify({
            'error': 'Failed to update product. Please try again.',
            'debug': str(e) if request.args.get('debug') else None
        }), 500

@products_bp.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_auth
@require_owner
def delete_product(product_id):
    """Delete a product (only by the owner)"""
    try:
        # Get the product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if the user owns this product
        uid = request.user.get('uid')
        if product.owner_uid != uid:
            return jsonify({'error': 'You can only delete your own products'}), 403
        
        # Store product name for logging
        product_name = product.name
        
        # Delete the product
        db.session.delete(product)
        db.session.commit()
        
        print(f"✅ Product deleted successfully: {product_name} (ID: {product_id})")
        
        return jsonify({
            'message': f'Product "{product_name}" deleted successfully!'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting product {product_id}: {e}")
        return jsonify({
            'error': 'Failed to delete product. Please try again.',
            'debug': str(e) if request.args.get('debug') else None
        }), 500

@products_bp.route('/api/my-products', methods=['GET'])
@require_auth
@require_owner
def get_my_products():
    """Get all products belonging to the authenticated shop owner"""
    try:
        uid = request.user.get('uid')
        products = Product.query.filter_by(owner_uid=uid).all()
        
        return jsonify({
            'products': [p.to_dict() for p in products],
            'count': len(products)
        })
        
    except Exception as e:
        print(f"❌ Error fetching user products: {e}")
        return jsonify({
            'error': 'Failed to fetch your products. Please try again.',
            'debug': str(e) if request.args.get('debug') else None
        }), 500
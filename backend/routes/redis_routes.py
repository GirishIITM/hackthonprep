from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.redis_utils import RedisCache, SessionCache, RateLimiter, PubSubManager, CacheDecorator
from extensions import redis_client

redis_bp = Blueprint('redis', __name__, url_prefix='/redis')

@redis_bp.route('/test', methods=['GET'])
def test_redis():
    """Test Redis connection and basic operations."""
    try:
        # Test basic set/get
        test_key = 'test_key'
        test_value = 'hello world from flask'
        
        success = RedisCache.set(test_key, test_value, 60)  # 60 seconds expiration
        if not success:
            return jsonify({'error': 'Failed to set value in Redis'}), 500
        
        retrieved_value = RedisCache.get(test_key)
        
        return jsonify({
            'message': 'Redis test successful',
            'test_key': test_key,
            'set_value': test_value,
            'retrieved_value': retrieved_value,
            'match': test_value == retrieved_value
        })
    except Exception as e:
        return jsonify({'error': f'Redis test failed: {str(e)}'}), 500

@redis_bp.route('/cache', methods=['POST'])
@jwt_required()
def cache_data():
    """Cache user data with expiration."""
    try:
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        expiration = data.get('expiration', 300)  # Default 5 minutes
        
        if not key or value is None:
            return jsonify({'error': 'Key and value are required'}), 400
        
        # Prefix with user ID for isolation
        user_id = get_jwt_identity()
        cache_key = f"user:{user_id}:cache:{key}"
        
        success = RedisCache.set(cache_key, value, expiration)
        
        return jsonify({
            'success': success,
            'message': f'Data cached for {expiration} seconds' if success else 'Failed to cache data',
            'key': cache_key
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/cache/<key>', methods=['GET'])
@jwt_required()
def get_cached_data(key):
    """Retrieve cached user data."""
    try:
        user_id = get_jwt_identity()
        cache_key = f"user:{user_id}:cache:{key}"
        
        value = RedisCache.get(cache_key)
        
        return jsonify({
            'key': cache_key,
            'value': value,
            'exists': value is not None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/rate-limit/test', methods=['POST'])
def test_rate_limit():
    """Test rate limiting functionality."""
    try:
        data = request.get_json() or {}
        identifier = data.get('identifier', request.remote_addr)
        limit = data.get('limit', 5)
        window = data.get('window', 60)  # 60 seconds
        
        is_limited, remaining = RateLimiter.is_rate_limited(identifier, limit, window)
        
        if is_limited:
            return jsonify({
                'error': 'Rate limit exceeded',
                'limit': limit,
                'window': window,
                'remaining': remaining
            }), 429
        
        return jsonify({
            'message': 'Request allowed',
            'limit': limit,
            'window': window,
            'remaining': remaining
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/session/create', methods=['POST'])
@jwt_required()
def create_session():
    """Create a session in Redis."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        session_data = {
            'user_agent': request.headers.get('User-Agent', ''),
            'ip_address': request.remote_addr,
            'additional_data': data
        }
        
        session_id = SessionCache.create_session(user_id, session_data)
        
        if session_id:
            return jsonify({
                'session_id': session_id,
                'message': 'Session created successfully'
            })
        else:
            return jsonify({'error': 'Failed to create session'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Retrieve session data."""
    try:
        session_data = SessionCache.get_session(session_id)
        
        if session_data:
            return jsonify({
                'session_id': session_id,
                'session_data': session_data
            })
        else:
            return jsonify({'error': 'Session not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/notify', methods=['POST'])
@jwt_required()
def send_notification():
    """Send a real-time notification via Redis pub/sub."""
    try:
        data = request.get_json()
        notification_type = data.get('type', 'info')
        message = data.get('message', 'Test notification')
        target_user_id = data.get('target_user_id')
        
        current_user_id = get_jwt_identity()
        
        notification_data = {
            'from_user_id': current_user_id,
            'message': message,
            'type': notification_type
        }
        
        if target_user_id:
            # Send to specific user
            success = PubSubManager.publish_user_notification(
                target_user_id, notification_type, notification_data
            )
        else:
            # Broadcast notification
            success = PubSubManager.publish_notification(
                'global:notifications', notification_data
            )
        
        return jsonify({
            'success': success,
            'message': 'Notification sent' if success else 'Failed to send notification'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@redis_bp.route('/stats', methods=['GET'])
def redis_stats():
    """Get Redis connection and usage statistics."""
    try:
        if not redis_client:
            return jsonify({'error': 'Redis not available'}), 500
        
        # Get Redis info
        info = redis_client.info()
        
        # Get some key statistics
        stats = {
            'connected': True,
            'redis_version': info.get('redis_version'),
            'used_memory': info.get('used_memory_human'),
            'connected_clients': info.get('connected_clients'),
            'total_commands_processed': info.get('total_commands_processed'),
            'keyspace_hits': info.get('keyspace_hits'),
            'keyspace_misses': info.get('keyspace_misses'),
            'uptime_in_seconds': info.get('uptime_in_seconds')
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        }), 500

# Example of using the cache decorator
@redis_bp.route('/expensive-operation', methods=['GET'])
@CacheDecorator.cache(expiration=300, key_prefix="expensive:")
def expensive_operation():
    """Simulate an expensive operation with caching."""
    import time
    import random
    
    # Simulate expensive computation
    time.sleep(2)  # 2 second delay
    result = {
        'computed_value': random.randint(1000, 9999),
        'timestamp': time.time(),
        'message': 'This was an expensive operation that took 2 seconds'
    }
    
    return jsonify(result)

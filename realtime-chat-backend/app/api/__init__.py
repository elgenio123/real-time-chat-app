from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint("api", __name__)

# Import sub-blueprints
from app.api.auth import auth_bp
# from app.api.users import users_bp
# from app.api.chats import chats_bp
# from app.api.messages import messages_bp

# Register sub-blueprints
api_bp.register_blueprint(auth_bp, url_prefix="/auth")
# api_bp.register_blueprint(users_bp, url_prefix="/users")
# api_bp.register_blueprint(chats_bp, url_prefix="/chats")
# api_bp.register_blueprint(messages_bp, url_prefix="/messages")

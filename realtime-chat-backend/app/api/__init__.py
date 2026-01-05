from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint("api", __name__)

# Import sub-blueprints
from app.api.auth import auth_bp
from app.api.users import user_bp
from app.api.messages import messages_bp
from app.api.files import files_bp

# Register sub-blueprints
api_bp.register_blueprint(auth_bp, url_prefix="/auth")
api_bp.register_blueprint(user_bp, url_prefix="/users")
api_bp.register_blueprint(messages_bp, url_prefix="")
api_bp.register_blueprint(files_bp, url_prefix="/files")

@api_bp.route("/", methods=["GET"])
def index():
    return {"message": "Welcome to the Real-time Chat API"}, 200
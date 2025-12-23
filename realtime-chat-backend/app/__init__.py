from flask import Flask
from app.config import Config
from app.extensions import init_extensions

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)
    from app.models import user

    # from app.api.auth import auth_bp
    # from app.api.messages import messages_bp
    # from app.api.files import files_bp

    # app.register_blueprint(auth_bp, url_prefix="/api/auth")
    # app.register_blueprint(messages_bp, url_prefix="/api/messages")
    # app.register_blueprint(files_bp, url_prefix="/api/files")

    return app

from flask import Flask
from app.config import Config
from app.extensions import init_extensions
from app.api import api_bp
from app.extensions import jwt
from app.jwt_callbacks import check_if_token_revoked

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)
    from app.models import user

    @jwt.token_in_blocklist_loader
    def token_blocklist_callback(jwt_header, jwt_payload):
        return check_if_token_revoked(jwt_header, jwt_payload)

    app.register_blueprint(api_bp, url_prefix="/api")

    return app

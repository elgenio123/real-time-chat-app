from flask_jwt_extended import get_jwt
from app.models.token_blocklist import TokenBlocklist

def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return TokenBlocklist.query.filter_by(jti=jti).first() is not None

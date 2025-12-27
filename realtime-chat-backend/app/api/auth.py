from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from app.models.token_blocklist import TokenBlocklist
from app.extensions import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Username already exists"}), 409
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 409

    user = User(
        username=data["username"],
        email=data["email"],
        avatar_url=data.get("avatar_url")
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({ "user": user.to_dict() }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(username=data["username"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]

    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()

    return {"message": "Successfully logged out"}, 200
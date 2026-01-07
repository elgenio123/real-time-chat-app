from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet")

def init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db) 
    jwt.init_app(app)
    socketio.init_app(app)
    CORS(
        app,
        origins=[
                "https://real-time-chat-app-frontend-q0ta.onrender.com",
                "http://localhost:3000",
                "http://localhost:3001"
            ],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

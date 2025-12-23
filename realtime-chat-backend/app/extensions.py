from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
# socketio = SocketIO(cors_allowed_origins="*")

def init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db) 
    # socketio.init_app(app)
    # CORS(app)

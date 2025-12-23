from dotenv import load_dotenv
load_dotenv()

from app import create_app
# from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
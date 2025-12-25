# Real-Time Chat Application with File Sharing

This project is a real-time chat application with file-sharing capabilities. It consists of a React-based frontend and a Flask-based backend.

## Features

- **Real-Time Messaging**: Instant communication between users via Socket.IO
- **Public & Private Chats**: Support for both public chat rooms and private conversations
- **File Sharing**: Upload and share files seamlessly with validation
- **User Authentication**: Secure JWT-based login and registration system
- **WebSocket Events**: Real-time events for joining/leaving chats and sending messages
- **Responsive Design**: Optimized for both desktop and mobile devices

## Technologies Used

### Frontend
- React
- Redux (for state management)
- Socket.IO (for real-time communication)
- Axios (for API requests)

### Backend
- Flask
- Flask-SocketIO (for WebSocket communication)
- Flask-RESTful (for building REST APIs)
- SQLAlchemy (for database management)

## Installation

### Prerequisites
- Node.js and npm (for the frontend)
- Python 3 and pip (for the backend)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd realtime-chat-backend
   ```
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   flask run
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd realtime-chat-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
1. Start both the backend and frontend servers.
2. Open the frontend in your browser (usually at `http://localhost:3000`).
3. Register or log in to start chatting and sharing files.

## Folder Structure

### Backend
- `app/`: Contains the Flask application code.
- `requirements.txt`: Lists Python dependencies.

### Frontend
- `src/`: Contains React application code.
- `package.json`: Lists JavaScript dependencies.

## Contributing
Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
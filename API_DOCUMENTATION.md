# Real-Time Chat Backend API Documentation

## Overview

This is a comprehensive REST API for a real-time chat application built with Flask, SQLAlchemy, and JWT authentication. The API supports public messaging, private messaging, file sharing, and user management.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All endpoints except user registration and login require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### Register User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "string (required)",
    "email": "string (required)",
    "password": "string (required)",
    "avatar_url": "string (optional)"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "avatar_url": "http://example.com/avatar.jpg"
      }
    }
    ```
- **Error Responses**:
  - **Code**: 400 - Missing required fields or duplicate username/email

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "string (required)",
    "password": "string (required)"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Login successful",
      "access_token": "jwt_token_here",
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "avatar_url": "http://example.com/avatar.jpg"
      }
    }
    ```
- **Error Responses**:
  - **Code**: 401 - Invalid credentials

#### Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Logout successful"
    }
    ```

### Public Messages Endpoints

#### Get All Public Messages
- **URL**: `/messages`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "messages": [
        {
          "id": 1,
          "content": "Hello everyone!",
          "timestamp": "2023-12-25T10:30:00Z",
          "user_id": 1,
          "username": "johndoe",
          "avatar_url": "http://example.com/avatar.jpg"
        }
      ]
    }
    ```

#### Create Public Message
- **URL**: `/messages`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "content": "string (required)"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**: Message object (same as above)

#### Delete Public Message
- **URL**: `/messages/{message_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `message_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Message deleted"
    }
    ```
- **Error Responses**:
  - **Code**: 403 - Can only delete own messages
  - **Code**: 404 - Message not found

### Private Messages Endpoints

#### Get Private Messages with User
- **URL**: `/messages/private/{other_user_id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `other_user_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "messages": [
        {
          "id": 1,
          "content": "Private message",
          "timestamp": "2023-12-25T10:30:00Z",
          "sender_id": 1,
          "chat_id": 1,
          "username": "johndoe",
          "avatar_url": "http://example.com/avatar.jpg"
        }
      ]
    }
    ```

#### Create Private Message
- **URL**: `/messages/private/{other_user_id}`
- **Method**: `POST`
- **Auth Required**: Yes
- **URL Parameters**:
  - `other_user_id`: integer (required)
- **Request Body**:
  ```json
  {
    "content": "string (required)"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**: Private message object
- **Error Responses**:
  - **Code**: 400 - Cannot send message to yourself

#### Delete Private Message
- **URL**: `/messages/private/{other_user_id}/{message_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `other_user_id`: integer (required)
  - `message_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Message deleted"
    }
    ```
- **Error Responses**:
  - **Code**: 403 - Can only delete own messages
  - **Code**: 404 - Message not found or invalid chat

### Files Endpoints

#### Create File
- **URL**: `/files/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "filename": "string (required)",
    "file_url": "string (required)",
    "file_size": "integer (required)",
    "public_message_id": "integer (optional)",
    "private_chat_id": "integer (optional)"
  }
  ```
- **Notes**:
  - Exactly one association (public_message_id OR private_chat_id) is required
  - File size limit: 5MB (5,242,880 bytes)
  - Allowed file types: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, BMP, TIFF, WEBP
- **Success Response**:
  - **Code**: 201
  - **Content**: File object
- **Error Responses**:
  - **Code**: 400 - Validation errors (size, type, associations)

#### Get User's Files
- **URL**: `/files/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    [
      {
        "id": 1,
        "filename": "document.pdf",
        "file_url": "http://example.com/document.pdf",
        "file_size": 102400,
        "uploaded_at": "2023-12-25T10:30:00Z",
        "uploader_id": 1,
        "public_message_id": 1,
        "private_chat_id": null
      }
    ]
    ```

#### Get Specific File
- **URL**: `/files/{file_id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `file_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "file": {
        "id": 1,
        "filename": "document.pdf",
        "file_url": "http://example.com/document.pdf",
        "file_size": 102400,
        "uploaded_at": "2023-12-25T10:30:00Z",
        "uploader_id": 1,
        "public_message_id": 1,
        "private_chat_id": null
      }
    }
    ```
- **Error Responses**:
  - **Code**: 403 - Access denied (not the uploader)
  - **Code**: 404 - File not found

#### Delete File
- **URL**: `/files/{file_id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Parameters**:
  - `file_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "File deleted"
    }
    ```
- **Error Responses**:
  - **Code**: 403 - Access denied (not the uploader)
  - **Code**: 404 - File not found

#### Get Files by Public Message
- **URL**: `/files/public/{message_id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `message_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "files": [
        {
          "id": 1,
          "filename": "document.pdf",
          "file_url": "http://example.com/document.pdf",
          "file_size": 102400,
          "uploaded_at": "2023-12-25T10:30:00Z",
          "uploader_id": 1,
          "public_message_id": 1,
          "private_chat_id": null
        }
      ]
    }
    ```

#### Get Files by Private Chat
- **URL**: `/files/private/{chat_id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `chat_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "files": [
        {
          "id": 1,
          "filename": "document.pdf",
          "file_url": "http://example.com/document.pdf",
          "file_size": 102400,
          "uploaded_at": "2023-12-25T10:30:00Z",
          "uploader_id": 1,
          "public_message_id": null,
          "private_chat_id": 1
        }
      ]
    }
    ```

### Users Endpoints

#### Get All Users
- **URL**: `/users/`
- **Method**: `GET`
- **Auth Required**: No
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "users": [
        {
          "id": 1,
          "username": "johndoe",
          "email": "john@example.com",
          "avatar_url": "http://example.com/avatar.jpg",
          "created_at": "2023-12-25T10:30:00Z"
        }
      ]
    }
    ```

#### Get Specific User
- **URL**: `/users/{user_id}`
- **Method**: `GET`
- **Auth Required**: No
- **URL Parameters**:
  - `user_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "avatar_url": "http://example.com/avatar.jpg",
        "created_at": "2023-12-25T10:30:00Z"
      }
    }
    ```
- **Error Responses**:
  - **Code**: 404 - User not found

#### Update User
- **URL**: `/users/{user_id}`
- **Method**: `PUT`
- **Auth Required**: No
- **URL Parameters**:
  - `user_id`: integer (required)
- **Request Body**:
  ```json
  {
    "username": "string (optional)",
    "email": "string (optional)",
    "avatar_url": "string (optional)"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "User updated successfully",
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
    ```
- **Error Responses**:
  - **Code**: 404 - User not found

#### Delete User
- **URL**: `/users/{user_id}`
- **Method**: `DELETE`
- **Auth Required**: No
- **URL Parameters**:
  - `user_id`: integer (required)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "User deleted successfully"
    }
    ```
- **Error Responses**:
  - **Code**: 404 - User not found

## WebSocket Events (Real-time)

The application supports real-time messaging via Socket.IO connections. The WebSocket server runs on the same host and handles the following events:

### Connection
- **URL**: `ws://localhost:5000/`
- **Authentication**: Include JWT token as query parameter: `?token=<jwt_token>`

### Connection Events

#### Connect
- **Event**: `connect`
- **Description**: Establish WebSocket connection with JWT authentication
- **Response**: `connected` event with welcome message

#### Disconnect
- **Event**: `disconnect`
- **Description**: Handle client disconnection and cleanup

### Public Chat Events

#### Join Public Chat
- **Event**: `join_public`
- **Description**: Join the public chat room
- **Response**: `user_joined` event broadcasted to all users in public chat

#### Leave Public Chat
- **Event**: `leave_public`
- **Description**: Leave the public chat room
- **Response**: `user_left` event broadcasted to all users in public chat

#### Send Public Message
- **Event**: `send_public_message`
- **Data**:
  ```json
  {
    "content": "string (required)"
  }
  ```
- **Response**: `new_public_message` event broadcasted to all users in public chat
- **Message Format**:
  ```json
  {
    "id": 1,
    "content": "Hello everyone!",
    "timestamp": "2023-12-25T10:30:00Z",
    "user": {
      "id": 1,
      "username": "johndoe"
    },
    "username": "johndoe"
  }
  ```

### Private Chat Events

#### Join Private Chat
- **Event**: `join_private`
- **Data**:
  ```json
  {
    "other_user_id": "integer (required)"
  }
  ```
- **Description**: Join a private chat room with another user
- **Response**: `joined_private` event with chat information

#### Leave Private Chat
- **Event**: `leave_private`
- **Data**:
  ```json
  {
    "other_user_id": "integer (required)"
  }
  ```
- **Description**: Leave a private chat room

#### Send Private Message
- **Event**: `send_private_message`
- **Data**:
  ```json
  {
    "other_user_id": "integer (required)",
    "content": "string (required)"
  }
  ```
- **Response**: `new_private_message` event sent to both users in the private chat
- **Message Format**:
  ```json
  {
    "id": 1,
    "content": "Private message",
    "timestamp": "2023-12-25T10:30:00Z",
    "sender": {
      "id": 1,
      "username": "johndoe"
    },
    "username": "johndoe"
  }
  ```

### Utility Events

#### Get Online Users
- **Event**: `get_online_users`
- **Description**: Get list of users currently online in public chat
- **Response**: `online_users` event with array of online users

### Error Handling

All Socket.IO events can emit an `error` event with error messages:

```json
{
  "message": "Error description"
}
```

### Room Management

- **Public Room**: `public_chat` - All users in public chat
- **Private Rooms**: `private_chat_{chat_id}` - Specific to each private conversation
- Users can be in multiple rooms simultaneously (public + multiple private chats)

### Connection Limits

- JWT token required for connection
- Invalid tokens result in immediate disconnection
- Users are tracked by socket ID for room management

## Implementation Details

### Architecture

The application uses a hybrid architecture supporting both REST API endpoints and real-time WebSocket communication:

- **REST API**: Traditional HTTP endpoints for authentication, data CRUD operations
- **WebSocket**: Real-time events for chat messaging and user presence
- **Database**: Shared SQLAlchemy models for both REST and real-time operations
- **Authentication**: JWT tokens used for both HTTP and WebSocket authentication

### Socket.IO Events Implementation

The Socket.IO events are implemented in `app/sockets/chat_events.py`:

- **Connection Handling**: JWT token verification on connect
- **Room Management**: Flask-SocketIO rooms for public/private chat isolation
- **Database Integration**: Real-time events create persistent messages in database
- **Error Handling**: Comprehensive error responses for invalid operations
- **User Tracking**: In-memory tracking of connected users and their rooms

### Security Considerations

- JWT tokens are validated on every WebSocket connection
- Users can only access chats they have permission for
- Private chat rooms are automatically created when needed
- Message ownership is enforced for deletions
- Rate limiting should be implemented for production use

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

## Data Models

### User
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "avatar_url": "string (optional)",
  "created_at": "datetime"
}
```

### Public Message
```json
{
  "id": "integer",
  "content": "string",
  "timestamp": "datetime",
  "user_id": "integer",
  "username": "string",
  "avatar_url": "string (optional)"
}
```

### Private Message
```json
{
  "id": "integer",
  "content": "string",
  "timestamp": "datetime",
  "sender_id": "integer",
  "chat_id": "integer",
  "username": "string",
  "avatar_url": "string (optional)"
}
```

### File
```json
{
  "id": "integer",
  "filename": "string",
  "file_url": "string",
  "file_size": "integer",
  "uploaded_at": "datetime",
  "uploader_id": "integer",
  "public_message_id": "integer (optional)",
  "private_chat_id": "integer (optional)"
}
```

## Rate Limiting

Currently, there are no rate limits implemented. Consider adding rate limiting for production use.

## File Upload Notes

- Files are not uploaded directly to this API
- The API stores file metadata (URLs, sizes, etc.) only
- File uploads should be handled by a separate service (e.g., Cloudinary, AWS S3)
- The `file_url` field should contain the publicly accessible URL of the uploaded file

## Testing

The API includes comprehensive test coverage with 20 test cases covering:
- Authentication (registration, login, logout)
- Public and private messaging
- File CRUD operations with validation
- User management
- Error handling and access control

Run tests with: `python -m pytest tests/`

## Development Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Set up environment variables in `.env` file
3. Run database migrations: `flask db upgrade`
4. Start the server: `python run.py`
5. Run tests: `python -m pytest tests/`

## Socket.IO Integration

The backend uses Flask-SocketIO for real-time communication. The server automatically handles both HTTP requests and WebSocket connections.

### Server Startup

The `run.py` file uses `socketio.run()` instead of Flask's `app.run()` to properly handle WebSocket connections:

```python
from app import create_app
from app.extensions import socketio

app = create_app()
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### Client Connection

Clients connect using Socket.IO client libraries with JWT authentication:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Event Handling

All Socket.IO events are defined in `app/sockets/chat_events.py` and include:
- Connection management with JWT verification
- Room-based chat (public and private)
- Real-time message broadcasting
- User presence tracking

### Testing Socket.IO

Use the provided demo script to test Socket.IO functionality:

```bash
python socketio_demo.py
```

This script demonstrates:
- User authentication
- Public chat participation
- Private messaging
- Real-time event handling
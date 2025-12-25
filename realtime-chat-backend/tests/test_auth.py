import pytest
from app.models.user import User
from app.models.token_blocklist import TokenBlocklist
from app.extensions import db

def test_register(client):
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123',
        'avatar_url': 'http://example.com/avatar.jpg'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'user' in data
    assert data['user']['username'] == 'newuser'
    assert data['user']['avatar_url'] == 'http://example.com/avatar.jpg'

def test_register_duplicate_username(client):
    # First registration
    client.post('/api/auth/register', json={
        'username': 'user1',
        'email': 'user1@example.com',
        'password': 'password123'
    })
    # Duplicate username
    response = client.post('/api/auth/register', json={
        'username': 'user1',
        'email': 'user2@example.com',
        'password': 'password123'
    })
    assert response.status_code == 409
    assert 'Username already exists' in response.get_json()['message']

def test_login_success(client):
    # Register first
    client.post('/api/auth/register', json={
        'username': 'loginuser',
        'email': 'login@example.com',
        'password': 'password123'
    })
    # Login
    response = client.post('/api/auth/login', json={
        'username': 'loginuser',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'user' in data

def test_login_invalid_credentials(client):
    response = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'wrong'
    })
    assert response.status_code == 401
    assert 'Invalid credentials' in response.get_json()['message']

def test_logout(client, auth_headers):
    response = client.post('/api/auth/logout', headers=auth_headers)
    assert response.status_code == 200
    assert 'Successfully logged out' in response.get_json()['message']
    
    # Check token is blocklisted
    with client.application.app_context():
        assert TokenBlocklist.query.count() == 1
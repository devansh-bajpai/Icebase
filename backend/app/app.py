import base64
import os
from flask import Flask, request
from celery_worker import long_task
from flask_socketio import SocketIO, send, emit

from celery_worker import handle_image
from celery_worker import handle_video
from celery_worker import handle_video_addToIndex
from encryption.crypto_utils import crypto_manager
from encryption.apiValid import isAPIValid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=f"redis://{REDIS_HOST}:{REDIS_PORT}/0")

# Store AES keys per socket session: {session_id: aes_key_bytes}
session_keys = {}

@socketio.on("connect")
def handle_connect():
    print(f"client connected with sid: {request.sid}")
    # Send RSA public key to client for handshake
    public_key = crypto_manager.get_public_key()
    emit("rsa_public_key", {"public_key": public_key}, to=request.sid)
    print(f"Sent RSA public key to {request.sid}")

@socketio.on("disconnect")
def handle_disconnect():
    print(f"client disconnected with sid: {request.sid}")
    # Clean up session key
    if request.sid in session_keys:
        del session_keys[request.sid]
        print(f"Cleaned up session key for {request.sid}")
    send("disconnected!", to=request.sid)

@socketio.on("aes_key_exchange")
def handle_aes_key_exchange(data):
    """Handle RSA-encrypted AES key from client"""
    try:
        sid = request.sid
        encrypted_aes_key_b64 = data.get("encrypted_aes_key")
        
        if not encrypted_aes_key_b64:
            emit("error", {"message": "Missing encrypted AES key"}, to=sid)
            return
        
        # Decrypt AES key using RSA private key
        encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
        aes_key = crypto_manager.decrypt_rsa(encrypted_aes_key)
        
        # Store AES key for this session
        session_keys[sid] = aes_key
        print(f"AES key exchanged and stored for session {sid}")
        
        # Send confirmation
        emit("aes_key_confirmed", {"status": "success"}, to=sid)
        
    except Exception as e:
        print(f"Error in AES key exchange: {str(e)}")
        emit("error", {"message": f"Key exchange failed: {str(e)}"}, to=request.sid)

def _decrypt_and_verify(data, sid):
    """Helper function to decrypt data and verify API key"""
    if sid not in session_keys:
        raise ValueError("No AES key found for this session. Complete handshake first.")
    
    # Check if data is in encrypted format
    if not isinstance(data, dict) or "data" not in data or "iv" not in data:
        raise ValueError("Invalid encrypted data format. Expected {data: str, iv: str}")
    
    try:
        aes_key = session_keys[sid]
        decrypted_data = crypto_manager.decrypt_encrypted_payload(data, aes_key)
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")
    
    # Verify API key
    api_key = decrypted_data.get("apikey")
    if not api_key or not isAPIValid(api_key):
        raise ValueError("Invalid or missing API key")
    
    return decrypted_data

@socketio.on("frame")
def handle_frame(data):
    try:
        sid = request.sid
        decrypted_data = _decrypt_and_verify(data, sid)
        base64_string = decrypted_data["img"]
        API_KEY = decrypted_data["apikey"]
        task = handle_image.delay(base64_string, API_KEY)
    except Exception as e:
        print(f"Error handling frame: {str(e)}")
        emit("error", {"message": str(e)}, to=request.sid)

@socketio.on("findUserWithImage")
def handle_image_find(data):
    try:
        sid = request.sid
        decrypted_data = _decrypt_and_verify(data, sid)
        # Implement your logic here
        pass
    except Exception as e:
        print(f"Error handling findUserWithImage: {str(e)}")
        emit("error", {"message": str(e)}, to=request.sid)


@socketio.on("findUserWithVideo")
def handle_video_find(data):
    try:
        sid = request.sid
        decrypted_data = _decrypt_and_verify(data, sid)
        API_KEY = decrypted_data["apikey"]
        print(f"findUserWithVideo called with sid: {sid}")
        base64_string = decrypted_data["img"]
        task = handle_video.delay(base64_string, sid, API_KEY)
    except Exception as e:
        print(f"Error handling findUserWithVideo: {str(e)}")
        emit("error", {"message": str(e)}, to=request.sid)

@socketio.on("addUserWithVideo")
def handle_video_add(data):
    try:
        sid = request.sid
        decrypted_data = _decrypt_and_verify(data, sid)
        base64_string = decrypted_data["img"]
        uid = decrypted_data["uid"]
        API_KEY = decrypted_data["apikey"]
        task = handle_video_addToIndex.delay(base64_string, uid, sid, API_KEY)
    except Exception as e:
        print(f"Error handling addUserWithVideo: {str(e)}")
        emit("error", {"message": str(e)}, to=request.sid)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
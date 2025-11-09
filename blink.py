"""
Flask-SocketIO server for blink detection and face authentication.
This server handles:
1. checkBlink - detects blink in received frames
2. findUserWithVideo - authenticates user after blink is confirmed
"""

from flask import Flask, request
from flask_socketio import SocketIO, emit
import face_recognition
import cv2
import numpy as np
import base64
import io
from PIL import Image
import time
import pickle
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Blink detection parameters (from blink.py)
EAR_BLINK_THRESHOLD = 0.25
EAR_DROP_THRESHOLD = 0.15
BLINK_CONSEC_FRAMES = 1
BASELINE_FRAMES = 5
TIMEOUT_SECONDS = 10

# Face recognition parameters
TOLERANCE = 0.6
USE_SQUARED_L2 = True

# Per-session blink detection state
session_blink_state = {}

# # Load FAISS index and labels for authentication
# try:
#     faiss_index = faiss.read_index(FAISS_INDEX_FILE)
#     with open(ID2LABEL_FILE, "rb") as f:
#         id_to_label = pickle.load(f)
#     print(f"Loaded FAISS index and {len(id_to_label)} labels")
# except Exception as e:
#     print(f"Warning: Could not load FAISS index: {e}")
#     faiss_index = None
#     id_to_label = []

def eye_aspect_ratio(eye):
    """Calculate Eye Aspect Ratio (EAR) from eye landmarks"""
    if len(eye) < 6:
        return 0.0
    p = np.array(eye, dtype=np.float32)
    A = np.linalg.norm(p[1] - p[5])
    B = np.linalg.norm(p[2] - p[4])
    C = np.linalg.norm(p[0] - p[3])
    if C == 0:
        return 0.0
    ear = (A + B) / (2.0 * C)
    return ear

def decode_image(data_url):
    """Decode base64 image data URL to numpy array"""
    try:
        # Remove data URL prefix
        if ',' in data_url:
            header, encoded = data_url.split(',', 1)
        else:
            encoded = data_url
        
        # Decode base64
        image_data = base64.b64decode(encoded)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB numpy array
        rgb_array = np.array(image.convert('RGB'))
        
        return rgb_array
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def detect_blink_in_frame(rgb_frame, session_id):
    """Detect blink in a frame using the logic from blink.py"""
    try:
        faces = face_recognition.face_locations(rgb_frame)
        landmarks_list = face_recognition.face_landmarks(rgb_frame, faces)
    except Exception as e:
        print(f"Face detection error: {e}")
        return False, "Face detection error"
    
    if not faces:
        return False, "No face detected. Please look at the camera."
    
    # Initialize session state if needed
    if session_id not in session_blink_state:
        session_blink_state[session_id] = {
            'baseline_ear': None,
            'baseline_frames_count': 0,
            'last_ear': None,
            'closed_eyes_frames': 0,
            'face_detected': False,
            'start_time': time.time(),
        }
    
    state = session_blink_state[session_id]
    
    # Check timeout
    elapsed = time.time() - state['start_time']
    if elapsed > TIMEOUT_SECONDS:
        return False, "Timeout: No blink detected within time limit"
    
    if landmarks_list and landmarks_list[0]:
        lm = landmarks_list[0]
        le = lm.get('left_eye', [])
        re = lm.get('right_eye', [])
        ear_left = eye_aspect_ratio(le) if le else 0.0
        ear_right = eye_aspect_ratio(re) if re else 0.0
        ear = (ear_left + ear_right) / 2.0
        
        # Establish and update baseline EAR when eyes are open
        if ear > EAR_BLINK_THRESHOLD:
            if state['baseline_frames_count'] < BASELINE_FRAMES:
                if state['baseline_ear'] is None:
                    state['baseline_ear'] = ear
                else:
                    state['baseline_ear'] = (state['baseline_ear'] * state['baseline_frames_count'] + ear) / (state['baseline_frames_count'] + 1)
                state['baseline_frames_count'] += 1
            else:
                # Update baseline adaptively
                state['baseline_ear'] = 0.9 * state['baseline_ear'] + 0.1 * ear
        
        # Detect blink
        if ear > 0:
            blink_detected = False
            
            # Method 1: Absolute threshold
            if ear < EAR_BLINK_THRESHOLD:
                state['closed_eyes_frames'] += 1
                if state['closed_eyes_frames'] >= BLINK_CONSEC_FRAMES:
                    blink_detected = True
            
            # Method 2: Relative drop from baseline
            if not blink_detected and state['baseline_ear'] is not None and state['baseline_ear'] > 0:
                ear_drop = (state['baseline_ear'] - ear) / state['baseline_ear']
                if ear_drop > EAR_DROP_THRESHOLD and state['last_ear'] is not None and state['last_ear'] > EAR_BLINK_THRESHOLD:
                    blink_detected = True
                    state['closed_eyes_frames'] = 0
            
            if blink_detected:
                # Clear session state after blink detected
                del session_blink_state[session_id]
                return True, "Blink detected! Original human confirmed."
            
            # Reset counter when eyes are open
            if ear > EAR_BLINK_THRESHOLD:
                state['closed_eyes_frames'] = 0
            
            state['last_ear'] = ear
        
        remaining = max(0, TIMEOUT_SECONDS - elapsed)
        return False, f"Please blink! Time remaining: {int(remaining)}s"
    
    return False, "Could not detect eye landmarks. Please ensure good lighting."

if __name__ == '__main__':
    print("Starting Flask-SocketIO server on http://localhost:5000")
    print("Make sure FAISS index and labels are loaded before authentication")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
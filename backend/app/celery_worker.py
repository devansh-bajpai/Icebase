from celery import Celery, signals
import time
import os

import cv2
import numpy as np
import base64

from encryption.searchUser import searchUser
from encryption.addToIndex import addToIndex
import face_recognition

from flask_socketio import SocketIO, send, emit

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)

celery_app = Celery(
    "tasks",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)
# socketio = SocketIO(message_queue="redis://localhost:6379/0")


@celery_app.task
def long_task(n):
    print(f"Starting task for {n} seconds")
    time.sleep(n)
    print(f"Finished task of {n} seconds")
    return f"Task ran for {n} seconds"


@celery_app.task
def handle_image(data):
    base64_string = data

    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        print("Failed to decode image")
    else:
        encodings = face_recognition.face_encodings(img)
        if(len(encodings) > 0):
            enc = encodings[0]
            searchUser(enc)
        else:
            print("No face detected")


@celery_app.task
def handle_video(data, sid):
    base64_string = data

    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"code": 500, "message": "Failed to decode image", "sid": sid}

    else:
        encodings = face_recognition.face_encodings(img)
        if(len(encodings) > 0):
            enc = encodings[0]
            searchResponse = searchUser(enc)
            print(searchResponse)

            if(searchResponse["code"] == 200):
                return {"code": 200, "message": "User found", "uid": searchResponse["uid"], "sid": sid}
            elif(searchResponse["code"] == 404):
                return {"code": 404, "message": "No match found", "sid": sid}
            else:
                return {"code": 500, "message": "Internal server error", "sid": sid}
        else:
            return {"code": 404, "message": "Face not found", "sid": sid}


@celery_app.task
def handle_video_addToIndex(data, uid, sid):
    base64_string = data

    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"code": 500, "message": "Failed to decode image", "sid": sid, "uid": uid}
    else:
        encodings = face_recognition.face_encodings(img)
        if(len(encodings) > 0):
            enc = encodings[0]
            searchResponse = searchUser(enc)

            if(searchResponse["code"] == 200):
                return {"code": 400, "message": "User Already Exists", "uid": searchResponse["uid"], "sid": sid}
            elif(searchResponse["code"] == 404):
                addToIndexResponse = addToIndex([enc], [uid])
                if(addToIndexResponse["code"] == 200):
                    return {"code": 200, "message": "Added to Index", "sid": sid, "uid": uid}
                else:
                    return {"code": 500, "message": "Couldn't add index", "sid": sid, "uid": uid}
            else:
                return {"code": 500, "message": "Internal server error", "sid": sid}
        else:
            return {"code": 404, "message": "Face not found", "sid": sid}

# @signals.task_success.connect
# def task_completed_handler(sender=None, result=None, **kwargs):
#     """Called automatically when any task succeeds."""
#     if sender.name == "celery_worker.handle_video":
#         socketio.emit("video_result", {"result": result}, to=result["sid"])
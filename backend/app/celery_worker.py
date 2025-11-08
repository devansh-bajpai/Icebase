from celery import Celery, signals
import time
import os

import cv2
import numpy as np
import base64

from encryption.searchUser import searchUser
from encryption.addToIndex import addToIndex
from encryption.checkIfUIDExists import checkIfUIDExists
from encryption.addToMongo import addLogToMongo

from dotenv import load_dotenv
load_dotenv()

import face_recognition

from flask_socketio import SocketIO, send, emit

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)

celery_app = Celery(
    "tasks",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)
socketio = SocketIO(message_queue=f"redis://{REDIS_HOST}:{REDIS_PORT}/0")


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


#  To find user ID with video
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
                # adding search log to mongodb
                addLogToMongo(os.getenv("API_KEY"), searchResponse["uid"], "search")
                return {"code": 200, "message": "User found", "uid": searchResponse["uid"], "sid": sid}
            elif(searchResponse["code"] == 404):
                return {"code": 404, "message": "No match found", "sid": sid}
            else:
                return {"code": 500, "message": "Internal server error", "sid": sid}
        else:
            return {"code": 404, "message": "Face not found", "sid": sid}

#  Used to Create New User in DB
@celery_app.task
def handle_video_addToIndex(data, uid, sid):
    base64_string = data

    uidExistResponse = checkIfUIDExists(uid)
    if(uidExistResponse["code"] == 500):
        return {"code": 500, "message": "Error while checking existence of UID"}
    elif(uidExistResponse["code"] == 200 and uidExistResponse["value"] == True):
        return {"code": 400, "message": "User with current UID already exists"}


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
                    # adding signup log to mongodb
                    addLogToMongo(os.getenv("API_KEY"), uid, "create")
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
#         # print(result["sid"], "aejghkaejbgaeh")
#         socketio.emit("test", {"result": result}, to=result["sid"])
#         print("socket request emitted")



@signals.task_success.connect
def task_completed_handler(sender=None, result=None, **kwargs):
    """Called automatically when any task succeeds."""
    print(f"Task completed: {sender.name}, result type: {type(result)}")
    if sender.name == "celery_worker.handle_video":
        print(f"Handling handle_video task completion, result: {result}")
        if isinstance(result, dict) and "sid" in result:
            try:
                socketio.emit("test", {"result": result}, to=result["sid"])
                print(f"Socket request emitted to sid: {result['sid']}")
            except Exception as e:
                print(f"Error emitting socket message: {e}")
        else:
            print(f"Result is not a dict with 'sid' key: {result}")
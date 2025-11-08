import base64
import os
from flask import Flask, request
from celery_worker import long_task
from flask_socketio import SocketIO, send, emit

from celery_worker import handle_image
from celery_worker import handle_video
from celery_worker import handle_video_addToIndex

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=f"redis://{REDIS_HOST}:{REDIS_PORT}/0")

@socketio.on("connect")
def handle_connect():
    print(f"client connected with sid: {request.sid}")
    send("welcome!", to=request.sid)

@socketio.on("disconnect")
def handle_disconnect():
    print("client disconnected")
    send("disconnected!", to=request.sid)

@socketio.on("frame")
def handle_frame(data):
    base64_string = data["img"]
    API_KEY = data["apikey"]
    task = handle_image.delay(base64_string, API_KEY)

@socketio.on("findUserWithImage")
def handle_image_find():
    pass


@socketio.on("findUserWithVideo")
def handle_video_find(data):
    API_KEY = data["apikey"]
    sid = request.sid
    print(f"findUserWithVideo called with sid: {sid}")
    base64_string = data["img"]
    task = handle_video.delay(base64_string, sid, API_KEY)

@socketio.on("addUserWithVideo")
def handle_video_add(data):
    sid = request.sid
    base64_string = data["img"]
    uid = data["uid"]
    API_KEY = data["apikey"]

    task = handle_video_addToIndex.delay(base64_string,uid, sid, API_KEY)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
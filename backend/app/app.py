import base64
from flask import Flask, request
from celery_worker import long_task
from flask_socketio import SocketIO, send, emit

from celery_worker import handle_image
from celery_worker import handle_video

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

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
    task = handle_image.delay(base64_string)

@socketio.on("findUserWithImage")
def handle_image_find():
    pass


@socketio.on("findUserWithVideo")
def handle_video_find(data):
    sid = request.sid
    print(f"findUserWithVideo called with sid: {sid}")
    base64_string = data["img"]
    task = handle_video.delay(base64_string, sid)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
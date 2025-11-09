import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * WebcamSocketStreamer
 * 
 * A reusable React component that:
 * - Connects to a Socket.IO server
 * - Streams webcam frames at a given interval
 * - Sends each frame as a base64 JPEG to the server under a chosen event
 * - Optionally listens for server events
 * 
 * Props:
 * @param {string} serverUrl - Your Socket.IO server URL
 * @param {string} emitEvent - The event name to emit frames with
 * @param {number} [interval=5000] - How often to send frames (in ms)
 * @param {string} [responseEvent] - Optional event name to listen for responses
 * @param {function} [onResponse] - Callback when responseEvent data is received
 * @param {number} [quality=0.7] - Image compression quality (0 to 1)
 * @param {boolean} [showCanvas=false] - Whether to show the hidden canvas
 */
export default function WebcamStreamer({
  serverUrl,
  emitEvent,
  interval = 5000,
  responseEvent,
  onResponse = () => {},
  quality = 0.7,
  showCanvas = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!serverUrl) {
      console.error("WebcamSocketStreamer: Missing serverUrl prop");
      return;
    }

    socketRef.current = io(serverUrl);

    socketRef.current.on("connect", () => {
      console.log("Connected with ID:", socketRef.current.id);
    });

    if (responseEvent) {
      socketRef.current.on(responseEvent, (data) => {
        console.log(`Received ${responseEvent}:`, data);
        onResponse(data);
      });
    }

    return () => {
      if (responseEvent) socketRef.current.off(responseEvent);
      socketRef.current.disconnect();
    };
  }, [serverUrl, responseEvent, onResponse]);

  // Stream webcam frames
  useEffect(() => {
    if (!emitEvent) {
      console.error("WebcamSocketStreamer: Missing emitEvent prop");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const sendFrame = () => {
          if (
            socketRef.current &&
            socketRef.current.connected &&
            videoRef.current &&
            videoRef.current.readyState === 4
          ) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            const frameData = canvas.toDataURL("image/jpeg", quality);

            socketRef.current.emit(emitEvent, { img: frameData });
            console.log(`Frame emitted to "${emitEvent}"`);
          }

          setTimeout(() => requestAnimationFrame(sendFrame), interval);
        };

        sendFrame();
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [emitEvent, interval, quality]);

  return (
    <div>
      <video ref={videoRef} style={{ display: "block", width: "100%" }} />
      <canvas
        ref={canvasRef}
        style={{ display: showCanvas ? "block" : "none", width: "100%" }}
      />
    </div>
  );
}
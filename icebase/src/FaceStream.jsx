import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  encryptRSA,
  generateAESKey,
  exportAESKey,
  importAESKey,
  encryptJSON,
} from "./cryptoUtils";

/**
 * WebcamSocketStreamer
 * 
 * A reusable React component that:
 * - Connects to a Socket.IO server
 * - Performs RSA handshake to securely exchange AES key
 * - Streams webcam frames at a given interval
 * - Encrypts all data (API key + frames) with AES before sending
 * - Sends each frame as encrypted data to the server under a chosen event
 * - Optionally listens for server events
 * 
 * Props:
 * @param {string} serverUrl - Your Socket.IO server URL
 * @param {string} emitEvent - The event name to emit frames with
 * @param {string} apiKey - Icebase API key for verification
 * @param {number} [interval=5000] - How often to send frames (in ms)
 * @param {string} [responseEvent] - Optional event name to listen for responses
 * @param {function} [onResponse] - Callback when responseEvent data is received
 * @param {number} [quality=0.7] - Image compression quality (0 to 1)
 * @param {boolean} [showCanvas=false] - Whether to show the hidden canvas
 */
export default function WebcamStreamer({
  serverUrl,
  emitEvent,
  apiKey,
  interval = 5000,
  responseEvent,
  onResponse = () => {},
  quality = 0.7,
  showCanvas = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const aesKeyRef = useRef(null);
  const [handshakeComplete, setHandshakeComplete] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Initialize Socket.IO connection and perform RSA handshake
  useEffect(() => {
    if (!serverUrl) {
      console.error("WebcamSocketStreamer: Missing serverUrl prop");
      return;
    }

    if (!apiKey) {
      console.error("WebcamSocketStreamer: Missing apiKey prop");
      return;
    }

    socketRef.current = io(serverUrl);

    // Set up RSA public key listener before connect (in case it arrives immediately)
    socketRef.current.once("rsa_public_key", async (data) => {
      try {
        const publicKeyPem = data.public_key;
        console.log("Received RSA public key from server");

        // Generate AES key
        const aesKey = await generateAESKey();
        aesKeyRef.current = aesKey;

        // Export AES key as bytes
        const aesKeyBytes = await exportAESKey(aesKey);

        // Encrypt AES key with RSA public key
        const encryptedAESKey = await encryptRSA(publicKeyPem, aesKeyBytes);

        // Send encrypted AES key to server
        socketRef.current.emit("aes_key_exchange", {
          encrypted_aes_key: encryptedAESKey,
        });
        console.log("Sent encrypted AES key to server");

        // Wait for confirmation
        socketRef.current.once("aes_key_confirmed", (data) => {
          if (data.status === "success") {
            console.log("AES key exchange confirmed");
            setHandshakeComplete(true);
            setConnectionStatus("ready");
          }
        });
      } catch (error) {
        console.error("Error during handshake:", error);
        setConnectionStatus("handshake_failed");
      }
    });

    socketRef.current.on("connect", async () => {
      console.log("Connected with ID:", socketRef.current.id);
      setConnectionStatus("connected");
      // RSA public key should be received automatically from server on connect
    });

    // Handle errors
    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
      setConnectionStatus("error");
    });

    if (responseEvent) {
      socketRef.current.on(responseEvent, (data) => {
        console.log(`Received ${responseEvent}:`, data);
        onResponse(data);
      });
    }

    return () => {
      if (responseEvent) socketRef.current.off(responseEvent);
      socketRef.current.off("rsa_public_key");
      socketRef.current.off("aes_key_confirmed");
      socketRef.current.off("error");
      socketRef.current.disconnect();
      setHandshakeComplete(false);
      setConnectionStatus("disconnected");
    };
  }, [serverUrl, responseEvent, onResponse, apiKey]);

  // Stream webcam frames (only after handshake is complete)
  useEffect(() => {
    if (!emitEvent) {
      console.error("WebcamSocketStreamer: Missing emitEvent prop");
      return;
    }

    if (!handshakeComplete || !aesKeyRef.current) {
      return; // Wait for handshake to complete
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const sendFrame = async () => {
          if (
            socketRef.current &&
            socketRef.current.connected &&
            handshakeComplete &&
            aesKeyRef.current &&
            videoRef.current &&
            videoRef.current.readyState === 4
          ) {
            try {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;

              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

              const frameData = canvas.toDataURL("image/jpeg", quality);

              // Encrypt the frame data along with API key
              const payload = {
                img: frameData,
                apikey: apiKey,
              };

              const encryptedPayload = await encryptJSON(aesKeyRef.current, payload);

              // Send encrypted data
              socketRef.current.emit(emitEvent, encryptedPayload);
              console.log(`Encrypted frame emitted to "${emitEvent}"`);
            } catch (error) {
              console.error("Error encrypting and sending frame:", error);
            }
          }

          setTimeout(() => requestAnimationFrame(sendFrame), interval);
        };

        sendFrame();
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });

    return () => {
      // Cleanup is handled in the connection useEffect
    };
  }, [emitEvent, interval, quality, handshakeComplete, apiKey]);

  return (
    <div>
      <div style={{ marginBottom: "10px", padding: "10px", background: "#f0f0f0" }}>
        <strong>Connection Status:</strong> {connectionStatus}
        {handshakeComplete && <span style={{ color: "green" }}> ✓ Encrypted</span>}
      </div>
      <video ref={videoRef} style={{ display: "block", width: "100%" }} />
      <canvas
        ref={canvasRef}
        style={{ display: showCanvas ? "block" : "none", width: "100%" }}
      />
    </div>
  );
}
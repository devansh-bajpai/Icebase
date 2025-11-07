import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import io from 'socket.io-client';

export const FaceVerify = ({
  backendUrl = "http://localhost:5000", // Flask backend socket URL
  interval = 2000,
  width = 400,
  height,
  facingMode = "user",
  onResult = () => {},
  loadingText = "Verifying...",
  verifiedText = "Verified ✅",
  unverifiedText = "No face detected ❌",
  style = {},
  webcamStyle = {}
}) => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState('Waiting...');
  const [isVerifying, setIsVerifying] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    // Listen for verification results from the backend
    newSocket.on('verification_result', (data) => {
      setIsVerifying(false);
      const result = data.status;
      const message = result === 'verified' ? verifiedText : unverifiedText;
      setStatus(message);
      onResult(result);
    });

    newSocket.on('connect', () => console.log('Connected to backend socket.'));
    newSocket.on('disconnect', () => console.log('Disconnected from backend.'));

    return () => newSocket.disconnect();
  }, [backendUrl]);

  // Capture frame and send to backend via Socket.IO
  const captureAndVerify = () => {
    if (!webcamRef.current || !socket) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsVerifying(true);
    setStatus(loadingText);

    socket.emit('verify_face', { image: imageSrc });
  };

  // Run periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      captureAndVerify();
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, socket]);

  return (
    <div style={{ textAlign: 'center', marginTop: 20, ...style }}>
      <h2>Face Verification</h2>

      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={width}
        height={height}
        videoConstraints={{ facingMode }}
        style={{
          borderRadius: 10,
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          ...webcamStyle
        }}
      />

      <div style={{ marginTop: 10 }}>
        {isVerifying ? <p>{loadingText}</p> : <h3>{status}</h3>}
      </div>
    </div>
  );
};

export default FaceVerify;

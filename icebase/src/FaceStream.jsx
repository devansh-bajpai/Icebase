import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

export const FaceVerify = ({
  backendUrl = "",
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

  // Capture frame and send to backend
  const captureAndVerify = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      setIsVerifying(true);

      const res = await axios.post(backendUrl, { image: imageSrc });
      const result = res.data?.status || 'no_face'; // backend expected to return {status: 'verified'} or 'no_face'

      const message = result === 'verified' ? verifiedText : unverifiedText;
      setStatus(message);
      onResult(result);

    } catch (err) {
      console.error('Verification error:', err);
      setStatus('Error during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  // Run periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      captureAndVerify();
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, backendUrl]);

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
        {isVerifying ? (
          <p>{loadingText}</p>
        ) : (
          <h3>{status}</h3>
        )}
      </div>
    </div>
  );
};

export default FaceVerify;
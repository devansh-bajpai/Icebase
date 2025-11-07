import React from 'react'
import Webcam from 'react-webcam';
import axios from 'axios';

function FaceVerify() {
  return (
    <div style={{ textAlign: 'center', marginTop: 20, ...style }}>
      <h2>Face Verification</h2>

      <Webcam
        ref={}
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
          <h3>{}</h3>
        )}
      </div>
    </div>
  );
}

export default FaceVerify
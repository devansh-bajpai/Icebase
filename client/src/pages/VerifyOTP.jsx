import React, { useState } from "react";
import { verifyEmailOTP, resendEmailOTP } from "../api/auth";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const { state } = useLocation();
  const email = state?.email;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

 const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyEmailOTP({ email, otp });
      setMessage({
        text: res.data.message || 'Email verified successfully!',
        type: 'success'
      });
      // Navigate to login after successful verification
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified successfully! Please log in.' } });
      }, 1500);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Invalid OTP",
        type: 'error'
      });
    }
  };

  const handleResend = async () => {
    try {
      console.log('Attempting to resend OTP to:', email);
      const res = await resendEmailOTP({ email });
      
      setMessage({
        text: res.data?.message || "New OTP has been sent to your email!",
        type: "success"
      });
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'A new OTP has been sent to your email. Please check and verify.' 
          } 
        });
      }, 2000);
    } catch (err) {
      console.error('Error in handleResend:', err); // Debug log
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         "Error resending OTP. Please try again.";
      
      setMessage({
        text: errorMessage,
        type: "error"
      });
    }
  };

  return (
    <div className="form-container">
      <h2>Verify Email OTP</h2>
      <form onSubmit={handleVerify}>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required />
        <button type="submit">Verify</button>
      </form>
      <button onClick={handleResend}>Resend OTP</button>
      {message && (
        <div style={{ 
          color: message.type === 'success' ? 'green' : 'red',
          margin: '10px 0',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          borderLeft: `4px solid ${message.type === 'success' ? '#4caf50' : '#f44336'}`
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

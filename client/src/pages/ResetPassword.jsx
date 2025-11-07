import React, { useState } from "react";
import { resetPassword } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await resetPassword(form);
      setMessage(res.data.message);
      
      // Navigate to login after 2 seconds on success
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! You can now log in with your new password.' 
          } 
        });
      }, 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error resetting password. Please try again.",
        type: 'error'
      });
    }
  };

  return (
    <div className="form-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Registered Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="otp"
          placeholder="Enter OTP"
          value={form.otp}
          onChange={handleChange}
          required
        />
        <input
          name="newPassword"
          type="password"
          placeholder="New Password"
          value={form.newPassword}
          onChange={handleChange}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && (
        <div style={{ 
          color: message.type === 'success' ? 'green' : 'red',
          margin: '10px 0',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          borderLeft: `4px solid ${message.type === 'success' ? '#4caf50' : '#f44336'}`
        }}>
          {message.text || message}
        </div>
      )}
    </div>
  );
}

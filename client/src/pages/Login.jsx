import React, { useState } from "react";
import { loginUser } from "../api/auth.js";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Logging in...', type: 'info' });
    
    try {
      console.log('Attempting login with:', { email: form.email });
      const res = await loginUser(form);
      console.log('Login response:', res.data);
      
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setMessage({ text: 'Login successful! Redirecting to home...', type: 'success' });
        console.log("Login successful");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setMessage({ text: 'Login failed: No token received', type: 'error' });
      }
    } catch (err) {
      console.error('Login error object:', err);
      console.log('Login error status:', err.response?.status);
      console.log('Login error response data:', err.response?.data);
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'An error occurred during login';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      {message && (
        <div style={{ 
          color: message.type === 'success' ? 'green' : 
                 message.type === 'error' ? 'red' : 'blue',
          margin: '10px 0',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : 
                         message.type === 'error' ? '#ffebee' : '#e3f2fd',
          borderLeft: `4px solid ${
            message.type === 'success' ? '#4caf50' : 
            message.type === 'error' ? '#f44336' : '#2196f3'
          }`
        }}>
          {message.text}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}

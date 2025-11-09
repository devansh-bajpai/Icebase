import React, { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    try {
      const res = await registerUser(form);
      // Check if registration was successful
      if (res.data.success) {
        setMessage(res.data.message);
        console.log("Registration successful");
        // Only navigate on success
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: form.email } });
        }, 1500);
      } else {
        // Registration failed but didn't throw error (shouldn't happen, but safety check)
        setMessage(res.data.message || "Registration failed");
      }
    } catch (err) {
      // Handle errors (network errors, 4xx, 5xx responses)
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      setMessage(errorMessage);
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}


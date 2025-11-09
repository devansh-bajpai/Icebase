import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
<<<<<<< HEAD
import Dashboard from "./pages/Dashboard";
=======
import Dashboard from "./pages/dashboard";
>>>>>>> 9ede3a764bdda6eb40b24e7bf98e491e9593fcc3
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
<<<<<<< HEAD
      {/* allow token-based link if using link-reset flow (optional) */}
=======
     
>>>>>>> 9ede3a764bdda6eb40b24e7bf98e491e9593fcc3
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
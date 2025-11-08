import axios from "axios";

const AUTH_API = "http://localhost:5000/api/auth";
const PASSWORD_API = "http://localhost:5000/api/password";

export const registerUser = (data) => axios.post(`${AUTH_API}/register`, data);
export const verifyEmailOTP = (data) => axios.post(`${AUTH_API}/verify-otp`, data);
export const resendEmailOTP = (data) => axios.post(`${AUTH_API}/resend-otp`, data);
export const loginUser = (data) => axios.post(`${AUTH_API}/login`, data);

// Password flows (OTP-based)
export const forgotPassword = (data) => axios.post(`${PASSWORD_API}/forgot`, data);
export const resetPassword = (data) => axios.put(`${PASSWORD_API}/reset`, data);

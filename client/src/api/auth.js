import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const registerUser = (data) => axios.post(`${API_URL}/register`, data);
export const verifyEmailOTP = (data) => axios.post(`${API_URL}/verify-otp`, data);
export const resendEmailOTP = (data) => axios.post(`${API_URL}/resend-otp`, data);
export const loginUser = (data) => axios.post(`${API_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${API_URL}/forgot-password`, data);
export const resetPassword = (data) => axios.post(`${API_URL}/reset-password`, data);

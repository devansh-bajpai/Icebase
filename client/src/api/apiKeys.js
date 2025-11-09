import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createApiKey = () => 
  axios.post(`${API_BASE}/keys`, {}, getAuthHeaders());

export const listApiKeys = () => 
  axios.get(`${API_BASE}/keys`, getAuthHeaders());

export const revokeApiKey = (id) => 
<<<<<<< HEAD
  axios.delete(`${API_BASE}/keys/${id}`, getAuthHeaders());

=======
  axios.delete(`${API_BASE}/keys/${id}`, getAuthHeaders());
>>>>>>> 9ede3a764bdda6eb40b24e7bf98e491e9593fcc3

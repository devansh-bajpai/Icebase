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

axios.delete(`${API_BASE}/keys/${id}`, getAuthHeaders());



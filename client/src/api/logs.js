import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Fetch logs optionally by API key (POST version)
export const fetchLogs = (apiKey = "") => {
  console.log("Fetching logs...");
  const url = `${API_BASE}/logs/last30days`;
  const body = apiKey ? { api_key: apiKey } : {};
  return axios.post(url, body, getAuthHeaders());
};

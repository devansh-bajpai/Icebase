import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createApiKey, listApiKeys, revokeApiKey } from "../api/apiKeys";
import { io } from "socket.io-client";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Connect to Socket.IO server
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: token,
      },
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setMessage({ text: "Connected to server", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setMessage({ text: "Connection error: " + error.message, type: "error" });
    });

    // Listen for notifications
    newSocket.on("notification", (data) => {
      setMessage({ text: data.message || "New notification", type: "info" });
      setTimeout(() => setMessage(null), 5000);
    });

    setSocket(newSocket);

    // Load API keys on mount
    loadApiKeys();

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const res = await listApiKeys();
      setApiKeys(res.data);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error loading API keys",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await createApiKey();
      setNewKey(res.data.apiKey);
      setMessage({
        text: res.data.message || "API Key created successfully!",
        type: "success",
      });
      await loadApiKeys();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error creating API key",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this API key?")) {
      return;
    }

    try {
      setLoading(true);
      await revokeApiKey(id);
      setMessage({ text: "API Key revoked successfully", type: "success" });
      await loadApiKeys();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error revoking API key",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setMessage({ text: "API Key copied to clipboard!", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (socket) {
      socket.close();
    }
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-content">
        <section className="api-keys-section">
          <div className="section-header">
            <h2>API Keys</h2>
            <button
              onClick={handleCreateKey}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Creating..." : "Create New API Key"}
            </button>
          </div>

          {newKey && (
            <div className="new-key-alert">
              <h3>⚠️ Important: Save this API key now!</h3>
              <p>You won't be able to see it again after closing this message.</p>
              <div className="key-display">
                <code>{newKey}</code>
                <button
                  onClick={() => handleCopyKey(newKey)}
                  className="btn-copy"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="btn-close"
              >
                Close
              </button>
            </div>
          )}

          {loading && apiKeys.length === 0 ? (
            <div className="loading">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="empty-state">
              <p>No API keys found. Create your first API key to get started.</p>
            </div>
          ) : (
            <div className="api-keys-list">
              {apiKeys.map((key) => (
                <div key={key._id} className="api-key-card">
                  <div className="key-info">
                    <div className="key-preview">
                      <code>{key.key.substring(0, 20)}...</code>
                    </div>
                    <div className="key-meta">
                      <span className="key-date">
                        Created: {formatDate(key.createdAt)}
                      </span>
                      {key.isActive !== false && (
                        <span className="key-status active">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="key-actions">
                    <button
                      onClick={() => handleCopyKey(key.key)}
                      className="btn-secondary"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleRevokeKey(key._id)}
                      className="btn-danger"
                      disabled={loading}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
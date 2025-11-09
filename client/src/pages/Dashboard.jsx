import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createApiKey, listApiKeys, revokeApiKey } from "../api/apiKeys";
import { fetchLogs } from "../api/logs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "../assets/styles/Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState([]);
  const [logsByKey, setLogsByKey] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [chartDataByKey, setChartDataByKey] = useState({});

  const navigate = useNavigate();

  // 🔹 Auth + load API keys
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadApiKeys();
  }, [navigate]);

  // 🔹 Fetch API keys
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

  // 🔹 Fetch logs (POST)
  const loadLogsForKey = useCallback(async (apiKey) => {
    if (!apiKey) return;

    try {
      const res = await fetchLogs(apiKey); // ✅ POST version
      const logs = Array.isArray(res.data?.logs)
        ? res.data.logs
        : Array.isArray(res.data)
        ? res.data
        : [];

      setLogsByKey((prev) => ({ ...prev, [apiKey]: logs }));

      // 🔹 Process logs for chart
      const dailyCounts = {};
      logs.forEach((log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const sortedDates = Object.keys(dailyCounts).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const chartData = {
        labels: sortedDates,
        datasets: [
          {
            label: "Logs per Day",
            data: sortedDates.map((d) => dailyCounts[d]),
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            tension: 0.2,
            fill: true,
          },
        ],
      };

      setChartDataByKey((prev) => ({ ...prev, [apiKey]: chartData }));
    } catch (err) {
      console.error("❌ Error loading logs:", err);
      setLogsByKey((prev) => ({ ...prev, [apiKey]: [] }));
      setChartDataByKey((prev) => ({ ...prev, [apiKey]: null }));

      if (err.code === "ERR_NETWORK") {
        setMessage({
          text: "Network error: Ensure backend is running on port 5000.",
          type: "error",
        });
      } else if (err.response?.status === 401) {
        setMessage({ text: "Session expired. Please login again.", type: "error" });
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 1500);
      } else {
        setMessage({
          text: err.response?.data?.message || "Error loading logs",
          type: "error",
        });
      }
    }
  }, [navigate]);

  // 🔹 When keys load, fetch logs
  useEffect(() => {
    if (apiKeys.length > 0) {
      apiKeys.forEach((key) => {
        if (key && key.key) loadLogsForKey(key.key);
      });
    }
  }, [apiKeys, loadLogsForKey]);

  // 🔹 Key management
  const handleCreateKey = async () => {
    try {
      setLoading(true);
      const res = await createApiKey();
      setMessage({ text: res.data.message || "API Key created!", type: "success" });
      await loadApiKeys();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error creating key",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this API key?")) return;
    try {
      setLoading(true);
      await revokeApiKey(id);
      setMessage({ text: "API Key revoked!", type: "success" });
      await loadApiKeys();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error revoking key",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setMessage({ text: "API Key copied!", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
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
        <div className={`message message-${message.type}`}>{message.text}</div>
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

          {apiKeys.length === 0 ? (
            <p>No API keys found. Create one to start tracking logs.</p>
          ) : (
            <div className="api-keys-list">
              {apiKeys.map((key) => (
                <div key={key._id} className="api-key-card">
                  <div className="key-info">
                    <code>{key.key.substring(0, 20)}...</code>
                    <span>Created: {formatDate(key.createdAt)}</span>
                    {key.isActive !== false && (
                      <span className="key-status active">Active</span>
                    )}
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

                  {/* 🔹 Chart.js Visualization */}
                  {chartDataByKey[key.key] && (
                    <div style={{ marginTop: "25px" }}>
                      <h3 style={{ marginBottom: "10px" }}>Logs (Last 30 Days)</h3>
                      <Line
                        data={chartDataByKey[key.key]}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            x: { title: { display: true, text: "Date" } },
                            y: { title: { display: true, text: "Logs Count" }, beginAtZero: true },
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* 🔹 Logs Table */}
                  <div style={{ marginTop: "20px" }}>
                    <h3>Recent Logs ({logsByKey[key.key]?.length || 0})</h3>
                    {!logsByKey[key.key] ? (
                      <p style={{ color: "#888", fontStyle: "italic" }}>Loading logs...</p>
                    ) : logsByKey[key.key].length === 0 ? (
                      <div style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#888",
                        border: "1px dashed #ddd",
                        borderRadius: "8px"
                      }}>
                        <p>No logs yet for this API key.</p>
                      </div>
                    ) : (
                      <div style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "10px"
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                              <th style={{ padding: "10px", textAlign: "left" }}>Timestamp</th>
                              <th style={{ padding: "10px", textAlign: "left" }}>Log Type</th>
                              <th style={{ padding: "10px", textAlign: "left" }}>UID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logsByKey[key.key].map((log, index) => (
                              <tr key={index} style={{
                                borderBottom: "1px solid #eee",
                                backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa"
                              }}>
                                <td style={{ padding: "10px" }}>{formatDate(log.timestamp)}</td>
                                <td style={{ padding: "10px" }}>{log.logType || "N/A"}</td>
                                <td style={{ padding: "10px", fontFamily: "monospace" }}>{log.uid || "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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

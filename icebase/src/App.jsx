import { useState } from "react";
import WebcamStreamer from "./FaceStream"; // assuming FaceStream exports WebcamStreamer

function App() {
  // State to hold server response
  const [serverData, setServerData] = useState(null);
  // Icebase API key - in production, this should come from environment variables or secure storage
  const [apiKey] = useState(process.env.REACT_APP_ICEBASE_API_KEY || "your-icebase-api-key-here");

  // Handle server response
  const handleServerResponse = (data) => {
    console.log("Server response received in App:", data);
    setServerData(data); // save it to state so UI can reactively update
  };

  return (
    <>
      <div>
        <WebcamStreamer
          serverUrl="http://localhost:5000"
          emitEvent="findUserWithVideo"
          apiKey={apiKey}
          responseEvent="verify-result"
          onResponse={handleServerResponse}
          interval={3000}
          quality={0.8}
          showCanvas={false}
        />
      </div>

      {/* {serverData && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <h2>Server Response</h2>
          {serverData.verified ? (
            <div>
              <h3 style={{ color: "green" }}>✅ Face Verified!</h3>
              <p>Welcome, {serverData.name || "User"}!</p>
            </div>
          ) : (
            <div>
              <h3 style={{ color: "red" }}>❌ Face not recognized</h3>
              <p>Please try again.</p>
            </div>
          )}

          <pre
            style={{
              background: "#f0f0f0",
              padding: "10px",
              borderRadius: "10px",
              marginTop: "10px",
            }}
          >
            {JSON.stringify(serverData, null, 2)}
          </pre>
        </div>
      )} */}
      
    </>
  );
}

export default App;
import { useState } from "react";
import WebcamStreamer from "./FaceStream"; // assuming FaceStream exports WebcamStreamer

function App() {
  // State to hold server response

  // Handle server response
  const handleServerResponse = (data) => {
    console.log("Server response received in App:", data);
  };

  return (
    <>
      <div>
        <WebcamStreamer
          serverUrl="http://localhost:5000"
          emitEvent="findUserWithVideo"
          responseEvent="verify-result"
          onResponse={handleServerResponse}
          interval={3000}
          quality={0.8}
          showCanvas={false}
        />
      </div>
   
    </>
  );
}

export default App;
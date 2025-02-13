import React, { useState, useRef } from "react";

const WebRTCComponent = () => {
  const [status, setStatus] = useState("Not Connected");
  const audioRef = useRef(null);
  let pc = useRef(null);

  const startCall = async () => {
    setStatus("Connecting...");

    try {
      // Fetch session token from the server
      const EPHEMERAL_KEY = "ek_67acb4625a8c8190abb2e08f96241070";

      // Create a new RTCPeerConnection
      pc.current = new RTCPeerConnection();

      // Handle remote audio stream
      pc.current.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.current.addTrack(stream.getTracks()[0]);

      // Data channel for events
      const dataChannel = pc.current.createDataChannel("oai-events");
      dataChannel.addEventListener("message", (e) => console.log(e.data));

      // Create an SDP offer
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = { type: "answer", sdp: await sdpResponse.text() };
      await pc.current.setRemoteDescription(answer);

      setStatus("Connected!");
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      setStatus("Connection Failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>WebRTC Two-Way Audio</h1>
      <button
        onClick={startCall}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
          backgroundColor: "#28a745",
          color: "white",
        }}
      >
        Start Call
      </button>
      <p style={{ fontSize: "18px", fontWeight: "bold", marginTop: "20px" }}>
        {status}
      </p>
      <audio ref={audioRef} autoPlay></audio>
    </div>
  );
};

export default WebRTCComponent;

import React, { useState, useRef } from "react";

const WebRTCComponent = () => {
  const [status, setStatus] = useState("Not Connected");
  const audioRef = useRef(null);
  let pc = useRef(null);
  let dataChannel = useRef(null);

  const startCall = async () => {
    setStatus("Connecting...");

    try {
      const EPHEMERAL_KEY = "ek_67adcd1965e08190beb028d2f9b2b25e";

      pc.current = new RTCPeerConnection();

      pc.current.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.current.addTrack(stream.getTracks()[0]);

      dataChannel.current = pc.current.createDataChannel("oai-events");
      dataChannel.current.addEventListener("open", () => {
        console.log("Data channel open!");
      
        const message = JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Talk to the user in English only unless he starts talking in his language. As soon as the connection starts, start talking about the Python learning path since I want to learn Python. Keep speaking like a professor unless there's a direct question to you. Ignore all the noise coming from my end unless they're direct question related to python and to you.",
              },
            ],
          },
        });
      
        dataChannel.current.send(message);
        console.log("Sent JSON message:", message);
      });      

      dataChannel.current.addEventListener("message", (e) =>
        console.log("Received:", e.data)
      );

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

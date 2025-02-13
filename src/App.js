import React, { useState, useRef } from "react";

const WebRTCComponent = () => {
  const [status, setStatus] = useState("Not Connected");
  const audioRef = useRef(null);
  let pc = useRef(null);
  let dataChannel = useRef(null);

  const startCall = async () => {
    setStatus("Connecting...");

    try {
      const EPHEMERAL_KEY = "ek_67adeed3d23c8190bc1ec86e9086a433";

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
      
        const text_prompt = `Greet the user by name—Uday—and ask if they're ready to start learning Python.
                            If they say yes, begin with the following instructions. Otherwise, let them know that they can inform you whenever they're ready, and you'll start accordingly.
                            Communicate with the user in English unless they initiate the conversation in another language. Take a moment to read the instructions carefully before responding.
                            Once the user confirms they're ready, introduce the Python learning path, starting with data types, functions, and classes, followed by other essential topics.
                            Maintain a professor-like tone throughout the explanation unless the user asks you a direct question.
                            Ignore any background noise or unrelated conversation from the user's end unless they ask a direct Python-related question.`

        var message = JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: text_prompt,
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

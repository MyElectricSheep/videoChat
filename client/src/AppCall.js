import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer"
import "./App.css";

function App() {
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState();
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);
  
  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io.connect("/");

    socket.current.on("yourId", (id) => {
      setMe((prevMe) => ({ ...prevMe, id }));
    });
    socket.current.on("connectedUsers", (users) => {
      console.log({ users });
      setConnectedUsers(users);
    });

    socket.current.on('hey', (data) => {
         setReceivingCall(true);
         setCaller(data.from)
         setCallerSignal(data.signal)
    })
  }, []);

  useEffect(() => {
      if (connected) {
        navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
        });
      }
  }, [connected])

  const handleNewGuest = (e) => {
    setMe({
      ...me,
      [e.target.name]: e.target.value,
    });
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!me.nickname || !me.country || !me.language)
      return alert("Please fill in your information");
    socket.current.emit("newGuestUser", me);
    setConnected(true);
  };

  const callPeer = (id) => {
      const peer = new Peer({
          initiator: true,
          trickle: false,
          stream
      });
      peer.on('signal', data => {
        socket.current.emit('callUser', { 
            userToCall: id,
            signalData: data,
            from: me
        })
      })
      peer.on('stream', stream => {
          if (partnerVideo.current) {
              partnerVideo.current.srcObject = stream;
          }
      })
      socket.current.on('callAccepted', signal => {
          setCallAccepted(true)
          peer.signal(signal)
      })
  }

  const acceptCall = () => {
      setCallAccepted(true)
      const peer = new Peer({
          initiator: false,
          trickle: false,
          stream
      })
      peer.on('signal', data => {
          console.log({callerId: caller.id})
          socket.current.emit('acceptCall', {signal: data, to: caller.id})
      })
      peer.on('stream', stream => {
          partnerVideo.current.srcObject = stream
      })
      peer.signal(callerSignal)
  }

  return (
    <>
      {!connected && (
        <>
          <h1>Hello Guest! Please enter a few information below:</h1>
          <form onSubmit={handleConnect}>
            <input
              type="text"
              placeholder="nickname"
              onChange={handleNewGuest}
              name="nickname"
            />
            <input
              type="text"
              placeholder="country"
              onChange={handleNewGuest}
              name="country"
            />
            <input
              type="text"
              placeholder="language"
              onChange={handleNewGuest}
              name="language"
            />
            <input type="submit" />
          </form>
        </>
      )}
      {connected && (
        <>
          <h2>You are currently connected as:</h2>
          <div>
            <p>id: {me.id}</p>
            <p>nickname: {me.nickname}</p>
            <p>country: {me.country}</p>
            <p>language: {me.language}</p>
          </div>
        </>
      )}
      <>
        <h3>
          There are currently{" "}
          {connectedUsers.filter((user) => user.id !== me.id).length} other
          users connected
        </h3>
        {!callAccepted && connectedUsers
          .filter((user) => user.id !== me.id)
          .map((user) => {
            return (
              <div key={user.id}>
                <span>
                  nickmame: {user.nickname} / country: {user.country} /
                  language: {user.language}
                </span>
                {connected && <button onClick={() => callPeer(user.id)}>Call!</button>}
              </div>
            );
          })}
      </>
      {receivingCall && !callAccepted && <>
      <h1>{caller && caller.nickname} is calling you</h1>
      <button onClick={acceptCall}>Accept!</button>
      </>}
      <>
        {callAccepted && (
          <>
            <video
              style={{ width: "50%", height: "50%" }}
              playsInline
              muted
              ref={userVideo}
              autoPlay
            ></video>{" "}
            <video
              style={{ width: "50%", height: "50%" }}
              playsInline
              ref={partnerVideo}
              autoPlay
            ></video>
          </>
        )}
      </>
    </>
  );
}

export default App;

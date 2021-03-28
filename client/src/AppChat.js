import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import './App.css';

function App() {
  const [myId, setMyId] = useState();
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("");
  const socketRef = useRef()

  useEffect(() => {
    socketRef.current = io.connect('/')

    socketRef.current.on("your id", id => setMyId(id))

    socketRef.current.on('new message', message => setMessages(prevMessages => [...prevMessages, message]))
  }, [])

  const sendMessage = (e) => {
    e.preventDefault()
    const messageObject = {
      body: message,
      id: myId
    }
    socketRef.current.emit("send message", messageObject)
    setMessage("")
  }

  const handleUserChat = (e) => {
    setMessage(e.target.value)
  }

  const handleNewGuest = () => {
    
  }

  return (
<>
{messages.map((message, index) => {
  if (message.id === myId) {
    return <p style={{textAlign: 'left'}} key={index}>You say: {message.body}</p>
  } else {
    return <p style={{textAlign: 'right'}} key={index}>{message.id} says: {message.body}</p>
  }
})}
<input type="text" placeholder="What's your message?" onChange={handleUserChat} value={message}></input>
<button onClick={sendMessage}>Send message</button>
</>
  );
}

export default App;

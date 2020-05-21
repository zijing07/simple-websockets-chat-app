import React, { useEffect, useRef, useState } from 'react';
import { Button, Input } from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";

const WEB_SOCKET_URL = "wss://livu5ax5n3.execute-api.us-east-1.amazonaws.com/Prod"

enum MESSAGE_TYPE {
  SYSTEM_MESSAGE,
  SYSTEM_ERROR,
  USER_MESSAGE
}

interface Message {
  type: MESSAGE_TYPE;
  message: any;
}

const useStyles = makeStyles({
  systemText: {
    color: 'green'
  },
  systemError: {
    color: 'red'
  },
  userMessage: {
    color: 'black'
  }
})

export const ChatView = () => {
  const [messageList, setMessageList] = useState<Message[]>([]);

  const websocket = useRef<WebSocket>(new WebSocket(WEB_SOCKET_URL));
  useEffect(() => {
    const addMessage = (message: Message) => {
      setMessageList(prev => [...prev, message]);
    }

    addMessage({ type: MESSAGE_TYPE.SYSTEM_MESSAGE, message: 'Connecting...' });
    websocket.current.onopen = () => {
      addMessage({
        type: MESSAGE_TYPE.SYSTEM_MESSAGE,
        message: 'You are connected!'
      });
    }
    websocket.current.onclose = () => {
      addMessage({
        type: MESSAGE_TYPE.SYSTEM_MESSAGE,
        message: 'You are disconnected.'
      });
    }
    websocket.current.onerror = (error) => {
      addMessage({
        type: MESSAGE_TYPE.SYSTEM_ERROR,
        message: `Error while connecting... ${error && error.toString()}`
      });
    }
    websocket.current.onmessage = (event) => {
      addMessage({
        type: MESSAGE_TYPE.USER_MESSAGE,
        message: event.data
      });
    }

    return () => websocket.current.close();
  }, []);

  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = () => {
    if (inputMessage && inputMessage.trim().length > 0) {
      websocket.current && websocket.current.send(JSON.stringify({
        action: "sendmessage",
        data: inputMessage.trim()
      }));
      setInputMessage('');
    }
  }

  const styles = useStyles();
  const getMessageClassName = (messageType: MESSAGE_TYPE) => {
    switch (messageType) {
      case MESSAGE_TYPE.USER_MESSAGE:
        return styles.userMessage;
      case MESSAGE_TYPE.SYSTEM_MESSAGE:
        return styles.systemText;
      case MESSAGE_TYPE.SYSTEM_ERROR:
        return styles.systemError;
    }
  }

  return (
    <div>
      <div>
        {messageList.map((message, index) => (
          <div key={index.toString()} className={getMessageClassName(message.type)}>
            {message.message}
          </div>
        ))}
      </div>

      <span>
        <Input
          onKeyDown={event => (event.keyCode === 13) && sendMessage()}
          onChange={event => {setInputMessage(event.target.value)}}
          value={inputMessage}
        />
        <Button variant="outlined" onClick={() => sendMessage()}>Send</Button>
      </span>
    </div>
  )
}
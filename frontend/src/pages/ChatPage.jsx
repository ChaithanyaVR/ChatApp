import axios from 'axios';
import React,{useState,useEffect, useContext} from 'react'
import { useRef } from 'react';
import Avatar from '../components/Avatar';
import Logo from '../components/Logo';
import {UserContext} from '../context/UserContext'

function ChatPage({socket}) {
  const {username,id} = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [selectedUserId,setSelectedUserId] = useState(null);
  const [newMessageText,setNewMessageText] = useState('')
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState({});
  const divUnderMessages = useRef();




  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('connected')
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('disconnected')
    }

    socket.on('connect', onConnect);
    socket.on('ACTIVEUSERS', (data) => {
      console.log('ACTIVEUSERS event received:', data);
      
      const users={};
      Object.values(data).forEach(user=>{
        users[user.userId]=user.username;
      })
      setActiveUsers(users);
    })
    socket.on('BRD_MSG', (data) => {
      console.log('[' + data.user + ']: ' + data.message);
      setMessages(prev => [...prev, data]);
    })

    socket.on('disconnect', onDisconnect);
 

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);






  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  useEffect(() => {
  if (selectedUserId) {
    axios.get('/messages/' + selectedUserId)
      .then(res => {
        // Assuming res.data is an array of messages
        setMessages(res.data.map(msg => ({
          id: msg._id, // Assuming _id is the unique identifier for the message
          user: msg.sender, // Assuming sender is the ID of the user who sent the message
          message: msg.text // Assuming text is the actual message content
        })));
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
      });
  }
}, [selectedUserId]);

  

  function sendMessage(e){
    e.preventDefault();
    socket.emit('MESSAGE', { to: selectedUserId, message: newMessageText });
    setMessages(prev => [...prev, { user: id, message: newMessageText, to: selectedUserId , id:Date.now() }]);
    setNewMessageText('');
  }


const onlinePeopleExclOurUser = {...activeUsers};
delete onlinePeopleExclOurUser[id];



  return (
    <>
      <div className='flex h-screen'>
        <div className="bg-white w-1/3">
         <Logo/>
          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <div key={userId}
              onClick={()=>setSelectedUserId(userId)}
              className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer "+(userId === selectedUserId ? 'bg-green-50' : '')}>
              {userId === selectedUserId && (
                <div className='w-1 bg-green-500 h-12 rounded-r-md'></div>
              )}
              <div className='flex gap-2 py-2 pl-4 items-center'>
              <Avatar username={activeUsers[userId]} userId={userId}/>
              <span className='text-gray-800'>{activeUsers[userId]}</span>
              </div>
             
            </div>
          ))}
        </div>
        <div className="bg-green-100 w-2/3 p-2 flex flex-col">
          <div className='flex-grow'>
            {!selectedUserId && (
              <div className='flex items-center flex-grow justify-center h-full'>
              <div className='text-gray-300 text-2xl'>&larr; Select a person from the sidebar</div>
              </div>
            )}
            {!!selectedUserId && (
              <div className='relative h-full'>
              <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
                {messages.filter(msg => msg.user === selectedUserId || msg.user === id).map((msg) => (
                  <div key={msg.id} className={`${msg.user === id ? 'text-right' : ''}`}>
                    <div className={`text-left inline-block text-sm my-2 p-2 rounded-md ${msg.user === id ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
              </div>
              
            )}
          </div>
          {!!selectedUserId && (
            <form className='flex gap-2' onSubmit={sendMessage}>
            <input
              value={newMessageText}
              onChange={ev=>setNewMessageText(ev.target.value)}
              type='text'
              placeholder='Type your message here'
              className='bg-white border p-2 flex-grow rounded-md'
            />
            <button type='submit' className='bg-green-500 p-2 text-white rounded-md'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>

            </button>
          </form>
          )}
        
        </div>
      </div>

      {/* <div>
        {messages.map(item => <p> <b>{item?.user}: </b> {item?.message}</p>)}
        <input className='border border-black' type='text' onChange={(e) => { setMessage(e.target.value) }} value={message} />
        <button onClick={handleSubmit}>Send</button>
        <div>
          <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
            <option value=''>Broadcast to all</option>
            {Object.keys(activeUsers)
              .filter(userId => userId !== socket.id)
              .map(userId => (
                <option key={userId} value={userId}>{activeUsers[userId].username}</option>
              ))}
          </select>
        </div>
      </div> */}
    </>
  )
}

export default ChatPage
import React, { useContext } from 'react';
import ChatPage from './pages/ChatPage';
import {Routes,Route} from 'react-router-dom'
import {socket} from './socket'
import Home from './pages/Home';

import axios from 'axios'
import { UserContext, UserContextProvider } from './context/UserContext';
import RegisterAndLoginForm from './components/RegisterAndLoginForm';


socket.connect()

export default function App() {
  axios.defaults.baseURL = 'http://localhost:3000';
  axios.defaults.withCredentials = true;
  const {username,id} = useContext(UserContext);
  if(username){
    return <ChatPage socket={socket}/>
  }
  return (
    <div className="App">
  
     <Routes>
       <Route path='/' element={<RegisterAndLoginForm socket={socket}/>}></Route>
       <Route path='/chat' element={<ChatPage socket={socket}/>}></Route>
      </Routes>
    </div>
  );
}
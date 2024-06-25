import React,{useEffect, useState} from 'react'
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

function RegisterAndLoginForm({socket}) {
    const [username,setUsername] = useState('');
    const [password,setPassword] = useState('');
    const[isLoginOrRegister,setIsLoginOrRegister]=useState('register');
  const {setUsername:setLoggedInUsername,setId} = useContext(UserContext)


  useEffect(() => {
    socket.on('ACTIVEUSERS', (activeUsers) => {
      console.log('Active users:', activeUsers);
    });
  
    return () => {
      socket.off('ACTIVEUSERS');
    };
  }, [socket]); 

   async function handleSubmit(e){
        e.preventDefault();
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';
      const {data}= await axios.post(url,{username,password},
        {headers:{
        'content-type': 'application/json',
      },
      withCredentials: true,
    })    
      setLoggedInUsername(username);
      setId(data.id);
      console.log(data);
    }

  return (
    <div className='bg-blue-50 h-screen flex items-center'>
        <form className='w-64 mx-auto mb-20' onSubmit={handleSubmit}>
            <input
            value={username} 
            onChange={e=>setUsername(e.target.value)} 
            type="text" placeholder='username' 
            className='block w-full rounded-sm p-2 mb-2 border '/>
            <input 
            value={password}
            onChange={e=>setPassword(e.target.value)} 
            type="password" 
            placeholder='password'
            className='block w-full rounded-sm p-2 mb-2 border'/>
            <button className='bg-green-500 text-white block w-full rounded-md p-2'>
           {isLoginOrRegister === 'register'? 'Register' : 'Login'}
            </button>
            <div className='text-center mt-2'>
                {isLoginOrRegister === 'register' && (
                    <div>Already a member?
                        <button onClick={()=>setIsLoginOrRegister('login')}>
                             Login Here
                         </button>
                    </div>                   
                )}
                {isLoginOrRegister === 'login' && (
                    <div>Dont have an account?
                        <button onClick={()=>setIsLoginOrRegister('register')}>
                            Register
                         </button>
                    </div>                   
                )}
               
            </div>
        </form>
    </div>
  )
}

export default RegisterAndLoginForm
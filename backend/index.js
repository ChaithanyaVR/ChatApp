const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path');
const mongoose= require('mongoose');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser')
const cors=require('cors');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());
app.use(cookieParser());
const httpServer = createServer(app);
const User = require('./models/User');
const Message = require('./models/Message')

const dotenv=require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URL);
const jwtSecret= process.env.JWT_SECRET;
const bcryptSalt=bcrypt.genSaltSync(10);

const allowedOrigins = ['http://localhost:5173','*'];

const corsOptions = {
  origin: allowedOrigins, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Required for cookies and other credentials
  optionSuccessStatus: 200
};
app.use(cors(corsOptions));
const io = new Server(httpServer, {  cors: {
  origin: allowedOrigins, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
  },
 });


let connectedUsers = {};
 const addConnectedUser = (socket, token) => {
  jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) {
      console.error('JWT verification error:', err);
      return;
    }
    const { userId, username } = userData;
    console.log('User ID:', userId, 'Username:', username);
    connectedUsers[socket.id] = { userId, username };
    io.emit('ACTIVEUSERS',Object.values(connectedUsers));
  });
};


io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  const cookieString = socket.handshake.headers.cookie;
  if (cookieString) {
   const tokenCookieString= cookieString.split(';').find(str=>str.startsWith('token='));
  if(tokenCookieString){
    const token=tokenCookieString.split("=")[1];
    if(token){
      addConnectedUser(socket, token);
    }
  }
  }
   
   
   
  socket.on('MESSAGE', async({ to, message }) => {
    console.log(`Message from ${socket.id} to ${to}: ${message}`);
    const recipientSocketId = Object.keys(connectedUsers).find(key => connectedUsers[key].userId === to);
    if (recipientSocketId) {
     try{
      const newMessage = new Message({
        sender:connectedUsers[socket.id].userId,
        recipient:to,
        text:message,
      });
      await newMessage.save();
      socket.to(recipientSocketId).emit('BRD_MSG', { user: connectedUsers[socket.id].userId, message: message });
     } catch (error) {
      console.error('Error saving message:', error);
  }     
    } else {
      console.error(`Recipient not connected: ${to}`);
    }
  });

  socket.on("disconnect", () => {
    console.log('disconnecting...',socket.id)
    delete connectedUsers[socket.id];
    io.emit('ACTIVEUSERS', Object.values(connectedUsers));
});
  // Emit the active users list when a new client connects
io.emit('ACTIVEUSERS', Object.values(connectedUsers));
});

async function getUserDataFromRequest(req){
  return new Promise((resolve,reject)=>{
    const token = req.cookies?.token;
    if(token){
     jwt.verify(token,jwtSecret,{},(err,userData)=>{
     if(err) throw err;
     resolve(userData);
    })
    }else{
      reject('no token');
    }
  })
 
}

app.get('/messages/:userId',async(req,res)=>{
  try{
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      $or: [
        { sender: ourUserId, recipient: userId },
        { sender: userId, recipient: ourUserId }
      ]
    }).sort({ createdAt: 1 });
    console.log('messages',messages);
    res.json(messages);
  }catch(err){
    res.status(500).json({error:err.message});
  }
 
})




app.get('/profile',async(req,res)=>{
 const token = req.cookies?.token;
 if(token){
  jwt.verify(token,jwtSecret,{},(err,userData)=>{
  if(err) throw err;
  res.json(userData);
 })
 }else{
  res.status(401).json('no token')
 }
 
})


app.post('/login',async(req,res)=>{
  const {username,password} = req.body;
  const foundUser= await User.findOne({username})
  if(foundUser){
   const passOK = bcrypt.compareSync(password,foundUser.password);
   if(passOK){
    jwt.sign({userId:foundUser._id,username},jwtSecret,{},(err,token)=>{
        if(err) throw err;
        res.cookie('token',token,{sameSite:'none',secure:true}).json({
          id:foundUser._id,
        })
    })
   }
  }
})



app.post('/register',async(req,res)=>{
  const{username,password} = req.body;
  try{
    const hashedPassword = bcrypt.hashSync(password,bcryptSalt);
    const createdUser = await User.create({
      username:username,
      password:hashedPassword
    });
  jwt.sign({userId:createdUser._id,username},jwtSecret,{},(err,token)=>{
    if(err) throw err;
    res.cookie('token',token,{sameSite:'none',secure:true}).status(201).json({
      id:createdUser._id,
    });
  });
  }catch(err){
    if(err) throw err;
    res.status(500).json('error');
  }
 
});


httpServer.listen(3000);


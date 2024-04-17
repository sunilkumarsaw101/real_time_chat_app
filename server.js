import express from 'express';
import {Server} from 'socket.io';
import cors from 'cors'
import http from 'http';
import { connect } from './config.js';
import { chatModel } from './chat.schema.js';

const app= express();

//1. Create server using http.
const server= http.createServer(app);

//2. Create socket.
const io= new Server(server, {
    cors:{
        origin:'*',
        methods: ['GET', 'POST']
    }
});

//3. Use socket events.

io.on('connection',(socket)=>{
    console.log('Connection is established');

    //listen the user name by join event.
    socket.on('join',(data)=>{
        //adding username to socket to use later.
        socket.userName= data;
        
        //send old messages to the clients
        chatModel.find().sort({timestamp:1}).limit(50)
        .then((messages)=>{
            console.log(messages);
            socket.emit("load_messages", messages);
        }).catch((err)=>{
            console.log(err);
        });
    });

    //listen to the new_message event.
    socket.on('new_message', (message)=>{

        let userMessage={
            userName: socket.userName,
            message: message
        }

        console.log(userMessage);
        //storing in database.
         const newChat= new chatModel({
            username: socket.userName,
            message: message,
            timestamp: new Date()
         });

         newChat.save();

        //broadcast the message with userName for all the users.
        socket.broadcast.emit('broadcast_message', userMessage);
    })
    //listen to the disconnect event.
    socket.on('disconnect', ()=>{
        console.log('Connection is disconnected');
    })
});

server.listen(9000, ()=>{
    console.log('App is listening on port 9000');
    connect();
});
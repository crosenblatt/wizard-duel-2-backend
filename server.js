const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

io.on('connection', (socket) => {

    console.log('user connected, cool')

    socket.on('join', function() {
        console.log("user has joined");
        socket.broadcast.emit('userjoinedthechat');
    })


    socket.on('messagedetection', (spellName) => {

        console.log(spellName)
        let  message = { "spell" : spellName }
        
        io.emit('message', message )

        })

    socket.on('disconnect', function() {
        console.log("goodbye")
        socket.broadcast.emit( "userdisconnect" ,' user has left')
    })

})

server.listen(3000,()=>{
    console.log('Node app is running on port 3000, hi')
})


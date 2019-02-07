const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);
app.get('/', (req, res) => {

res.send('Chat Server is running on port 3000')
});

server.listen(3000,()=>{

console.log('Node app is running on port 3000')

});

io.on('connection', (socket) => {
    console.log('user connected');
    socket.broadcast.emit('user connected');
    socket.on('messagedetection', (spellString) => {
        console.log(spellString);
        let spell = {"spell": spellString};
        socket.emit('message', spell);
    });
    
    socket.on('disconnect', function() {
        console.log('user gone');
    });
});


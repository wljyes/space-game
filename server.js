var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var express = require('express');

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

//todo: atomic operation
var id = 1;
var ids = [];
var sockets = [];

io.on('connection', (socket) => {
    console.log('a player connected.');
    ids[socket] = id++;
    sockets[ids[socket]] = socket;
    
    socket.emit('ID_ASSIGN', ids[socket]);
    socket.broadcast.emit('PLAYER_COME_IN', ids[socket]);
    socket.on('NOTIFY_LOC', (msg) => {
        sockets[msg.toId].emit('OLD_PLAYER_NOTIFY', msg);
    });

    socket.on('disconnect', () => {
        console.log('a player is gone.');
    })
});

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var express = require('express');

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

http.listen(80, () => {
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

    socket.on(Messages.PLAYER_KEY_UP, id => {
        socket.broadcast.emit(Messages.PLAYER_KEY_UP, id);
    });
    socket.on(Messages.PLAYER_KEY_DOWN, id => {
        socket.broadcast.emit(Messages.PLAYER_KEY_DOWN, id);
    });
    socket.on(Messages.PLAYER_KEY_LEFT, id => {
        socket.broadcast.emit(Messages.PLAYER_KEY_LEFT, id);
    });
    socket.on(Messages.PLAYER_KEY_RIGHT, id => {
        socket.broadcast.emit(Messages.PLAYER_KEY_RIGHT, id);
    });
    socket.on(Messages.PLAYER_KEY_SPACE, id => {
        // console.log('fire');
        socket.broadcast.emit(Messages.PLAYER_KEY_SPACE, id);
    });
    socket.on(Messages.PLAYER_KEY_ENTER, id => {
        socket.broadcast.emit(Messages.PLAYER_KEY_ENTER, id);
    });

    socket.on('disconnect', () => {
        console.log('a player is gone.');
        socket.broadcast.emit(Messages.PLAYER_LEAVE, id);
        delete sockets[socket];
        delete ids[id];
    });
});

const Messages = {
    PLAYER_KEY_DOWN: 'PLAYER_KEY_DOWN',
	PLAYER_KEY_UP: 'PLAYER_KEY_UP',
	PLAYER_KEY_LEFT: 'PLAYER_KEY_LEFT',
	PLAYER_KEY_RIGHT: 'PLAYER_KEY_RIGHT',
	PLAYER_KEY_SPACE: 'PLAYER_KEY_SPACE',
    PLAYER_KEY_ENTER: 'PLAYER_KEY_ENTER',
    PLAYER_LEAVE: 'PLAYER_LEAVE'
}

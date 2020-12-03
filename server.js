var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send('Space Game Server!');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {
    console.log('a user connected.');
});

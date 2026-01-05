const express = require('express');
const { ExpressPeerServer } = require('peer');
const app = express();

const port = process.env.PORT || 9000;

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/myapp',
    allow_discovery: true
});

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.send('PhotoSync Relay Server is Running! 🚀');
});

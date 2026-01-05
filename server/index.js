const { PeerServer } = require('peer');

const port = process.env.PORT || 9000;

console.log(`Starting PeerJS server on port ${port}...`);

const peerServer = PeerServer({
    port: port,
    path: '/myapp',
    allow_discovery: true,
    proxied: true // Important for Render/Heroku/behind Nginx
});

console.log('PeerJS server started!');

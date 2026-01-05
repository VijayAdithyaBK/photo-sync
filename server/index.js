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

const path = require('path');

app.use('/peerjs', peerServer);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA Fallback: Serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

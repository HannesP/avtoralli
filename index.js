const path = require('path');
const http = require('http');
const express = require('express');
const WebSocketServer = require('websocket').server;
const uuid = require('uuid');

const Room = require('./src/room');

const app = express();

const rooms = {};

app.get('/avtoralli/rooms/new', (req, res) => {
    const id = uuid.v4();
    rooms[id] = new Room(2);
    res.redirect('/avtoralli/rooms/' + id);
});

app.get('/avtoralli/rooms/:roomid', (req, res) => {
    const id = req.params.roomid;
    if (!(id in rooms)) {
        res.sendStatus(404);
        return;
    } 
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/avtoralli', (req, res) => {
    res.redirect('/avtoralli/rooms/new');
});

const port = process.env.PORT || 8080;

const httpServer = http.createServer(app);
httpServer.listen(port, () => {});

const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', req => {
    try {
        const parts = req.resource.split('/');
        const resource = parts[2], id = parts[3];
        
        if (resource !== 'rooms' || !(id in rooms)) {
            req.reject();
        }
        
        const conn = req.accept('echo-protocol', req.origin);
        const room = rooms[id];
        room.connect(conn);
        
        conn.on('message', msg => {
            try {
                const {type, params} = JSON.parse(msg.utf8Data);
                room.handleCommand(conn, type, params || {});
            } catch (err) {
                console.error(err);
            }
        });
        
        conn.on('close', (code, desc) => {
            room.disconnect(conn);
        });
    } catch (err) {
        console.error('Request failed: ' + err);
    }
});
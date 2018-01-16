const path = require('path');
const http = require('http');
const express = require('express');
const WebSocketServer = require('websocket').server;
const uuid = require('uuid');

const Room = require('./src/room');

const httpServer = http.createServer((req, res) => res.end());
httpServer.listen(8081, () => {});

const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', req => {
    try {
        const [rootSlash, resource, id] = req.resource.split('/');
        if (resource !== 'rooms' || !(id in rooms)) {
            req.reject();
        }
        
        const conn = req.accept('echo-protocol', req.origin);
        const room = rooms[id];
        room.connect(conn);
        
        conn.on('message', wsMsg => {
            try {
                const msg = JSON.parse(wsMsg.utf8Data);
                const {command, params} = msg;
                room.handleCommand(conn, command, params || {});
            } catch (err) {
                console.error(err);
            }
        });
        
        conn.on('close', (code, desc) => {});
    } catch (err) {
        console.error('Request failed: ' + err);
    }
});

const app = express();
app.listen(8080);

const rooms = {};

app.get('/rooms/new', (req, res) => {
    const id = uuid.v4();
    rooms[id] = new Room(2);
    res.redirect('/rooms/' + id);
});

app.get('/rooms/:roomid', (req, res) => {
    const id = req.params.roomid;
    if (!(id in rooms)) {
        res.sendStatus(404);
        return;
    } 
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
    res.redirect('/rooms/new');
});
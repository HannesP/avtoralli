const path = require('path');
const http = require('http');
const express = require('express');
const WebSocketServer = require('websocket').server;
const uuid = require('uuid');

const Room = require('./room');

const rooms = {};

const maxNumberOfRooms = 10;

const app = express();

app.get('/avtoralli/rooms/new', (req, res) => {
    if (Object.keys(rooms).length >= maxNumberOfRooms) {
        res.status(403).send('Too many games running. Try again later!');
        return;
    }

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
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/avtoralli', (req, res) => {
    res.redirect('/avtoralli/rooms/new');
});

const port = process.env.PORT || 8080;

const httpServer = http.createServer(app);
httpServer.listen(port, () => {
    console.log('Running at ' + port);
});

const wsServer = new WebSocketServer({httpServer});
wsServer.on('request', req => {
    try {
        const parts = req.resource.split('/');
        const resource = parts[2], id = parts[3];
        
        if (resource !== 'rooms' || !(id in rooms)) {
            req.reject();
            return;
        }

        if (Object.keys(rooms).length > maxNumberOfRooms) {
            req.reject();
            return;
        }
        
        const conn = req.accept('echo-protocol', req.origin);
        const room = rooms[id];
        
        if (room.isDiscontinued) {
            req.reject();
            return;
        }

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
            if (room.isDiscontinued) {
                delete rooms[id];
            }
        });
    } catch (err) {
        console.error('Request failed: ' + err);
    }
});
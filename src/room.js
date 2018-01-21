const Game = require('./game');

class Room {
    constructor(numParticipants) {
        this.numParticipants = numParticipants;
        this.connectedPlayers = [];
        this.connectedSpectators = [];
        this.game = null;
        this.isDiscontinued;
    }

    connect(conn) {
        if (this.connectedPlayers.length < this.numParticipants) {
            this.connectedPlayers.push(conn);
        } else {
            this.connectedSpectators.push(conn);
        }
        
        if (this.isFilled()) {
            this.game = new Game();
            this.game.start();
            
            const fps = 1000/30;
            this.pumpHandle = setInterval(() => this.pumpEvents(), fps);
        }
    }
    
    disconnect(conn) {
        const playerIndex = this.connectedPlayers.indexOf(conn);
        const specIndex = this.connectedSpectators.indexOf(conn);

        if (playerIndex !== -1) {
            this.game.stop();
            this.broadcast({type: 'PlayerDisconnected', player: playerIndex});
            this.connectedPlayers.splice(playerIndex, 1);
            clearInterval(this.pumpHandle);
            this.isDiscontinued = true;
        } else if (specIndex !== -1) {
            this.connectedSpectators.splice(specIndex, 1);
        }
    }

    broadcast(event) {
        const clients = this.connectedPlayers.concat(this.connectedSpectators);

        for (const client of clients) {
            client.sendUTF(JSON.stringify(event));
        } 
    }
    
    pumpEvents() {
        const events = this.game.flushEvents();
        
        for (const event of events) {
            this.broadcast(event);
        }
    }
    
    isFilled() {
        return this.connectedPlayers.length == this.numParticipants;
    }

    handleCommand(conn, command, params) {
        if (this.game === null) {
            return;
        }
        
        const playerNo = this.connectedPlayers.indexOf(conn);
        if (playerNo !== -1) {
            this.game.issueCommand(playerNo, command, params);
        }
    }
}

module.exports = Room;
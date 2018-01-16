const Game = require('./game');

class Room {
    constructor(numParticipants) {
        this.numParticipants = numParticipants;
        this.connectedPlayers = [];
        this.connectedSpectators = [];
        this.game = null;
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
            setInterval(() => this.pumpEvents(), fps); // todo: save handler and unregister when game stops
        }
    }
    
    disconnect(conn) { 
        if (this.connectedPlayers.indexOf(conn) !== -1) {
            this.game.stop();
        } else {
            this.connectedSpectators = this.connectedSpectators.filter(spec !== conn);
        }
    }
    
    pumpEvents() {
        const clients = this.connectedPlayers.concat(this.connectedSpectators);
        const events = this.game.flushEvents();

        for (const client of clients) {
            for (const event of events) {
                //console.log(JSON.stringify(event));
                client.sendUTF(JSON.stringify(event));
            }
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
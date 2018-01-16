class BaseGame {
    constructor() {
        this.players = [];
        
        this.allEvents = [];
        this.newEvents = [];
        
        this.handlers = {};
        this.setUpHandlers();
        
        this.isRunning = false;
    }
    
    setUpHandlers() {
    }
    
    on(command, handler) {
        this.handlers[command] = handler;
    }
    
    issueCommand(playerIndex, command, params) {
        if (false) {
            console.log('Received command ' + command + ' from player ' + playerIndex);
        }
        const player = this.players[playerIndex];
        this.handlers[command](player, params);
    }
    
    bufferEvent(event) {
        this.allEvents.push(event);
        this.newEvents.push(event);
    }
    
    flushEvents() {
        const newEvents = this.newEvents;
        this.newEvents = [];
        return newEvents;
    }
    
    start() {
        this.isRunning = true;
        setInterval(() => this.update(), this.timeStep);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    update() {
    }
}

module.exports = BaseGame;
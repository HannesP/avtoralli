const BaseGame = require('./base-game');

class Game extends BaseGame {
    constructor() {
        super();
        this.timeStep = 1000/30;
        this.width = 400;
        this.height = 300;
        this.initGame();
    }
    
    initGame() {
        this.players = [0, 1].map(i => {
            return {
                x: i ? 20 : this.width - 20,
                y: this.height / 2,
                angle: i === 0 ? 0 : Math.PI,
                
                angularVelocity: 0,
                angularAcceleration: 0,
                
                velocity: 0,
                acceleration: 0,
                
                score: 0,
            };
        });

        this.targets = Array(20).fill().map(i => {
            const x = i % 5;
            const y = Math.floor(i / 5);
            return {
                x: Math.round(10 + Math.random() * this.width - 10),
                y: Math.round(10 + Math.random() * this.height - 10),
            };
        });
        
        this.currentTarget = 0;
    }
    
    setUpHandlers() {
        this.on('PlayerTurnLeft', (player, params) => {
            player.angularAcceleration = -2;
        });
    
        this.on('PlayerTurnRight', (player, params) => {
            player.angularAcceleration = 2;
        });
    
        this.on('PlayerAccelerate', (player, params) => {
            player.velocity = 50;
        });
    
        this.on('PlayerStopAccelerate', (player, params) => {
            player.velocity = -3;
        });
    }
    
    renewTarget() {
        while (true) {
            const newTarget = Math.floor(Math.random() * this.targets.length);
            if (newTarget !== this.currentTarget) {
                this.currentTarget = newTarget;
                return newTarget;
            }
        }
    }

    update() {
        const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const dt = this.timeStep / 1000;
        
        // for (const [player, i] of this.players) {
        this.players.forEach((player, i) => {
            player.angularVelocity += dt * player.angularAcceleration;
            player.angularVelocity = Math.sign(player.angularVelocity) * Math.min(1, Math.abs(player.angularVelocity));
            
            if (player.angularVelocity !== 0) {
                player.angle += dt * player.angularVelocity;
                player.angle %= 2*Math.PI;
                this.bufferEvent({type: 'PlayerTurned', player: i, angle: player.angle});
            }
        
            player.velocity += dt * player.acceleration;
            player.velocity = Math.min(player.velocity, 30);
            
            if (player.velocity !== 0) {
                player.x += dt * Math.cos(player.angle) * player.velocity;
                player.y -= dt * Math.sin(player.angle) * player.velocity;
                this.bufferEvent({type: 'PlayerMoved', player: i, x: player.x, y: player.y, velocity: player.velocity});
            }

            const target = this.targets[this.currentTarget];
            if (distance(player, target) < 10) {
                const newTarget = this.renewTarget();
                this.bufferEvent({type: 'TargetBecameActive', index: newTarget});

                player.score++;
                this.bufferEvent({type: 'PlayerScored', player: i});
            }
        });
        // }
    }
    
    start() {
        super.start();
        this.bufferEvent({
            type: 'GameStarted',
            players: this.players.map(player => ({x: player.x, y: player.y, angle: player.angle, score: player.score})),
            targets: this.targets.map(target => ({x: target.x, y: target.y})),
        });
    }
    
    stop() {
        this.bufferEvent({type: 'GameStopped'});
    }
}

module.exports = Game;
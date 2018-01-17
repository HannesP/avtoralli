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
                angle: i === 0 ? Math.PI : 0,
                
                angularVelocity: 0,
                angularAcceleration: 0,
                
                velocity: 0,
                acceleration: 0,
                
                breaking: false,
                turning: false,
                
                score: 0,
            };
        });

        const numX = 5;
        const numY = 4;
        this.targets = [];
        for (let x = 0; x < numX; x++) {
            for (let y = 0; y < numY; y++) {
                const padding = this.width / 10;
                const devAmount = this.width / 25;
                const deviation = () => 2*(Math.random() - 0.5) * devAmount;
                          
                this.targets.push({
                    x: deviation() + padding + (this.width - 2*padding)/(numX - 1)*x,
                    y: deviation() + padding + (this.height - 2*padding)/(numY - 1)*y,
                });
            }
        }
        
        Array(20).fill().map(i => {
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
            player.angularAcceleration = -4;
            player.turning = true;
        });
    
        this.on('PlayerTurnRight', (player, params) => {
            player.angularAcceleration = 4;
            player.turning = true;
        });
    
        this.on('PlayerAccelerate', (player, params) => {
            player.acceleration = 50;
            player.breaking = false;
        });
    
        this.on('PlayerStopAccelerate', (player, params) => {
            player.acceleration = 0;
            player.breaking = true;
        });
        
        this.on('PlayerStopTurning', (player, params) => {
            player.angularAcceleration = 0;
            player.turning = false;
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
            if (player.turning === false) {
                player.angularVelocity -= dt * Math.sign(player.angularVelocity);
            }
            
            player.angularVelocity += dt * player.angularAcceleration;
            player.angularVelocity = Math.sign(player.angularVelocity) * Math.min(1, Math.abs(player.angularVelocity));
            
            if (player.angularVelocity !== 0) {
                player.angle += dt * player.angularVelocity;
                player.angle %= 2*Math.PI;
                this.bufferEvent({type: 'PlayerTurned', player: i, angle: player.angle});
            }
        
            if (player.breaking) {
                if (player.velocity > 0) {
                    player.velocity -= dt * 50;   
                }
            } else {
                player.velocity += dt * player.acceleration;
                player.velocity = Math.min(player.velocity, 100);
            }
            
            if (player.velocity !== 0) {
                player.x += dt * Math.cos(player.angle) * player.velocity;
                player.y -= dt * Math.sin(player.angle) * player.velocity;
                
                player.x = Math.min(player.x, this.width);
                player.x = Math.max(player.x, 0);
                player.y = Math.min(player.y, this.height);
                player.y = Math.max(player.y, 0);
                
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
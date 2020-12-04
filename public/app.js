class EventEmitter {
	constructor() {
		this.listeners = {};
	}

	on(message, listener) {
		if (!this.listeners[message]) {
			this.listeners[message] = [];
		}
		this.listeners[message].push(listener);
	}

	emit(message, payload = null) {
		if (this.listeners[message]) {
			this.listeners[message].forEach((l) => l(message, payload));
		}
	}

	clear() {
		this.listeners = {};
	}
}

class GameObject {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dead = false;
		this.type = '';
		this.width = 0;
		this.height = 0;
		this.img = undefined;
	}

	draw(ctx) {
		ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	}

	rectFromGameObject() {
		return {
			top: this.y,
			left: this.x,
			bottom: this.y + this.height,
			right: this.x + this.width,
		};
	}
}

class Hero extends GameObject {
	constructor(x, y, id) {
		super(x, y);
		(this.width = 99), (this.height = 75);
		this.id = id;
		this.type = 'Hero';
		this.speed = { x: 0, y: 0 };
		this.cooldown = 0;
		this.life = 3;
		this.points = 0;
	}
	fire() {
		gameObjects.push(new Laser(this.x + 45, this.y - 10));
		this.cooldown = 500;

		let id = setInterval(() => {
			if (this.cooldown > 0) {
				this.cooldown -= 100;
			} else {
				clearInterval(id);
			}
		}, 200);
	}
	canFire() {
		return this.cooldown === 0;
	}
	decrementLife() {
		this.life--;
		if (this.life === 0) {
			this.dead = true;
		}
	}
	incrementPoints() {
		this.points += 100;
	}
}

class Enemy extends GameObject {
	constructor(x, y) {
		super(x, y);
		(this.width = 98), (this.height = 50);
		this.type = 'Enemy';
		let id = setInterval(() => {
			if (this.y < canvas.height - this.height) {
				this.y += 1;
			} else {
				console.log('Stopped at', this.y);
				clearInterval(id);
			}
		}, 300);
	}
}

class Laser extends GameObject {
	constructor(x, y) {
		super(x, y);
		(this.width = 9), (this.height = 33);
		this.type = 'Laser';
		this.img = laserImg;
		let id = setInterval(() => {
			if (this.y > 0 && this.dead === false) {
				this.y -= 7;
			} else {
				this.dead = true;
				clearInterval(id);
			}
		}, 50);
	}
}

function loadTexture(path) {
	return new Promise((resolve) => {
		const img = new Image();
		img.src = path;
		img.onload = () => {
			resolve(img);
		};
	});
}

function drawLife() {
	const START_POS = canvas.width - 180;
	for(let i=0; i < heros[myId].life; i++) {
		ctx.drawImage(
			lifeImg,
			START_POS + (45 * (i+1)),
			canvas.height - 37
		);
	}
}

function drawPoints() {
	ctx.font = "30px Arial";
	ctx.fillStyle = "red";
	ctx.textAlign = "left";
	drawText("Points: " + heros[myId].points, 10, canvas.height-20);
}

function drawText(message, x, y) {
	ctx.fillText(message, x, y);
}

function intersectRect(r1, r2) {
	return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
}

function isHeroDead() {
	return heros[myId].life <= 0;
}

function isEnemiesDead() {
	const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
	return enemies.length === 0;
}

function displayMessage(message, color = 'red') {
	ctx.font = '30px Arial';
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
	clearInterval(gameLoopId);

	setTimeout(() => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (win) {
			displayMessage(
				"Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
				"green"
			);
		} else {
			displayMessage(
				"You died!!! Press [Enter] to start a new game Captain Pew Pew"
			);
		}
	}, 200);
}

function resetGame() {
	if (gameLoopId) {
		clearInterval(gameLoopId);
		eventEmitter.clear();
		initGame();
		gameLoopId = setInterval(() => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			drawPoints();
			drawLife();
			updateGameObjects();
			drawGameObjects(ctx);
		}, 50);
	}
}

export const Messages = {
	KEY_EVENT_UP: 'KEY_EVENT_UP',
	KEY_EVENT_DOWN: 'KEY_EVENT_DOWN',
	KEY_EVENT_LEFT: 'KEY_EVENT_LEFT',
	KEY_EVENT_RIGHT: 'KEY_EVENT_RIGHT',
	KEY_EVENT_SPACE: 'KEY_EVENT_SPACE',
	COLLISION_ENEMY_LASER: 'COLLISION_ENEMY_LASER',
	COLLISION_ENEMY_HERO: 'COLLISION_ENEMY_HERO',
	GAME_END_WIN: 'GAME_END_WIN',
	GAME_END_LOSS: 'GAME_END_LOSS',
	KEY_EVENT_ENTER: 'KEY_EVENT_ENTER',
	PLAYER_KEY_DOWN: 'PLAYER_KEY_DOWN',
	PLAYER_KEY_UP: 'PLAYER_KEY_UP',
	PLAYER_KEY_LEFT: 'PLAYER_KEY_LEFT',
	PLAYER_KEY_RIGHT: 'PLAYER_KEY_RIGHT',
	PLAYER_KEY_SPACE: 'PLAYER_KEY_SPACE',
	PLAYER_KEY_ENTER: 'PLAYER_KEY_ENTER',
	PLAYER_LEAVE: 'PLAYER_LEAVE'
};

let heroImg,
	enemyImg,
	laserImg,
	lifeImg,
	canvas,
	ctx,
	gameObjects = [],
	gameLoopId,
	eventEmitter = new EventEmitter();

// EVENTS
let onKeyDown = function (e) {
	// console.log(e.keyCode);
	switch (e.keyCode) {
		case 37:
		case 39:
		case 38:
		case 40: // Arrow keys
		case 32:
			e.preventDefault();
			break; // Space
		default:
			break; // do not block other keys
	}
};

window.addEventListener('keydown', onKeyDown);

// TODO make message driven
window.addEventListener('keyup', (evt) => {
	if (evt.key === 'ArrowUp') {
		eventEmitter.emit(Messages.KEY_EVENT_UP);
		socket.emit(Messages.PLAYER_KEY_UP, myId);
	} else if (evt.key === 'ArrowDown') {
		eventEmitter.emit(Messages.KEY_EVENT_DOWN);
		socket.emit(Messages.PLAYER_KEY_DOWN, myId);
	} else if (evt.key === 'ArrowLeft') {
		eventEmitter.emit(Messages.KEY_EVENT_LEFT);
		socket.emit(Messages.PLAYER_KEY_LEFT, myId);
	} else if (evt.key === 'ArrowRight') {
		eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
		socket.emit(Messages.PLAYER_KEY_RIGHT, myId);
	} else if (evt.keyCode === 32) {
		eventEmitter.emit(Messages.KEY_EVENT_SPACE);
	} else if (evt.key === "Enter") {
		eventEmitter.emit(Messages.KEY_EVENT_ENTER);
		// socket.emit(Messages.PLAYER_KEY_ENTER, myId);
	}
});

function createEnemies() {
	const MONSTER_TOTAL = 5;
	const MONSTER_WIDTH = MONSTER_TOTAL * 98;
	const START_X = (canvas.width - MONSTER_WIDTH) / 2;
	const STOP_X = START_X + MONSTER_WIDTH;

	for (let x = START_X; x < STOP_X; x += 98) {
		for (let y = 0; y < 50 * 5; y += 50) {
			const enemy = new Enemy(x, y);
			enemy.img = enemyImg;
			gameObjects.push(enemy);
		}
	}
}


var myId;
var heros = [];

function createHero(id) {
	let hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4, id);
	heros[id] = hero;
	hero.img = heroImg;
	gameObjects.push(hero);
}

function createOldHero(id, x, y) {
	let oh = new Hero(x, y, id);
	heros[id] = oh;
	oh.img = heroImg;
	gameObjects.push(oh);
}

function updateGameObjects() {
	gameObjects = gameObjects.filter((go) => !go.dead);
	const enemies = gameObjects.filter((go) => go.type === 'Enemy');
	const lasers = gameObjects.filter((go) => go.type === 'Laser');
	// laser hit something
	lasers.forEach((l) => {
		enemies.forEach((m) => {
			if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
				eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
					first: l,
					second: m,
				});
			}
		});
	});
	enemies.forEach(enemy => {
		heros.forEach(h => {
			const heroRect = h.rectFromGameObject();
			if (!enemy.dead && intersectRect(heroRect, enemy.rectFromGameObject())) {
				eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, {enemy, h});
			}
		})
	})

	gameObjects = gameObjects.filter((go) => !go.dead);
}

function drawGameObjects(ctx) {
	gameObjects.forEach((go) => go.draw(ctx));
}

function initGame() {
	connServer();
	gameObjects = [];
	createEnemies();
	
	socket.on('ID_ASSIGN', id => {
		createHero(id);
		myId = id;
		console.log("myId = " + id);
	});

	socket.on('PLAYER_COME_IN', id => {
		createHero(id);
		console.log("send :" + ' x:' + heros[myId].x + " y:" + heros[myId].y);
		socket.emit('NOTIFY_LOC', {fromId: myId, toId: id, x: heros[myId].x, y: heros[myId].y})
	});

	socket.on('OLD_PLAYER_NOTIFY', (msg) => {
		createOldHero(msg.fromId, msg.x, msg.y);
		console.log('id = ' + msg.fromId + " x: " + msg.x + ' y: ' + msg.y);
	});

	socket.on(Messages.PLAYER_LEAVE, (id) => {
		heros[id].dead = true;
		delete heros[id];
	});

	socket.on(Messages.PLAYER_KEY_UP, id => {
		heros[id].y -= 5;
	});
	eventEmitter.on(Messages.KEY_EVENT_UP, () => {
		heros[myId].y -= 5;
	});

	eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
		heros[myId].y += 5;
	});
	socket.on(Messages.PLAYER_KEY_DOWN, (id) => {
		heros[id].y += 5;
	});

	eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
		heros[myId].x -= 5;
	});
	socket.on(Messages.PLAYER_KEY_LEFT, id => {
		console.log(id);
		heros[id].x -= 5;
	});

	eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
		heros[myId].x += 5;
	});
	socket.on(Messages.PLAYER_KEY_RIGHT, id => {
		heros[id].x += 5;
	});

	eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
		if (heros[myId].canFire()) {
			heros[myId].fire();
			socket.emit(Messages.PLAYER_KEY_SPACE, myId);
		}
		// console.log('cant fire - cooling down')
	});

	socket.on(Messages.PLAYER_KEY_SPACE, id => {
		heros[id].fire();
	});

	eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
		first.dead = true;
		second.dead = true;
		heros[myId].incrementPoints();

		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});

	eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy, h }) => {
		enemy.dead = true;
		h.decrementLife();
		if (isHeroDead()) {
			eventEmitter.emit(Messages.GAME_END_LOSS);
			return; //loss before victory
		}
		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});

	eventEmitter.on(Messages.GAME_END_WIN, () => {
		endGame(true);
		socket.close();
	}); 

	eventEmitter.on(Messages.GAME_END_LOSS, () => {
		endGame(false);
		socket.close();
	});

	eventEmitter.emit(Messages.KEY_EVENT_ENTER, () => {
		resetGame();
	});
}

window.onload = async () => {
	canvas = document.getElementById('canvas');
	// @ts-ignore
	ctx = canvas.getContext('2d');
	heroImg = await loadTexture('assets/player.png');
	enemyImg = await loadTexture('assets/enemyShip.png');
	laserImg = await loadTexture('assets/laserRed.png');
	lifeImg = await loadTexture('assets/life.png')

	initGame();
	gameLoopId = setInterval(() => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		updateGameObjects();
		drawPoints();
		drawLife();
		drawGameObjects(ctx);
	}, 50);
};

var socket;

function connServer() {
	socket = io();
}



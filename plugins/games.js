/**
 * Games
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the game system and related commands for Cassius.
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');

class Player {
	constructor(user) {
		this.name = user.name;
		this.id = user.id;
		this.eliminated = false;
	}

	say(message) {
		Users.add(this.name).say(message);
	}
}

class Game {
	constructor(room) {
		this.room = room;
		this.players = {};
		this.playerCount = 0;
		this.round = 0;
		this.started = false;
		this.ended = false;
		this.freeJoin = false;
	}

	say(message) {
		this.room.say(message);
	}

	signups() {
		this.say("Hosting a game of " + this.name + "! " + (this.freeJoin ? " (free join)" : "If you would like to play, use the command ``" + Config.commandCharacter + "join``."));
		if (this.description) this.say("Description: " + this.description);
		if (typeof this.onSignups === 'function') this.onSignups();
		if (this.freeJoin) this.started = true;
	}

	start() {
		if (this.started) return;
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	end() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (typeof this.onEnd === 'function') this.onEnd();
		this.ended = true;
		this.room.game = null;
	}

	forceEnd() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		this.say("The game was forcibly ended.");
		this.ended = true;
		this.room.game = null;
	}

	nextRound() {
		if (this.timeout) clearTimeout(this.timeout);
		this.round++;
		if (typeof this.onNextRound === 'function') this.onNextRound();
	}

	addPlayer(user) {
		if (user.id in this.players) return;
		let player = new Player(user);
		this.players[user.id] = player;
		this.playerCount++;
		return player;
	}

	removePlayer(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		if (this.started) {
			this.players[user.id].eliminated = true;
		} else {
			delete this.players[user.id];
			this.playerCount--;
		}
	}

	renamePlayer(user, oldName) {
		let oldId = Tools.toId(oldName);
		if (!(oldId in this.players)) return;
		let player = this.players[oldId];
		player.name = user.name;
		if (player.id === user.id || user.id in this.players) return;
		player.id = user.id;
		this.players[user.id] = player;
		delete this.players[oldId];
		if (this.onRename) this.onRename(user);
	}

	join(user) {
		if (user.id in this.players || this.started) return;
		if (this.freeJoin) {
			user.say("This game does not require you to join!");
			return;
		}
		this.addPlayer(user);
		user.say('You have joined the game of ' + this.name + '!');
		if (typeof this.onJoin === 'function') this.onJoin(user);
	}

	leave(user) {
		if (!(user.id in this.players)) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}

	pl() {
		let players = [];
		for (let userID in this.players) {
			players.push(this.players[userID].name);
		}
		this.room.say("**Players (" + this.playerCount + ")**: " + players.join(", "));
	}
}

class Plugin {
	constructor() {
		this.name = 'Games';
		this.games = {};
	}

	onLoad() {
		this.loadGames();
	}

	loadGames() {
		let games;
		try {
			games = fs.readdirSync('./games');
		} catch (e) {}
		if (!games) return;
		for (let i = 0, len = games.length; i < len; i++) {
			let file = games[i];
			if (!file.endsWith('.js')) continue;
			file = require('./../games/' + file);
			if (file.game && file.name && file.id) this.games[file.id] = file;
		}
	}

	createGame(game, room) {
		if (room.game) return room.say("A game of " + room.game.name + " is already in progress.");
		let id = Tools.toId(game);
		if (!(id in this.games)) return room.say("The game '" + game.trim() + "' was not found.");
		room.game = new this.games[id].game(room); // eslint-disable-line new-cap
		room.game.signups();
	}
}

let Games = new Plugin();

let commands = {
	gamesignups: 'signups',
	signups: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		Games.createGame(target, room);
	},
	startgame: 'start',
	start: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.start === 'function') room.game.start();
	},
	endgame: 'end',
	end: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		room.game.forceEnd();
	},

	players: 'pl',
	pl: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.pl === 'function') room.game.pl();
	},

	guess: 'g',
	g: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.guess === 'function') room.game.guess(target, user);
	},

	pair: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.pair === 'function') room.game.pair(target, user);
	},

	joingame: 'join',
	join: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.join === 'function') room.game.join(user);
	},
	leavegame: 'leave',
	leave: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.leave === 'function') room.game.leave(user);
	},

	choose: function (target, room, user) {
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.choose === 'function') realRoom.game.choose(user, target);
		}
	},

	suspect: function (target, room, user) {
		if (room.name !== user.name) return;
		let firstComma = target.indexOf(',');
		if (firstComma === -1) {
			user.say("The correct syntax is " + Config.commandCharacter + "suspect user, pokemon, room");
			return;
		}
		let userID = target.substr(0, firstComma);
		target = target.substr(firstComma + 1);
		if (target.charAt(0) === ' ') {
			target = target.substr(1);
		}
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.suspect === 'function') realRoom.game.suspect(user, userID, target);
		}
	},

	steal: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.steal === 'function') room.game.steal(target, user);
	},

	count: function (target, room, user) {
		if (!room.game) {
			if (!user.hasRank(room, '+') || Tools.toId(target) !== "start") {
				return;
			}
			Games.createGame("count", room);
		} else if (typeof room.game.count === 'function') {
			room.game.count(target, user);
		}
	},
	sit: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.sit === 'function') room.game.sit(target, user);
	},
};

Games.Game = Game;
Games.Player = Player;
Games.commands = commands;

module.exports = Games;

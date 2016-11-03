'use strict';

const name = "Count";
const id = Tools.toId(name);
class Count extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.points = new Map();
		this.id = Tools.toId(name);
		this.curCount = 0;
		this.started = true;
		this.freeJoin = true;
	}

	count(target, user) {
		this.addPlayer(user);
		let x = Math.floor(target);
		let player = this.players[user.id];
		if (x === (this.curCount + 1)) {
			let points = this.points.get(player) || 0;
			points++;
			this.points.set(player, points);
			this.curCount++;
		} else {
			this.room.say(user.name + " counted incorrectly!");
			for (let userID in this.players) {
				let player = this.players[userID];
				let points = this.points.get(player);
				if (userID === user.id) {
					player.say("You counted incorrectly, and so lost " + 25 * (this.curCount - points) + " candies!");
				} else {
					player.say("You earned " + 25 * points + " candies!");
				}
			}
			this.end();
		}
	}
}

exports.name = name;
exports.id = id;
exports.description = "Count!";
exports.game = Count;
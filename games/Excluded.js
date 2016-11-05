'use strict';

const name = 'Excluded';
const description = 'Excluded!';
const id = Tools.toId(name);
const data = {
	"Pokemon": {},
	"Types": [],
	"Colors": [],
};

const generations = [151, 251, 386, 493, 649, 721];

function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

function generation(dexNum) {
	let i, len = generations.length;
	for (i = 0; i < len; i++) {
		if (generations[i] >= dexNum) {
			break;
		}
	}
	return i + 1;
}

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (mon.num < 1) continue;
	let species = mon.species;
	data["Pokemon"][species] = {};
	data["Pokemon"][species]["type"] = mon.types;
	for (let i = 0, len = mon.types.length; i < len; i++) {
		if (data["Types"].indexOf(mon.types[i]) === -1) {
			data["Types"].push(mon.types[i]);
		}
	}
	data["Pokemon"][species]["color"] = [mon.color];
	//data[species]["Base Stats"] = mon.base
	/*data[species]["ability"] = Object.keys(mon.abilities).map(function (key) {
		return mon.abilities[key];
	});*/
	data["Pokemon"][species]["generation"] = [generation(mon.num)];
	data["Pokemon"][species]["tier"] = [Tools.data.battle[i].tier];
}

class Excluded extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.description = description;
		this.name = name;
		this.param = null;
		this.category = null;
	}

	onStart() {
		this.say("Now choosing a parameter...");
		let valid = false;
		while (!valid) {
			let keys = Object.keys(data["Pokemon"]);
			let mon = keys[Math.floor(Math.random() * keys.length)];
			console.log(mon);
			this.category = Object.keys(data["Pokemon"][mon])[Math.floor(Math.random() * Object.keys(data["Pokemon"][mon]).length)];
			console.log(this.category);
			this.param = data["Pokemon"][mon][this.category][Math.floor(Math.random() * data["Pokemon"][mon][this.category].length)];
			valid = true;
		}
		console.log(this.param);
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}

	onNextRound() {
		this.order = shuffle(Object.keys(this.players));
		this.say("**Round " + this.round + "**!");
		this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
	}

	nextPlayer() {
		if (this.order.length === 0) {
			console.log("ok...");
			this.nextRound();
		} else {
			let curID = this.order[0];
			this.curPlayer = this.players[curID];
			this.order.splice(0, 1);
			this.say("It is now " + this.curPlayer.name + "'s turn to choose a pokemon!");
			this.room.timeout = setTimeout(() => this.nextPlayer(), 15 * 1000);
		}
	}

	exclude(target, user) {
		let player = this.players[user.id];
		if (!player || player.id !== this.curPlayer.id) return;
		target = Tools.toId(target);
		let realmon = Tools.data.pokedex[target];
		if (!realmon) return;
		console.log(realmon);
		let species = realmon.species;
		console.log(species);
		if (data["Pokemon"][species][this.category].indexOf(this.param) === -1) {
			this.say(species + " was **NOT** Excluded!");
		} else {
			this.say(species + "was Excluded! " + player.name + " has been eliminated");
			delete this.players[user.id];
		}
		clearTimeout(this.timeout);
		this.timeout = null;
		this.nextPlayer();
	}

	guessExclusion(target, user) {
		let player = this.players[user.id];
		if (!player || player.id !== this.curPlayer.id) return;
		if (Tools.toId(target) === Tools.toId(this.param)) {
			this.say(player.name + " has guesses the correct parameter (" + this.param + ") and won the game!");
			clearTimeout(this.timeout);
			this.timeout = null;
			this.end();
			return;
		} else {
			this.say(user.name + " has guessed an incorrect param and has been eliminated!");
			delete this.players[user.id];
			clearTimeout(this.timeout);
			this.timeout = null;
			this.nextPlayer();
		}
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = Excluded;

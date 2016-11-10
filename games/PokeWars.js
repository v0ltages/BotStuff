'use strict';

const name = "PokeWars";
const id = Tools.toId(name);
const description = "Team Connect 3! Teams try to line up the 3 pokemon in their evolution line, but your team's pokemon will turn into their prevos after your turn!";
const data = [];

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (mon.prevo && Tools.data.pokedex[mon.prevo].prevo) {
		data.push(mon.species);
		//console.log(mon.species);
	}
}

class PokeWars extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.description = description;
		this.name = name;
		this.map = [["o", "o", "o", "o", "o", "o"],
					["o", "o", "o", "o", "o", "o"],
					["o", "o", "o", "o", "o", "o"],
					["o", "o", "o", "o", "o", "o"],
					["o", "o", "o", "o", "o", "o"],
					["o", "o", "o", "o", "o", "o"]];
		this.teams = [];
		this.curPlayer = null;
		this.order = null;
		this.curTeam = null;
		this.allowTeams = false;
		this.curGuess = null;
	}

	onStart() {
		if ((this.playerCount % 3) !== 0) {// || this.playerCount < 9 || this.playerCount > 18) {
			this.say("The number of players must be a multiple of 3 between 9 and 18!");
			this.end();
			return;
		}
		let keys = Tools.shuffle(Object.keys(this.players));
		let shuffled = Tools.shuffle(data);
		let strs = [];
		for (let i = 0, len = keys.length; i < len; i += 3) {
			this.teams.push([this.players[keys[i]], this.players[keys[i + 1]], this.players[keys[i + 2]], shuffled[i / 3]]);
			strs.push("**Team " + shuffled[i / 3] + "**: " + this.players[keys[i]].name + ", " + this.players[keys[i + 1]].name + ", " + this.players[keys[i + 2]].name);
		}
		this.order = [];
		for (let i = 0, len = this.teams.length; i < len; i++) {
			this.order.push(this.teams[i]);
		}
		this.order = Tools.shuffle(this.order);
		this.say(strs.join(" "));
		this.nextRound();
	}

	displayBoard() {
		let str = "<table width = \"100%\"> <tbody> <tr> <td>";
		let strs = [];
		for (let i = 0; i < 6; i++) {
			strs.push(this.map[i].join("</td> <td>"));
			//str += (this.map[i].join("</td> <td>") + "</td></tr><tr><td>");
		}
		str += strs.join("</td></tr><tr><td>");
		str += "</td> </tr> </tbody> </table>";
		console.log(str);
		this.say("!htmlbox " + str);
	}
	onNextRound() {
		//this.displayBoard();
		/*for (let i = 0; i < 6; i++) {
			this.say("**" + this.map[i].join(", ") + "**");
		}*/
		this.curTeam = null;
		this.curGuess = null;
		this.cur = 0;
		this.timeout = setTimeout(() => this.nextTeam(), 5 * 1000);
	}

	updateMap() {
		this.curGuess--;
		let updateMons = [];
		updateMons.push(Tools.toId(this.curTeam[3]));
		let prevo = Tools.data.pokedex[Tools.toId(this.curTeam[3])].prevo;
		updateMons.push(prevo);
		let firstEvo = Tools.data.pokedex[prevo].prevo;
		updateMons.push(firstEvo);
		let updateCol = -1;
		for (let i = 0; i < 6; i++) {
			for (let j = 0; j < 6; j++) {
				if (Tools.toId(this.map[i][j]) === firstEvo) {
					updateCol = j;
				}
				if (updateMons.indexOf(Tools.toId(this.map[i][j])) !== -1) {
					let curPrevo = Tools.data.pokedex[Tools.toId(this.map[i][j])].prevo;
					if (!curPrevo) {
						this.map[i][j] = 'o';
					} else {
						this.map[i][j] = Tools.data.pokedex[curPrevo].species;
					}
				}
			}
		}
		if (updateCol !== -1) {
			for (let i = 5; i >= 0; i--) {
				if (this.map[i][updateCol] === 'o') {
					for (let k = i; k > 0; k--) {
						this.map[k][updateCol] = this.map[k - 1][updateCol];
					}
					this.map[0][updateCol] = 'o';
					break;
				}
			}
		}
		let row;
		for (row = 5; row >= 0; row--) {
			if (this.map[row][this.curGuess] === 'o') {
				this.map[row][this.curGuess] = this.curTeam[3];
				break;
			}
		}
		this.isWin();
	}

	isWin() {
		console.log(this.round);
		if (this.round < 3) return;
		let winningTeams = [];
		for (let i = 0, len = this.teams.length; i < len; i++) {
			let curTeam = this.teams[i];
			let updateMons = [];
			updateMons.push(Tools.toId(curTeam[3]));
			let prevo = Tools.data.pokedex[Tools.toId(curTeam[3])].prevo;
			updateMons.push(prevo);
			let firstEvo = Tools.data.pokedex[prevo].prevo;
			updateMons.push(firstEvo);
			let curSpots = [];
			for (let i = 0; i < 6; i++) {
				for (let j = 0; j < 6; j++) {
					if (updateMons.indexOf(Tools.toId(this.map[i][j])) !== -1) {
						curSpots.push([i, j]);
					}
				}
			}
			if (curSpots.length < 3) {
				continue;
			}
			if (this.isGood(curSpots)) {
				winningTeams.push(curTeam[3]);
			}
		}
		if (winningTeams.length !== 0) {
			this.displayBoard();
			this.say("The winning team" + (winningTeams.length === 1 ? " is **" : "s are **") + winningTeams.join("**, **") + "**! Thanks for playing!");
			clearTimeout(this.timeout);
			this.end();
			return;
		}
	}

	isGood(curSpots) {
		console.log("ayy lmao");
		for (let i = 0; i < 3; i++) {
			let curSpot = curSpots[i];
			let otherSpot1 = curSpots[(i + 1) % 3];
			let otherSpot2 = curSpots[(i + 2) % 3];
			if ((otherSpot1[0] + otherSpot2[0]) / 2 === curSpot[0] && (otherSpot1[1] + otherSpot2[1]) / 2 === curSpot[1]) {
				if (Math.abs(otherSpot1[0] - curSpot[0]) <= 1 && Math.abs(otherSpot1[1] - curSpot[1]) <= 1) {
					return true;
				}
			}
		}
		return false;
	}

	allowTeammates() {
		this.allowTeams = true;
		this.say("Teammates of the " + this.curTeam[3] + " team can now help " + this.curPlayer.name + " pick!");
		this.timeout = setTimeout(() => this.nextTeam(), 10 * 1000);
	}

	nextTeam() {
		if (this.curTeam) {
			if (!this.curGuess) {
				this.curGuess = Math.floor(Math.random() * 5) + 1;
				this.say("Team " + this.curTeam[3] + " has been randomly assigned column " + this.curGuess);
			}
			this.updateMap();
		}
		this.displayBoard();
		if (this.cur === this.teams.length) {
			this.nextRound();
		} else {
			this.curTeam = this.order[this.cur % 3];
			this.curPlayer = this.curTeam[this.round % 3];
			this.curGuess = null;
			this.allowTeams = false;
			this.say("It is now " + this.curPlayer.name + "'s turn to choose a column!");
			this.cur++;
			this.timeout = setTimeout(() => this.allowTeammates(), 20 * 1000);
		}
	}

	pick(target, user) {
		let x = Math.floor(target);
		let player = this.players[user.id];
		if (!player || !x || x < 1 || x > 6) return;
		let valid = false;
		if (this.allowTeams) {
			for (let i = 0; i < 3; i++) {
				if (this.curTeam[i].id === player.id) {
					valid = true;
					break;
				}
			}
		} else {
			valid = (player.id === this.curPlayer.id);
		}
		if (!valid) return;
		this.curGuess = x;
		clearTimeout(this.timeout);
		this.nextTeam();
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = PokeWars;
exports.aliases = [];
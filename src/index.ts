import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { transpile } from "typescript";
import cors from "cors";
import ms from "ms";
import { PNP_DOMAIN } from "./constants";

const app = express();
// should match https://github.com/ProdigyPNP/ProdigyMathGameHacking/blob/master/PHEx/src/manifest.json
const SupportPHEXVersion = "2.1.9";
let lastVersion = "None";
interface GameStatus {
	status: string;
	data?: { gameClientVersion?: string; prodigyGameFlags: { gameDataVersion: number } };
}
const startDate = Date.now();

// @ts-expect-error
setInterval(async () => {
	try {
		const status: GameStatus = await (await fetch("https://api.prodigygame.com/game-api/status")).json();
		console.log(status);

        // s-expect-error

	    const version = await (await fetch(PNP_DOMAIN + "/gameVersion")).text();
		if (lastVersion === "None") return (lastVersion = version!);


		// write modified gamefile to disk, in case there's a crash
	} catch (e) {}
}, 10 * 60 * 1000);

app.use(cors());
// @ts-expect-error
app.get("/game.min.js", async (req, res) => {

	const version = await (await fetch(PNP_DOMAIN + "/gameVersion")).text();
	const status = await (await fetch('https://api.prodigygame.com/game-api/status')).json();
	if (status.status !== "success" || !version) return res.sendStatus(503);
	const gameMinJS = await (
		await fetch(`https://code.prodigygame.com/code/${version}/game.min.js?v=${version}`)
	).text();
	res.type(".js");
	const replacements = [
		["s),this._game=i}", `s),this._game=i};jQuery.temp22=_;let nahhh=setInterval(()=>{if (jQuery.temp22 !== _) {_ = jQuery.temp22; delete jQuery.temp22;clearInterval(nahhh)}});Object.defineProperty(_, "instance", { get: () => t.instance });`],
		["t.constants=Object", "_.constants=t,t.constants=Object"],
		["window,function(t){var i={};", "window,function(t){var i={};_.modules=i;"],
		["this._player=t", "this._player=_.player=t"],
		["i.prototype.hasMembership=", "i.prototype.hasMembership=_=>true,i.prototype.originalHasMembership="] // membership override
		// ["this._localizer=null,this.et=[]", "_.chat=this;this._localizer=null,this.et=[]"],
		// ["return t.BAM=", ";_.variables.loc=Ar;_.variables.menuTxt=Kr;_.variables.menuObj=t;return t.BAM="],
	];
	return res.send(
		replacements.reduce(
			(code, replacement) => code.split(replacement[0]).join(replacement[1]),
			`nootmeat = func => {
				let elephant = 2
			}
			exports = {};
			_.variables=Object.create(null);

			console.trace = _ => {};
	
			${gameMinJS}

			${transpile(fs.readFileSync(path.join(__dirname, "./revival.js"), { encoding: "utf8" }))}

			console.log("%cWill's Redirect Hack", "font-size:40px;color:#540052;font-weight:900;font-family:sans-serif;");
			console.log("%cVersion ${SupportPHEXVersion}", "font-size:20px;color:#000025;font-weight:700;font-family:sans-serif;");
			console.log('The variable "_" contains the hacked variables.');
			SW.Load.onGameLoad();
			setTimeout(() => {
				${await (await fetch("https://raw.githubusercontent.com/Prodigy-Hacking/ProdigyMathGameHacking/master/willsCheatMenu/loader.js")).text()}
			}, 15000);
		`)
	);
});

// @ts-expect-error
app.get("/", (req, res) => res.redirect("/game.min.js"));

app.get("/public-game.min.js", async (req, res) => {
	if (!req.query.hash) return res.type("js").send("alert('OUTDATED REDIRECTOR CONFIG');")
	const publicGame = await (await fetch(`https://code.prodigygame.com/js/public-game-${req.query.hash}.min.js`)).text();
	res.type(".js");
	return res.send(`
		${publicGame.replace(/console\..+?\(.*?\)/g, "(()=>{})()")}

		// overwrite Array.some to patch Prodigy's anti-cheat.
		// The Anti-Anti-Cheat
		l=Array.prototype.some;
		setInterval(()=>{Array.prototype.some = function some(...args) {
			if (this[0] === "hack") this.splice(0, 100);
			return l.call(this, ...args);
		}});
		
		// Prodigy's new hack var anti-cheat overwrote setInterval, to patch this, we get a fresh new setInterval from an iFrame,
		// then patch their patch.
		let fffffff = document.createElement("iframe");
		document.head.append(fffffff);
		fffffff.contentWindow.setInterval(() => {
			let l = fffffff.contentWindow.setInterval;
			window.setInterval = function(func, ...args) {
				if (func.toString().includes('["hack"]')) return;
				return l.call(window, func, ...args);
			}
		});
	`);
});


// @ts-expect-error
app.get("/download", async (req, res) => {
	return res.redirect("https://github.com/ProdigyPNP/ProdigyMathGameHacking/raw/master/PHEx/build/extension.zip");
});


// @ts-expect-error
app.get("/version", async (req, res) => {
	return res.send(SupportPHEXVersion);
});


// @ts-expect-error
app.get("/status", async (req, res) => {
	return res.send(`Redirector has been online for [${ms(Date.now() - startDate)}]`)
});


const port = process.env.PORT ?? 1337;
app.listen(port, () => {
    return console.log(`The old machine hums along on port :${port}`)
    }
);
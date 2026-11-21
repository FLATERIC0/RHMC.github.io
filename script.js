function showTime() {
	document.getElementById('currentTime').textContent = new Date().toUTCString();
}

showTime();
setInterval(showTime, 1000);

const serverState = document.getElementById("serverState");
const status = document.getElementById("status");
const serverDetails = document.getElementById("serverDetails");
const lastUpdated = document.getElementById("lastUpdated");
const players = document.getElementById("players");
const activityFeed = document.getElementById("activityFeed");
const refreshButton = document.getElementById("refreshServer");
let previousPlayers = null;
let isLoading = false;

function showActivity(message) {
	const item = document.createElement("li");
	item.textContent = message;
	activityFeed.prepend(item);

	while (activityFeed.children.length > 8) {
		activityFeed.lastElementChild.remove();
	}
}

function renderPlayers(playerList, online) {
	players.replaceChildren();

	if (!online) {
		players.textContent = "Players are unavailable while the server is offline.";
		return;
	}

	if (!playerList.length) {
		players.textContent = "No players are online right now.";
		return;
	}

	playerList.forEach((playerName) => {
		const player = document.createElement("span");
		player.className = "mc-player";
		player.textContent = playerName;
		players.append(player);
	});
}

function trackPlayerChanges(playerList) {
	const currentPlayers = new Map(
		playerList.map((playerName) => [playerName.toLowerCase(), playerName])
	);

	if (previousPlayers === null) {
		previousPlayers = currentPlayers;
		activityFeed.replaceChildren();
		showActivity("Watching for player changes.");
		return;
	}

	currentPlayers.forEach((name, key) => {
		if (!previousPlayers.has(key)) {
			showActivity(`${name} joined the server`);
		}
	});

	previousPlayers.forEach((name, key) => {
		if (!currentPlayers.has(key)) {
			showActivity(`${name} left the server`);
		}
	});

	previousPlayers = currentPlayers;
}

async function loadPlayers() {
	if (isLoading) return;
	isLoading = true;
	refreshButton.disabled = true;
	refreshButton.textContent = "Refreshing...";
	serverState.textContent = "Checking server...";
	serverState.dataset.state = "loading";

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);
		let response;

		try {
			response = await fetch(
				"https://api.mcstatus.io/v2/status/java/pootissmp2.folium.lol",
				{ signal: controller.signal }
			);
		} finally {
			clearTimeout(timeout);
		}

		if (!response.ok) {
			throw new Error(`Status service returned HTTP ${response.status}`);
		}

		const data = await response.json();
		if (typeof data.online !== "boolean" || !data.players) {
			throw new Error("Status service returned an unexpected response");
		}

		const onlinePlayers = Array.isArray(data.players.list)
			? data.players.list
					.map((player) => player.name_clean || player.name)
					.filter((name) => typeof name === "string" && name.length > 0)
			: [];

		serverState.textContent = data.online ? "Online" : "Offline";
		serverState.dataset.state = data.online ? "online" : "offline";
		status.textContent = data.online
			? `${data.players.online} / ${data.players.max} players online`
			: "The server is currently offline";
		serverDetails.textContent = [
			data.version?.name_clean && `Java Edition · ${data.version.name_clean}`,
			data.motd?.clean
		]
			.filter(Boolean)
			.join(" · ") || "Java Edition server";
		lastUpdated.textContent = `Last checked ${new Date().toLocaleTimeString()}`;

		renderPlayers(onlinePlayers, data.online);
		trackPlayerChanges(data.online ? onlinePlayers : []);
	} catch (error) {
		console.error("Unable to load Minecraft server status:", error);
		serverState.textContent = "Status unavailable";
		serverState.dataset.state = "error";
		status.textContent = "Couldn't refresh the server status.";
		serverDetails.textContent = "Check your connection and try again.";
		players.textContent = "Player list unavailable.";
	} finally {
		isLoading = false;
		refreshButton.disabled = false;
		refreshButton.textContent = "Refresh";
	}
}

refreshButton.addEventListener("click", loadPlayers);
loadPlayers();
setInterval(loadPlayers, 30000);

function showTime() {
	document.getElementById('currentTime').innerHTML = new Date().toUTCString();
}
showTime();
setInterval(function () {
	showTime();
}, 1000);

async function loadPlayers() {
    const res = await fetch(
        "https://api.mcstatus.io/v2/status/java/pootissmp2.folium.lol"
    );

    const data = await res.json();

    document.getElementById("status").textContent =
        `Players Online: ${data.players.online}/${data.players.max}`;

    const players = document.getElementById("players");

    if (!data.players.list) {
        players.innerHTML = "No player names available.";
        return;
    }

    players.innerHTML = data.players.list
        .map(player => `<div>${player.name_clean}</div>`)
        .join("");
}

loadPlayers();
setInterval(loadPlayers, 30000);
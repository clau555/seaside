const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const skyLayer = new SkyLayer();
const sun = new Sprite("img/sun.png", canvas.width / 2, canvas.height / 2, true);
const frontLayer = new FrontLayer();

const overlay = new Image();
overlay.src = "img/overlay.png";

const audio = new Audio("audio/sea-waves.wav");
audio.loop = true;
audio.volume = 0.2;

function setPosition(pos) {
    const crd = pos.coords;
    LAT = crd.latitude;
    LONG = crd.longitude;
    console.log("success!", LAT, LONG);
    updateCanvas();
}

function setDefaultPosition() {
    LAT = 45.74846;
    LONG = 4.84671;
    updateCanvas();
}

function updateCanvas() {
    let sunAltitude = getSunAltitudeDegree();
    let dawnAlpha = clamp(2.0 - Math.abs(sunAltitude), 0.0, 1.0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // sky
    skyLayer.display(ctx, canvas, sunAltitude, dawnAlpha);

    // sun
    sun.update(sun.x, SEALEVEL - sunAltitude * 8);
    sun.display(ctx);

    // front sprites
    frontLayer.display(ctx, canvas, sunAltitude, dawnAlpha);

    // global color overlay
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

    requestAnimationFrame(updateCanvas);
}

// starting audio
audio.load();
audio.play();

// starting main loop by getting position
navigator.geolocation.getCurrentPosition(setPosition, setDefaultPosition);

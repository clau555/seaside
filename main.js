const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// layers
const skyLayer = new SkyLayer();
const sun = new Sprite("img/sun.png", canvas.width / 2, canvas.height / 2, true);
const frontLayer = new FrontLayer();
const ui = new UiLayer(canvas);

// overlay layer
const overlay = new Image();
overlay.src = "img/overlay.png";

// audio
Config.audio.loop = true;
Config.audio.volume = Constants.VOLUME;

function updateCanvas() {
    let sunAltitude = Utils.getSunAltitudeDegree();

    // sets how much the dawn (color filter and sky change) is visible.
    // 0.0 means hidden, 1.0 means fully visible.
    let dawnAlpha = Utils.clamp(2.0 - Math.abs(sunAltitude), 0.0, 1.0);

    // canvas content reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // sky
    skyLayer.display(ctx, canvas, sunAltitude, dawnAlpha);

    // sun
    sun.update(sun.x, Constants.SEALEVEL - sunAltitude * 8);
    sun.display(ctx);

    // front sprites
    frontLayer.display(ctx, canvas, sunAltitude, dawnAlpha);

    // global color overlay
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

    // ui
    ui.display(ctx);

    requestAnimationFrame(updateCanvas);
}

function setPosition(pos) {
    const crd = pos.coords;
    Utils.LAT = crd.latitude;
    Utils.LONG = crd.longitude;
    updateCanvas();
}

// starting audio
Config.audio.load();
Config.audio.play().then(() => {});

// starting main loop by getting position
navigator.geolocation.getCurrentPosition(setPosition, updateCanvas);

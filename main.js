// starting audio
Config.audio.loop = true;
Config.audio.volume = Constants.VOLUME;
Config.audio.load();
Config.audio.play().then(() => {});

// window resize update
function resizeUpdate() {
    let canvasWidth = canvas.clientWidth;
    let screenWidth = window.innerWidth;

    // keep the canvas centered if the screen isn't large enough
    if (canvasWidth > screenWidth) {
        let horizontalOffset = (canvasWidth - screenWidth) / 2;
        canvas.style.left = "-" + horizontalOffset.toString() + "px";
    } else {
        canvas.style.left = "0";
    }
}
window.addEventListener("resize", () => {
    resizeUpdate();
});

// volume button
let volumeButton = document.getElementById("volume");
volumeButton.addEventListener("click", () => {
   if (Config.toggleVolume()) {
       volumeButton.innerHTML = "<i class=\"fas fa-volume-up\">";
   } else {
       volumeButton.innerHTML = "<i class=\"fas fa-volume-mute\"></i>";
   }
});

// position button
let positionButton = document.getElementById("position");
positionButton.addEventListener("click", () => {
    if (!Config.positionSet) {
        positionButton.innerHTML = "<i class=\"fas fa-spinner fa-pulse\"></i>";
        Config.setPosition(
            () => {
                positionButton.innerHTML = "<i class=\"fas fa-map-marker-alt\"></i>";
                positionButton.style.color = "#ff6666";
            }, () => {
                positionButton.innerHTML = "<i class=\"fas fa-map-marker\"></i>";
            });
    }
});

// starting main screen loop
let canvas = document.getElementById("canvas");
const screen = new Screen(canvas);
resizeUpdate();
screen.updateCanvas();

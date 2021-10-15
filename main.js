// getting elements
const canvas = document.getElementById("canvas");
const volumeButton = document.getElementById("volume");
const positionButton = document.getElementById("position");
const buttonsDiv = document.getElementById("buttons");
const buttons = [volumeButton, positionButton];

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

// volume button event
volumeButton.addEventListener("click", () => {
   if (Config.toggleVolume()) {
       volumeButton.innerHTML = "<i class=\"fas fa-volume-up\">";
   } else {
       volumeButton.innerHTML = "<i class=\"fas fa-volume-mute\"></i>";
   }
});

// position button event
positionButton.addEventListener("click", () => {
    if (!Config.positionSet) {
        positionButton.innerHTML = "<i class=\"fas fa-spinner fa-pulse\"></i>";
        Config.setPosition(
            () => {
                positionButton.innerHTML = "<i class=\"fas fa-map-marker-alt\"></i>";
                positionButton.style.color = "#ff6666";
            }, () => {
                positionButton.innerHTML = "<i class=\"fas fa-map-marker\"></i>";
            }
        );
    }
});

// buttons visibility toggle on click
document.body.addEventListener("click", (e) => {
    let target = e.target;
    while (target && target !== document.body &&
    target.getAttribute("class") !== "button" && target.getAttribute("data-prefix") !== "fas") {
        target = target.parentNode;
    }
    if (!buttons.includes(target) && target.getAttribute("data-prefix") !== 'fas') {
        if (buttonsDiv.offsetTop < 0) {
            buttonsDiv.style.top = "0px";
        } else if (buttonsDiv.offsetTop >= 0) {
            buttonsDiv.style.top = "-100px";
        }
    }
})

// starting main screen loop
const screen = new Screen(canvas);
resizeUpdate();
screen.updateCanvas();

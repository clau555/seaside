// starting audio
Config.audio.loop = true;
Config.audio.volume = Constants.VOLUME;
Config.audio.load();
Config.audio.play().then(() => {});

// setting screen at the center of the page (useful for mobile portrait view)
let pageWidth = Math.max(
    document.body.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.clientWidth,
    document.documentElement.scrollWidth,
    document.documentElement.offsetWidth
);
document.documentElement.scrollLeft = pageWidth / 2 - document.documentElement.clientWidth / 2;

// starting main screen loop
const screen = new Screen();
screen.updateCanvas();

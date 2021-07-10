// starting audio
Config.audio.loop = true;
Config.audio.volume = Constants.VOLUME;
Config.audio.load();
Config.audio.play().then(() => {});

// starting main loop
const screen = new Screen();
screen.updateCanvas();

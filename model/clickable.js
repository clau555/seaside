class Clickable extends Sprite {

    constructor(spriteFile, x, y, callback, alpha = 1.0) {
        super(spriteFile, x, y, false, alpha);
        this.callback = callback;
    }

    action() {
        this.callback();
    }

}


class VolumeButton extends Clickable {

    constructor(x, y) {
        super("img/volume.png", x, y, () => {
            this.on = !this.on;
            this.sprite.src = this.on ? "img/volume.png" : "img/volume_off.png";
            Config.audio.volume = this.on ? Constants.VOLUME : 0.0;
        });
        this.on = true;
    }

}

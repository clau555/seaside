class ClickableSprite extends Sprite {

    constructor(x, y, spriteFile, callback, alpha = 1.0) {
        super(x, y, spriteFile, false, alpha);
        this.callback = callback;
    }

    action() {
        this.callback();
    }

}

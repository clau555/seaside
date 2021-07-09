class Star extends Sprite {

    static SPRITES = ["img/star1.png", "img/star2.png"];

    constructor(x, y) {
        super(Star.SPRITES[randomInt(0, Star.SPRITES.length)], x, y, true, randomFloat(0.01, 0.5));
        this.originalAlpha = this.alpha;
    }

    update(globalAlpha) {
        if (globalAlpha < 1) {
            this.alpha = this.originalAlpha * globalAlpha;
        }
        else if (!randomInt(0, 50) && globalAlpha >= 1) {
            this.alpha = this.originalAlpha + randomFloat(-0.1, 0.1);
            this.alpha = clamp(this.alpha, 0.1, 1.0);
        }
    }

}

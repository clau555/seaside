class Star extends Sprite {

    static SPRITES = ["assets/img/star1.png", "assets/img/star2.png"];

    constructor(x, y) {
        super(x, y, Star.SPRITES[Utils.randomInt(0, Star.SPRITES.length)], true, Utils.randomFloat(0.01, 0.5));
    }

    update(globalAlpha) {
        if (globalAlpha < 1) {
            this.alpha = this.originalAlpha * globalAlpha;
        }
        else if (!Utils.randomInt(0, 50) && globalAlpha >= 1) {
            this.alpha = this.originalAlpha + Utils.randomFloat(-0.1, 0.1);
            this.alpha = Utils.clamp(this.alpha, 0.1, 1.0);
        }
    }

}

class SeaParticle extends Rect{

    constructor(x, y) {
        super(x, y, 1, 1, [255, 255, 255], false, 1.0);
        this.increment = Utils.randomFloat(0.004, 0.02);
    }

    update() {
        if (this.alpha <= 0.0 || this.alpha >= 1.0) {
            this.increment = -this.increment;
        }
        this.alpha += this.increment;
    }

}

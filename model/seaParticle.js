class SeaParticle {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = Math.random();
        this.increment = Utils.randomFloat(0.004, 0.02);
    }

    update() {
        if (this.alpha <= 0.0 || this.alpha >= 1.0) {
            this.increment = -this.increment;
        }
        this.alpha += this.increment;
    }

    display(ctx) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(255, 255, 255," + this.alpha + ")";
        ctx.fillRect(this.x, this.y, 1, 1);
    }

    updateAndDisplay(ctx) {
        this.update();
        this.display(ctx);
    }

}

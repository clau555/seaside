class Sprite {

    constructor(spriteFile, x, y, centered = false, alpha = 1.0) {
        this.sprite = new Image();
        this.sprite.src = spriteFile;
        this.x = x;
        this.y = y;
        this.centered = centered;
        this.alpha = alpha;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    display(ctx) {
        ctx.globalAlpha = this.alpha;

        if (this.centered) {
            ctx.drawImage(this.sprite,
                Math.floor(this.x - this.sprite.width / 2),
                Math.floor(this.y - this.sprite.height / 2));
        } else {
            ctx.drawImage(this.sprite, this.x, this.y);
        }

        ctx.globalAlpha = 1.0;
    }

}

class Sprite {

    constructor(spriteFile, x, y, centered = false, alpha = 1.0) {
        this.sprite = new Image();
        this.sprite.src = spriteFile;
        this.x = x;
        this.y = y;
        this.centered = centered;
        this.alpha = alpha;

        // waiting until sprite is loaded to get dimensions
        this.w = 0;
        this.h = 0;
        this.sprite.onload = () => {
            this.w = this.sprite.width;
            this.h = this.sprite.height;
        }
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    display(ctx) {
        ctx.globalAlpha = this.alpha;

        if (this.centered) {
            ctx.drawImage(this.sprite,
                Math.floor(this.x - this.w / 2),
                Math.floor(this.y - this.h / 2));
        } else {
            ctx.drawImage(this.sprite, this.x, this.y);
        }

        ctx.globalAlpha = 1.0;
    }

}

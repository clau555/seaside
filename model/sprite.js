class Sprite extends Rect {

    constructor(x, y, spriteFile, centered = false, alpha = 1.0) {
        super(x, y, 0, 0, Rect.DEFAULTCOLOR, centered, alpha);

        this.sprite = new Image();
        this.sprite.src = spriteFile;

        // waiting until sprite is loaded to get dimensions
        this.sprite.onload = () => {
            this.w = this.sprite.width;
            this.h = this.sprite.height;
        }
    }

    display(ctx) {
        if (this.visible) {
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

}

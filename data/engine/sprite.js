class Sprite extends Rect {

    constructor(x, y, spriteFile,
                centered = false,
                mode = "normal",
                alpha = 1.0,
                orientation = 1) {
        super(x, y, 0, 0, Rect.DEFAULTCOLOR, centered, alpha);

        this.sprite = new Image();
        this.sprite.src = spriteFile;
        this.orientation = orientation;
        this.mode = mode;

        // waiting until sprite is loaded to get dimensions
        this.sprite.onload = () => {
            this.w = this.sprite.width;
            this.h = this.sprite.height;
        }
    }

    display(ctx) {
        if (this.visible) {

            ctx.globalAlpha = this.alpha;
            ctx.globalCompositeOperation = this.mode;

            // flipping sprite horizontally
            if (this.orientation === -1) {
                ctx.scale(-1, 1);
                this.x = -this.x;
            }

            if (this.centered) {
                ctx.drawImage(this.sprite,
                    Math.floor(this.x - this.w / 2),
                    Math.floor(this.y - this.h / 2));
            } else {
                ctx.drawImage(this.sprite, Math.floor(this.x), Math.floor(this.y));
            }

            // resetting flip
            if (this.orientation === -1) {
                ctx.scale(-1, 1);
                this.x = -this.x;
            }

            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "source-over";
        }
    }

}

class Rect {

    static DEFAULTCOLOR = [255, 0, 0];

    constructor(x, y, w, h, color = Rect.DEFAULTCOLOR, centered = false, alpha = 1.0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.centered = centered;
        this.color = color;
        this.originalAlpha = alpha;
        this.alpha = this.originalAlpha;
        this.visible = true;
    }

    getColorString() {
        let colorStr = "";
        for (let component of this.color) {
            colorStr += component.toString() + ",";
        }
        return colorStr;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    display(ctx) {
        if (this.visible) {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(" + this.getColorString() + this.alpha + ")";
            if (this.centered) {
                ctx.fillRect(Math.floor(this.x - this.w / 2), Math.floor(this.y - this.h / 2), this.w, this.h);
            } else {
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }
    }

}

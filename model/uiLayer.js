class UiLayer {

    static VISIBILITYDELAY = 100;

    constructor(canvas) {

        this.canvas = canvas;
        this.alpha = 0.0;
        this.lastMoveCounter = UiLayer.VISIBILITYDELAY;

        this.elements = [
            new Clickable("img/gear.png", Constants.WIDTH - 10, 2, null),
            new VolumeButton(Constants.WIDTH - 20, 2)
        ];

        // ui visibility handler
        this.canvas.addEventListener("mousemove", () => {
            this.show();
        });

        // canvas click handler
        this.canvas.addEventListener("click", (e) => {

            // getting click position on canvas
            let rect = this.canvas.getBoundingClientRect();
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
            let x = (e.pageX - rect.left) * Constants.WIDTH / w;
            let y = (e.pageY - rect.top) * Constants.HEIGHT / h;

            for (let element of this.elements) {
                // ui element action if click on element
                if (element.x <= x && x <= element.x + element.w &&
                    element.y <= y && y <= element.y + element.h) {

                    this.show();
                    element.action();
                }
            }
        });
    }

    show() {
        this.alpha = 1.0;
        this.canvas.style.cursor = "default";
        this.lastMoveCounter = UiLayer.VISIBILITYDELAY;
    }

    display(ctx) {
        ctx.globalCompositeOperation = "source-over";
        for (let element of this.elements) {
            element.alpha = this.alpha;
            element.display(ctx);
        }
        this.lastMoveCounter -= 1;

        if (this.lastMoveCounter <= 0) {
            // hide
            this.alpha = 0.0;
            this.canvas.style.cursor = "none";
            this.lastMoveCounter = 0;
        }
    }

}

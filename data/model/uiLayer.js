class UiLayer {

    static VISIBILITYDELAY = 100;

    constructor(canvas) {

        this.canvas = canvas;
        this.visible = false;
        this.mousePosition = {"x": 0, "y": 0};
        this.lastMoveCounter = UiLayer.VISIBILITYDELAY;

        // ui button elements
        const volumeButton = new VolumeButton(Constants.WIDTH - 20, Constants.HEIGHT - 10);
        const positionButton = new PositionButton(Constants.WIDTH - 10, Constants.HEIGHT - 10);
        this.buttons = [volumeButton, positionButton];

        // ui visibility handler
        this.canvas.addEventListener("mousemove", (e) => {
            this.mousePosition = this.getMousePositionOnCanvas(e);
            this.show();
        });

        // canvas click handler
        this.canvas.addEventListener("click", () => {
            for (let button of this.buttons) {
                if (Utils.isInsideRect(this.mousePosition.x, this.mousePosition.y, button)) {
                    this.show();
                    button.action();
                }
            }
        });
    }

    getMousePositionOnCanvas(event) {
        let rect = this.canvas.getBoundingClientRect();
        let w = rect.right - rect.left;
        let h = rect.bottom - rect.top;
        let x = (event.pageX - rect.left) * Constants.WIDTH / w;
        let y = (event.pageY - rect.top) * Constants.HEIGHT / h;
        return {"x": x, "y": y};
    }

    show() {
        this.visible = true;
        this.lastMoveCounter = UiLayer.VISIBILITYDELAY;
    }

    updateAndDisplay(ctx) {
        ctx.globalCompositeOperation = "source-over";
        this.canvas.style.cursor = "default";

        // buttons
        for (let button of this.buttons) {
            button.alpha = 0.5;
            if (Utils.isInsideRect(this.mousePosition.x, this.mousePosition.y, button)) {
                button.alpha = button.originalAlpha;
                this.canvas.style.cursor = "pointer";
            }
            button.visible = this.visible;
            button.display(ctx);
        }

        this.lastMoveCounter -= 1;

        if (this.lastMoveCounter <= 0) {
            // hide when counter is out
            this.visible = false;
            this.canvas.style.cursor = "none";
            this.lastMoveCounter = 0;
        }
    }

}


class VolumeButton extends ClickableSprite {

    constructor(x, y) {
        super(x, y, "assets/img/volume.png", () => {
            this.on = !this.on;
            this.sprite.src = this.on ? "assets/img/volume.png" : "assets/img/volume_off.png";
            Config.audio.volume = this.on ? Constants.VOLUME : 0.0;
        });
        this.on = true;
    }

}


class PositionButton extends ClickableSprite {

    static INACTIVESPRITE = "assets/img/marker.png";
    static ACTIVESPRITE = "assets/img/marker_red.png";
    static LOADINGSPRITE = "assets/img/marker_loading.png";

    constructor(x, y) {
        super(x, y, PositionButton.INACTIVESPRITE, () => {

            if (!this.loading) {

                this.active = !this.active;

                if (this.active) {

                    this.loading = true;
                    this.sprite.src = PositionButton.LOADINGSPRITE;

                    // setting position current user position
                    Config.positionId = navigator.geolocation.watchPosition(
                        (pos) => {

                            const crd = pos.coords;
                            Config.lat = crd.latitude;
                            Config.long = crd.longitude;

                            this.sprite.src = PositionButton.ACTIVESPRITE;
                            this.loading = false;

                            navigator.geolocation.clearWatch(Config.positionId);
                        },
                        () => {
                            this.sprite.src = PositionButton.INACTIVESPRITE;
                            this.active = false;
                        });

                } else {

                    // setting position back to default
                    this.sprite.src = PositionButton.INACTIVESPRITE;
                    Config.lat = Config.DEFAULTLAT;
                    Config.long = Config.DEFAULTLONG;

                }

            }
        });

        this.active = false;
        this.loading = false;

    }

}

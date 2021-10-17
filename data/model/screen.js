class Screen {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.sun = new Sprite(Constants.WIDTH / 2, Constants.HEIGHT / 2, "assets/img/sun.png", true);
        this.sky = new Sprite(0, 0, "assets/img/sky.png");
        this.sea = new Sprite(0, Constants.SEALEVEL, "assets/img/sea.png");

        let blendingImagesStr = [
            ["assets/img/day_color_sea.png", "assets/img/day_color_sky.png", "assets/img/day_overlay.png"],
            ["assets/img/night_color_sea.png", "assets/img/night_color_sky.png", "assets/img/night_overlay.png"],
            ["assets/img/sunset_color_sea.png", "assets/img/sunset_color_sky.png", "assets/img/sunset_overlay.png"],
        ];

        this.blendingImages = [];
        for (let i = 0; i < blendingImagesStr.length; i++) {
            let row = [];
            for (let j = 0; j < blendingImagesStr[i].length; j++) {
                row.push(new Sprite(0, 0, blendingImagesStr[i][j], false, "overlay"));
            }
            this.blendingImages.push(row);
        }
    }

    updateCanvas() {

        Config.long += 0.5;
        //Config.lat += 1;
        const sunPosition = SunCalc.getPosition(new Date(), Config.lat, Config.long);
        const sunAltitude = Utils.radiansToDegrees(sunPosition.altitude);
        const sunAzimuth = Utils.radiansToDegrees(sunPosition.azimuth);

        // setting day, night or sunset/sunrise
        let period;
        if (sunAltitude > 2.0) {
            period = 0;
        } else if (sunAltitude < -2.0) {
            period = 1;
        } else {
            period = 2;
        }

        // canvas reset
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // sky
        this.sky.display(this.ctx);
        this.blendingImages[period][1].display(this.ctx);

        // sun
        this.sun.setCoordinates(Constants.WIDTH * sunAzimuth / 180, Constants.SEALEVEL - sunAltitude * 1.5);
        this.sun.display(this.ctx);

        // front
        this.sea.display(this.ctx);
        this.blendingImages[period][0].display(this.ctx);

        // global overlay
        this.blendingImages[period][2].display(this.ctx);

        requestAnimationFrame(screen.updateCanvas.bind(this));
    }

}

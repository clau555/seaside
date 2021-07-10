class FrontLayer {

    constructor() {
        // all layer sprites
        this.sea = new Sprite("img/sea.png", 0, Constants.SEALEVEL);

        // sea particles
        this.particles = [];
        for (let i = 0; i < Constants.particlesMap.length; i++) {
            this.particles.push(new SeaParticle(Constants.particlesMap[i][0], Constants.particlesMap[i][1]));
        }

        // color images used for masks
        this.dawnColorImage = new Image();
        this.dawnColorImage.src = "img/color_dawn.png";
        this.nightColorImage = new Image();
        this.nightColorImage.src = "img/color_night.png";

        this.dawnMask = this.createCanvas();
        this.nightMask = this.createCanvas();
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = Constants.WIDTH;
        canvas.height = Constants.HEIGHT;
        return canvas;
    }

    updateMask(ctx, colorImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // drawing all layer sprites
        ctx.globalCompositeOperation = "source-over";
        this.sea.display(ctx);

        // getting a color mask from the drawn sprites
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(colorImage, 0, 0);
    }

    display(ctx, canvas, sunAltitude, dawnAlpha) {

        // updating color masks
        this.updateMask(this.dawnMask.getContext("2d"), this.dawnColorImage);
        this.updateMask(this.nightMask.getContext("2d"), this.nightColorImage);

        // drawing sprites
        ctx.globalCompositeOperation = "source-over";
        this.sea.display(ctx);

        // drawing sea particles
        for (let particle of this.particles) {
            particle.updateAndDisplay(ctx);
        }

        // applying dawn color mask
        ctx.globalCompositeOperation = "color";
        ctx.globalAlpha = dawnAlpha;
        ctx.drawImage(this.dawnMask, 0, 0);

        // applying night color mask
        if (sunAltitude < 0) {
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = 1.0 - dawnAlpha;
            ctx.drawImage(this.nightMask, 0, 0);
        } else if (sunAltitude >= 179) {
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = Utils.clamp(sunAltitude - 179, 0.0, 1.0);
            ctx.drawImage(this.nightMask, 0, 0);
        }

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
    }

}

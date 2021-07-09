class FrontLayer {

    constructor() {
        // all layer sprites
        this.sea = new Sprite("img/sea.png", 0, SEALEVEL);

        // sea particles
        this.particles = [];
        for (let i = 0; i < particlesMap.length; i++) {
            this.particles.push(new SeaParticle(particlesMap[i][0], particlesMap[i][1]));
        }

        // color images used for masks
        this.dawnColorImage = new Image();
        this.dawnColorImage.src = "img/color_dawn.png";
        this.nightColorImage = new Image();
        this.nightColorImage.src = "img/color_night.png";
    }

    createMask(colorImage) {

        // creating canvas storing our mask
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext("2d");

        // drawing all layer sprites
        ctx.globalCompositeOperation = "source-over";
        this.sea.display(ctx);

        // getting a color mask from the drawn sprites
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(colorImage, 0, 0);

        return canvas;
    }

    display(ctx, canvas, sunAltitude, dawnAlpha) {

        // updating color masks
        const dawnMask = this.createMask(this.dawnColorImage);
        const nightMask = this.createMask(this.nightColorImage);

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
        ctx.drawImage(dawnMask, 0, 0);

        // applying night color mask
        if (sunAltitude < 0) {
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = 1.0 - dawnAlpha;
            ctx.drawImage(nightMask, 0, 0);
        } else if (sunAltitude >= 179) {
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = clamp(sunAltitude - 179, 0.0, 1.0);
            ctx.drawImage(nightMask, 0, 0);
        }

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
    }

}

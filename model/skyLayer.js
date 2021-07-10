class SkyLayer {

    constructor() {
        this.spriteDay = new Image();
        this.spriteDay.src = "img/sky_day.png";

        this.spriteDawn = new Image();
        this.spriteDawn.src = "img/sky_dawn.png";

        this.spriteNight = new Image();
        this.spriteNight.src = "img/sky_night.png";

        this.stars = [];
        for (let i = 0; i < Constants.starsMap.length; i++) {
            this.stars.push(new Star(Constants.starsMap[i][0], Constants.starsMap[i][1]));
        }
    }

    display(ctx, canvas, sunAltitude, dawnAlpha) {

        ctx.globalCompositeOperation = "source-over";

        // day sky
        ctx.drawImage(this.spriteDay, 0, 0, canvas.width, canvas.height);

        if (sunAltitude <= 0) {
            // night sky when the sun is under the horizon
            ctx.drawImage(this.spriteNight, 0, 0, canvas.width, canvas.height);
        } else if (sunAltitude >= 179) {
            // night sky fades away on sunrise
            ctx.globalAlpha = Utils.clamp(sunAltitude - 179, 0.0, 1.0);
            ctx.drawImage(this.spriteNight, 0, 0, canvas.width, canvas.height);
        }

        // dawn sky progressively appear and disappear on sunset
        ctx.globalAlpha = dawnAlpha;
        ctx.drawImage(this.spriteDawn, 0, 0, canvas.width, canvas.height);

        // drawing stars at night
        if (sunAltitude < 0) {
            for (let star of this.stars) {
                star.update(1.0 - dawnAlpha);
                star.display(ctx);
            }
        }

        ctx.globalAlpha = 1.0;
    }

}

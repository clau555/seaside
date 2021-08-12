class SkyLayer {

    constructor() {
        this.spriteDay = new Image();
        this.spriteDay.src = "assets/img/sky_day.png";

        this.spriteDawn = new Image();
        this.spriteDawn.src = "assets/img/sky_dawn.png";

        this.spriteNight = new Image();
        this.spriteNight.src = "assets/img/sky_night.png";

        this.stars = [];
        for (let i = 0; i < Constants.starsMap.length; i++) {
            this.stars.push(new Star(Constants.starsMap[i][0], Constants.starsMap[i][1]));
        }

        this.shootingStars = [];
    }

    updateAndDisplay(ctx, canvas, sunAltitude, dawnAlpha) {

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
        if (dawnAlpha <= 0.3) {
            for (let star of this.stars) {
                star.update();
                star.display(ctx);
            }

            // spawning random shooting star
            if (Utils.randomInt(0, 1000) === 0 && dawnAlpha <= 0) {
                this.shootingStars.push(new ShootingStar(
                    Utils.randomInt(0, Constants.WIDTH),
                    Utils.randomInt(0, Constants.SEALEVEL - 50)
                ));
            }

        }

        // drawing shooting stars
        for (let shootingStar of this.shootingStars) {
            shootingStar.update();

            // delete shooting star if animation finished
            if (shootingStar.updateCounter >= ShootingStar.SPRITES.length) {
                this.shootingStars.splice(this.shootingStars.indexOf(shootingStar), 1);
            }

            shootingStar.display(ctx);
        }

        ctx.globalAlpha = 1.0;
    }

}


class Star extends Sprite {

    static SPRITES = ["assets/img/star1.png", "assets/img/star2.png", "assets/img/star3.png"];

    constructor(x, y) {
        super(x, y, Star.SPRITES[Utils.randomInt(0, Star.SPRITES.length)], true, Utils.randomFloat(0.01, 0.5));
    }

    update() {
        if (!Utils.randomInt(0, 50)) {
            this.alpha = this.originalAlpha + Utils.randomFloat(-0.1, 0.1);
            this.alpha = Utils.clamp(this.alpha, 0.1, 1.0);
        }
    }

}


class ShootingStar extends AnimatedSprite {

    static SPRITES = [
        "assets/img/shooting_star/1.png",
        "assets/img/shooting_star/2.png",
        "assets/img/shooting_star/3.png",
        "assets/img/shooting_star/4.png",
        "assets/img/shooting_star/5.png"
    ];

    constructor(x, y) {
        super(x, y, ShootingStar.SPRITES);
        this.updateCounter = 0;
    }

    update() {
        super.update();
        this.updateCounter += 1;
    }
}

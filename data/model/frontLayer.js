class FrontLayer {

    constructor() {
        // all layer sprites
        this.sea = new Sprite( 0, Constants.SEALEVEL, "assets/img/sea.png");
        this.boats = [];

        // sea particles
        this.particles = [];
        for (let i = 0; i < Constants.particlesMap.length; i++) {
            this.particles.push(new SeaParticle(Constants.particlesMap[i][0], Constants.particlesMap[i][1]));
        }

        // color images used for masks
        this.dawnColorImage = new Image();
        this.dawnColorImage.src = "assets/img/color_dawn.png";
        this.nightColorImage = new Image();
        this.nightColorImage.src = "assets/img/color_night.png";

        this.dawnMask = this.createCanvas();
        this.nightMask = this.createCanvas();
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = Constants.WIDTH;
        canvas.height = Constants.HEIGHT;
        return canvas;
    }

    updateMask(canvas, colorImage) {
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // drawing all layer sprites
        ctx.globalCompositeOperation = "source-over";
        this.sea.display(ctx);
        for (let boat of this.boats) {
            boat.display(ctx);
        }

        // getting a color mask from the drawn sprites
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(colorImage, 0, 0);
    }

    addRandomBoat() {
        let orientation = [-1, 1][Utils.randomInt(0, 2)];
        let x = (orientation === 1) ? - 6 : Constants.WIDTH + 6;
        this.boats.push(new Boat(x, Constants.SEALEVEL - 7, orientation));
    }

    display(ctx, canvas, sunAltitude, dawnAlpha) {

        // updating boats
        for (let boat of this.boats) {
            boat.update();
        }

        // updating color masks
        this.updateMask(this.dawnMask, this.dawnColorImage);
        this.updateMask(this.nightMask, this.nightColorImage);

        // small chance of boat spawning
        if (Utils.randomInt(0, 5000) === 0 && this.boats.length < 3) {
            this.addRandomBoat();
        }

        // drawing sprites
        ctx.globalCompositeOperation = "source-over";

        // boats
        for (let boat of this.boats) {
            boat.display(ctx);
        }

        // sea
        this.sea.display(ctx);

        // sea particles
        for (let particle of this.particles) {
            particle.update();
            particle.display(ctx);
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
        }

        // delete boat if outside screen
        for (let boat of this.boats) {
            if (boat.x < -Constants.OUTOFBOUND || Constants.WIDTH + Constants.OUTOFBOUND < boat.x) {
                this.boats.splice(this.boats.indexOf(boat), 1);
            }
        }

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
    }

}


class Boat extends Sprite {

    static SPEED = 0.04;

    constructor(x, y, orientation) {
        super(x, y, "assets/img/boat.png", false, 1.0, orientation);
    }

    update() {
    super.setCoordinates(this.x + Boat.SPEED * this.orientation, this.y);
    }

}


class SeaParticle extends Rect{

    constructor(x, y) {
        super(x, y, 1, 1, [255, 255, 255], false, 1.0);
        this.increment = Utils.randomFloat(0.004, 0.02);
    }

    update() {
        if (this.alpha <= 0.0 || this.alpha >= 1.0) {
            this.increment = -this.increment;
        }
        this.alpha += this.increment;
    }

}

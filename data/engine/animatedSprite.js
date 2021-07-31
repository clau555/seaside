class AnimatedSprite extends Sprite {

    constructor(x, y, spriteFiles, centered = false, alpha = 1.0, orientation = 1) {
        super(x, y, spriteFiles[0], centered, alpha, orientation);

        this.sprites = [];
        for (let spriteFile of spriteFiles) {
            let sprite = new Image();
            sprite.src = spriteFile;
            this.sprites.push(sprite);
        }

        this.currentIndex = 0;
    }

    update() {
        this.currentIndex = (this.currentIndex + 1) % this.sprites.length;
        this.sprite = this.sprites[this.currentIndex];
    }
}

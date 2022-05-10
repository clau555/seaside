// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

// audio
const AUDIO = new Audio('assets/sea-waves.wav');
AUDIO.loop = true;
AUDIO.volume = 0.2;
AUDIO.load();
AUDIO.play().then(() => {});

// screen dimensions
const WIDTH = 256;
const HEIGHT = 144;

// phases time in terms of day progression
const SUNRISE_PROGRESSION = 0.24;
const DAY_PROGRESSION = 0.27;
const SUNSET_PROGRESSION = 0.74;
const NIGHT_PROGRESSION = 0.77;

// sky colors
const SKY_COLORS = {
    sunrise: [ 'rgb(63, 144, 208)', 'rgb(255, 194, 117)' ],
    day: [ 'rgb(42, 207, 255)', 'rgb(181, 255, 246)' ],
    sunset: [ 'rgb(59,38,115)', 'rgb(255,86,36)' ],
    night: [ 'rgb(8, 0, 30)', 'rgb(50, 39, 119)' ],
};

// sky colors gradients
const GRAD_LENGTH = 512; // length in pixels
const GRAD_HEIGHT = 1;
const GRAD_TRANSITION = 0.03; // transition duration between phases in %
const GRADIENTS = createSkyGradients();

// sky
const SKY = new PIXI.Sprite(createSkyTexture(SKY_COLORS.day));

// stars
const STARS = new PIXI.Container();
const STAR_SPRITES = ['assets/sprites/stars/1.png', 'assets/sprites/stars/2.png'];
const STAR_NUMBER = 60;
const STARS_SPAWN_HEIGHT = 2 * HEIGHT / 3;

// number of frames between each star appearance/disappearance
const STARS_APPEAR_SPEED = 20;

for (let i = 0; i < STAR_NUMBER; i++) {
    const randIdx = ~~(Math.random() * STAR_SPRITES.length);
    const star = new PIXI.Sprite.from(STAR_SPRITES[randIdx]);
    star.x = ~~(i / STAR_NUMBER * WIDTH) + 1;
    star.y = ~~(Math.random() * STARS_SPAWN_HEIGHT);
    star.alpha = starAlpha(star.y);
    star.visible = false;
    STARS.addChild(star);
}
const RAND_STAR_INDEXES = Array
    .apply(null, {length: STAR_NUMBER})
    .map((_, i) => i);
shuffleArray(RAND_STAR_INDEXES);

// shooting star
const SHOOTING_STAR_SPRITES = [
    'assets/sprites/shooting_star/1.png',
    'assets/sprites/shooting_star/2.png',
    'assets/sprites/shooting_star/3.png',
    'assets/sprites/shooting_star/4.png',
    'assets/sprites/shooting_star/5.png',
];
const SHOOTING_STAR_TEXT = SHOOTING_STAR_SPRITES.map((e) => {
    return new PIXI.Texture.from(e, {});
});

// sun
const SUN = new PIXI.Sprite.from('assets/sprites/sun.png');
SUN.anchor.set(0.5)
SUN.roundPixels = true;

// moon
const MOON_SPRITES = [
    'assets/sprites/moon/new.png',
    'assets/sprites/moon/waxing_crescent.png',
    'assets/sprites/moon/quarter.png',
    'assets/sprites/moon/waxing_gibbous.png',
    'assets/sprites/moon/full.png',
    'assets/sprites/moon/waning_gibbous.png',
    'assets/sprites/moon/last_quarter.png',
    'assets/sprites/moon/waning_crescent.png',
];
const MOON = new PIXI.AnimatedSprite(MOON_SPRITES.map((e) => {
    return new PIXI.Texture.from(e, {});
}));
MOON.anchor.set(0.5);
MOON.roundPixels = true;

// sea
const SEA_SPRITES = ['assets/sprites/sea/1.png', 'assets/sprites/sea/2.png'];
const SEA = new PIXI.AnimatedSprite(SEA_SPRITES.map((e) => {
    return new PIXI.Texture.from(e, {});
}));
const SEA_LEVEL = 120;
SEA.y = SEA_LEVEL;
SEA.animationSpeed = 0.02;
SEA.play();

// boats
const BOATS = new PIXI.Container();
const BOAT_LENGTH = 8; // in pixels
const BOAT_NUMBER = 3;
const BOAT_OFFSCREEN_MARGIN = BOAT_LENGTH * 10;
for (let i = 0; i < BOAT_NUMBER; i++) {
    let boat = new PIXI.Sprite.from('assets/sprites/boat.png');
    boat.anchor.x = 0;
    boat.anchor.y = 1;
    boat.scale.x = Math.random() > 0.5 ? 1 : -1;
    boat.x = Math.random() * (WIDTH + 2 * BOAT_OFFSCREEN_MARGIN) - BOAT_OFFSCREEN_MARGIN;
    boat.y = SEA_LEVEL;
    boat.roundPixels = true;
    boat.vx = Math.random() * 0.1;
    BOATS.addChild(boat);
}

// clouds
const CLOUDS = new PIXI.Container();
const CLOUD_LENGTH = 40; // in pixels
const CLOUD_NUMBER = 10;
const CLOUD_OFFSCREEN_MARGIN = CLOUD_LENGTH;
const CLOUD_SPRITES = [
    'assets/sprites/clouds/1.png',
    'assets/sprites/clouds/2.png',
    'assets/sprites/clouds/3.png',
    'assets/sprites/clouds/4.png',
];
for (let i = 0; i < CLOUD_NUMBER; i++) {
    const randIdx = ~~(Math.random() * CLOUD_SPRITES.length);
    let cloud = new PIXI.Sprite.from(CLOUD_SPRITES[randIdx]);
    cloud.anchor.x = 0;
    cloud.anchor.y = 1;
    cloud.x = Math.random() * (WIDTH + 2 * CLOUD_OFFSCREEN_MARGIN) - CLOUD_OFFSCREEN_MARGIN;
    cloud.y = Math.random() * 50 + 12;
    cloud.roundPixels = true;
    let rndSign = Math.random() > 0.5 ? 1 : -1;
    cloud.vx = Math.random() * 0.1 * rndSign;
    cloud.scale.x = rndSign;
    CLOUDS.addChild(cloud);
}

// front sprites group
const FRONT = new PIXI.Container();
FRONT.addChild(SEA);
FRONT.addChild(BOATS);
FRONT.addChild(CLOUDS);

// front sprites brightness filter
const FILTER = new PIXI.filters.ColorMatrixFilter();
FRONT.filters = [FILTER];

// stage initialization
const APP = new PIXI.Application({width: WIDTH, height: HEIGHT});
document.body.appendChild(APP.view);
APP.stage.addChildAt(SKY, 0);
APP.stage.addChildAt(STARS, 1);
APP.stage.addChildAt(SUN, 2);
APP.stage.addChildAt(MOON, 3);
APP.stage.addChildAt(FRONT, 4);

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------

const DEBUG = false;
let counter = 0;
let init = true; // true on first loop, false after

// main loop
APP.ticker.add(() => {

    if (DEBUG && init) console.time();

    const now = new Date();
    if (DEBUG) {
        now.setTime(now.getTime() + 60000 * counter); // time speed up
    }
    const progression = dayProgression(now);

    // boats update
    for (let i = 0; i < BOAT_NUMBER; i++) {
        const boat = BOATS.getChildAt(i);
        boat.x += boat.vx * boat.scale.x;
        if (boat.x < -BOAT_OFFSCREEN_MARGIN) {
            // off-screen on left border
            boat.scale.x = 1;
            boat.x = -BOAT_LENGTH;
        } else if (boat.x > WIDTH + BOAT_OFFSCREEN_MARGIN) {
            // off-screen on right border
            boat.scale.x = -1;
            boat.x = WIDTH + BOAT_LENGTH;
        }
    }

    // clouds update
    for (let i = 0; i < CLOUD_NUMBER; i++) {
        const cloud = CLOUDS.getChildAt(i);
        cloud.x += cloud.vx;
        if (cloud.x < -CLOUD_OFFSCREEN_MARGIN) {
            // off-screen on left border
            cloud.x = -CLOUD_LENGTH;
            cloud.vx *= -1;
        } else if (cloud.x > WIDTH + CLOUD_OFFSCREEN_MARGIN) {
            // off-screen on right border
            cloud.x = WIDTH + CLOUD_LENGTH;
            cloud.vx *= -1;
        }
    }

    // checking if stars are visible
    let visibleStars = false;
    if (progression >= NIGHT_PROGRESSION - GRAD_TRANSITION ||
        progression <= SUNRISE_PROGRESSION - GRAD_TRANSITION) {
        visibleStars = true;
    }

    // spawning shooting star randomly
    if (visibleStars && !~~(Math.random() * 200)) {
        const shootingStar = new PIXI.AnimatedSprite(SHOOTING_STAR_TEXT);
        shootingStar.loop = false;
        shootingStar.animationSpeed = 0.8;
        shootingStar.x = ~~(Math.random() * WIDTH);
        shootingStar.y = ~~(Math.random() * STARS_SPAWN_HEIGHT);
        shootingStar.alpha = starAlpha(shootingStar.y);
        shootingStar.onComplete = () => {
            shootingStar.destroy();
        };
        APP.stage.addChildAt(shootingStar, 1);
        shootingStar.play();
    }

    // updates stars in a random order
    const updateStarsVisibility = counter % STARS_APPEAR_SPEED === 0;
    let checked = false;
    for (let i = 0; i < RAND_STAR_INDEXES.length; i++) {
        const star = STARS.getChildAt(RAND_STAR_INDEXES[i]);

        // star visibility
        if (updateStarsVisibility) {
            if (!checked && !visibleStars && star.visible) {
                star.visible = false;
                checked = true;
            } else if (!checked && visibleStars && !star.visible) {
                star.visible = true;
                checked = true;
            }
        }
        // star twinkling
        if (star.visible && !~~(Math.random() * 40)) {
            const originalAlpha = starAlpha(star.y);
            const offsetAlpha = Math.random() / 4;
            star.alpha = originalAlpha - offsetAlpha;
        }
    }

    // update sun position making it describe a elliptic movement
    SUN.x = 10 + (WIDTH - 20) * (1 - (1 + Math.sin(progression * Math.PI * 2)) / 2);
    SUN.y = SEA_LEVEL + (SEA_LEVEL - 10) * Math.cos(progression * Math.PI * 2);

    // moon sprite update in the opposite position of the sun
    MOON.x = 10 + (WIDTH - 20) * ((1 + Math.sin(progression * Math.PI * 2)) / 2);
    MOON.y = SEA_LEVEL - (SEA_LEVEL - 10) * Math.cos(progression * Math.PI * 2);
    MOON.alpha = starAlpha(MOON.y);
    MOON.gotoAndStop(getMoonPhase(now));

    // getting current sky colors
    const colors = [
        imageDataToRgbStr(GRADIENTS[0].getImageData(progression * GRAD_LENGTH, 0, 1, 1).data),
        imageDataToRgbStr(GRADIENTS[1].getImageData(progression * GRAD_LENGTH, 0, 1, 1).data),
    ];

    // sky and ambiant color update
    SKY.texture.destroy(true);
    SKY.texture = createSkyTexture(colors);
    document.body.style.backgroundColor = colors[0];

    // front sprites brightness adjustment
    FILTER.brightness(luminosityOfRgbStr(colors[1]) / 255);

    if (DEBUG && init) console.timeEnd();
    init = false;
    counter++;
});

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Returns the appropriate alpha transparency of a star sprite according to its height.
 *
 * @param {number} y - star height in pixels
 * @return {number}
 */
function starAlpha(y) {
    return (STARS_SPAWN_HEIGHT - y) / STARS_SPAWN_HEIGHT;
}

/**
 * Returns two canvas contexts, each of them containing the color progression of the sky colors through the day,
 * starting from midnight to the end of the day.
 * The first one is for the top color of the sky, the second one for the bottom color.
 *
 * @return {CanvasRenderingContext2D[]}
 */
function createSkyGradients() {

    let contexts = [];
    for (let i = 0; i < 2; i++) {

        // setting up canvas
        const canvas = document.createElement('canvas');
        canvas.width = GRAD_LENGTH;
        canvas.height = GRAD_HEIGHT;
        const context = canvas.getContext('2d')

        // creating gradient
        const gradient = context.createLinearGradient(0, 0, GRAD_LENGTH, 0);

        // editing gradient colors
        gradient.addColorStop(0, SKY_COLORS.night[i]);
        gradient.addColorStop(SUNRISE_PROGRESSION - GRAD_TRANSITION, SKY_COLORS.night[i]);
        gradient.addColorStop(SUNRISE_PROGRESSION, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(DAY_PROGRESSION - GRAD_TRANSITION, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(DAY_PROGRESSION, SKY_COLORS.day[i]);
        gradient.addColorStop(SUNSET_PROGRESSION - GRAD_TRANSITION, SKY_COLORS.day[i]);
        gradient.addColorStop(SUNSET_PROGRESSION, SKY_COLORS.sunset[i]);
        gradient.addColorStop(NIGHT_PROGRESSION - GRAD_TRANSITION, SKY_COLORS.sunset[i]);
        gradient.addColorStop(NIGHT_PROGRESSION, SKY_COLORS.night[i]);
        gradient.addColorStop(1, SKY_COLORS.night[i]);

        // drawing gradient on its canvas
        context.fillStyle = gradient;
        context.fillRect(0, 0, GRAD_LENGTH, GRAD_HEIGHT);

        contexts.push(context);
    }

    return contexts;
}

/**
 * Creates a vertical gradient texture used for sky sprite.
 *
 * https://pixijs.io/examples/#/textures/gradient-basic.js
 *
 * @param {string[]} colors - css rgb strings
 * @return {PIXI.Texture}
 */
function createSkyTexture(colors) {

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grd.addColorStop(0.1, colors[0]);
    grd.addColorStop(0.7, colors[1]);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    return new PIXI.Texture.from(canvas, {});
}

/**
 * Returns progression of the given `date` in its day.
 * Exemple: a date at noon is 0.5, at midnight is 0.
 *
 * @param {Date} date
 * @return {number} - day progression in percentage (0 to 1)
 */
function dayProgression(date) {
    const a = new Date(date);
    a.setHours(0, 0, 0, 0); // last midnight
    const b = new Date(date);
    b.setDate(b.getDate() + 1);
    b.setHours(0, 0, 0, 0); // next midnight
    return (date.getTime() - a.getTime()) / (b.getTime() - a.getTime());
}

/**
 * Returns the moon phase for a given date.
 * The phase is an integer between 0 and 7, with 0 representing new moon, and 7 representing waning crescent.
 *
 * https://gist.github.com/endel/dfe6bb2fbe679781948c
 *
 * @param {Date} date
 * @returns {number}
 */
function getMoonPhase(date) {

    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    if (month < 3) {
        year--;
        month += 12;
    }
    month++;

    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09; // jd is total days elapsed
    jd /= 29.5305882; // divide by the moon cycle
    let b = parseInt(jd); // int(jd) -> b, take integer part of jd
    jd -= b; // subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8); // scale fraction from 0-8 and round

    if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0
    return b;
}

/**
 * Returns the css rgb string of an ImageData object.
 *
 * @param {Uint8ClampedArray} imgData
 * @return {string}
 */
function imageDataToRgbStr(imgData) {
    return 'rgb(' + imgData[0] + ',' + imgData[1] + ',' + imgData[2] + ')';
}

/**
 * Returns the luminosity of a css rgb string.
 *
 * @param {string} rgbStr
 * @return {number}
 */
function luminosityOfRgbStr(rgbStr) {
    const rgb = rgbStr.match(/\d+/g);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Durstenfeld shuffle algorithm.
 *
 * https://stackoverflow.com/a/12646864/17987233
 *
 * @param {number[]} array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// screen composition config
const WIDTH = 256;
const HEIGHT = 144;
const SEA_LEVEL = 120;

// geographic position config
const LAT = 54;
const LONG = -6.41667;

// sky colors gradients
const GRAD_LENGTH = 512; // length in pixels
const GRAD_HEIGHT = 1;
const GRAD_TRANSITION = 0.03; // transition between phases in %

// sky colors config
const SKY_COLORS = {
    sunrise: [ 'rgb(63, 144, 208)', 'rgb(255, 194, 117)' ],
    day: [ 'rgb(42, 207, 255)', 'rgb(181, 255, 246)' ],
    sunset: [ 'rgb(59,38,115)', 'rgb(255,86,36)' ],
    night: [ 'rgb(8, 0, 30)', 'rgb(50, 39, 119)' ],
};

// sky
const SKY = new PIXI.Sprite(createSkyTexture(SKY_COLORS.day));

// stars
const STARS = new PIXI.Container();
const STAR_SPRITES = ['/assets/img/star_1.png', '/assets/img/star_2.png'];
const STAR_NUMBER = 60;
const STARS_SPAWN_HEIGHT = 2 * HEIGHT / 3;
for (let i = 0; i < STAR_NUMBER; i++) {
    const randIdx = ~~(Math.random() * STAR_SPRITES.length);
    const star = PIXI.Sprite.from(STAR_SPRITES[randIdx]);
    star.x = ~~(i / STAR_NUMBER * WIDTH) + 1;
    star.y = ~~(Math.random() * STARS_SPAWN_HEIGHT);
    star.alpha = starAlpha(star.y);
    STARS.addChild(star);
}

// shooting star
const SHOOTING_STAR_SPRITES = [
    '/assets/img/shooting_star/1.png',
    '/assets/img/shooting_star/2.png',
    '/assets/img/shooting_star/3.png',
    '/assets/img/shooting_star/4.png',
    '/assets/img/shooting_star/5.png',
];
const SHOOTING_STAR_TEXT = SHOOTING_STAR_SPRITES.map((e) => {
    return PIXI.Texture.from(e);
});

// sun
const SUN = PIXI.Sprite.from('/assets/img/sun.png');
SUN.anchor.set(0.5);

// sea
const SEA_SPRITES = ['/assets/img/sea/1.png', '/assets/img/sea/2.png'];
const SEA = new PIXI.AnimatedSprite(SEA_SPRITES.map((e) => {
    return PIXI.Texture.from(e);
}));
SEA.y = SEA_LEVEL;
SEA.animationSpeed = 0.02;
SEA.play();

// front sprites group
const FRONT = new PIXI.Container();
FRONT.addChild(SEA);

// front sprites brightness filter
const FILTER = new PIXI.filters.ColorMatrixFilter();
FRONT.filters = [FILTER];

// stage initialization
const APP = new PIXI.Application({width: WIDTH, height: HEIGHT});
document.body.appendChild(APP.view);
APP.stage.addChildAt(SKY, 0);
APP.stage.addChildAt(STARS, 1);
APP.stage.addChildAt(SUN, 2);
APP.stage.addChildAt(FRONT, 3);

const DEBUG = true;
let counter = 0;

let lastNow = new Date();
let init = true; // true on first loop, false after
let gradients = [];

APP.ticker.add(main);

/**
 * Main loop.
 */
function main() {

    if (DEBUG && init) console.time();

    const now = new Date();

    if (DEBUG) {
        // time speed up
        now.setTime(now.getTime() + 60000 * counter);
        counter++;
    }

    /*
    hard coded fix for a bug where the getTimes method
    doesn't return the Dates of the current day.
    */
    const dateTmp = new Date(now);
    if (dateTmp.getHours() < 2) dateTmp.setHours(12);

    const events = SunCalc.getTimes(dateTmp, LAT, LONG);

    // sun angle at different times of the day
    const sunrisePos = SunCalc.getPosition(events.sunrise, LAT, LONG);
    const noonPos = SunCalc.getPosition(events.solarNoon, LAT, LONG);
    const curPos = SunCalc.getPosition(now, LAT, LONG);

    // recalculates sky gradients every new day
    if (now.getDate() > lastNow.getDate() || init) {
        gradients = createSkyGradients(events);
    }

    // current date's midnight
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    // Windows of the different phases of the day.
    // They have to be in this order for the below while loop to work.
    const windows = [
        { phase: "night",   time: events.dusk },
        { phase: "sunset",  time: events.sunsetStart },
        { phase: "day",     time: events.sunriseEnd },
        { phase: "sunrise", time: events.dawn },
        { phase: "night",   time: midnight },
    ];

    // finding the current window
    let found = false;
    let i = 0;
    while (!found && i < windows.length) {
        if (now >= windows[i].time) found = true;
        i++;
    }
    i--;

    if (!found) throw new Error("Could not find current window.");

    const night = windows[i].phase === "night";

    // canvas updates
    sunUpdate(curPos, sunrisePos, noonPos);
    spawnShootingStar(night);
    starsUpdate(night);
    skyUpdate(now);

    lastNow = now;

    if (DEBUG && init) console.timeEnd();

    if (init) init = false;
}

/**
 * Updates sun sprite position on screen according to real time sun position.
 *
 * @param {object} curPos
 * @param {object} sunrisePos
 * @param {object} noonPos
 */
function sunUpdate(curPos, sunrisePos, noonPos) {

    // sets the margin between the sun and the screen left and right edges
    const azimuthOffset = Math.abs(sunrisePos.azimuth) + 0.1;

    // updates the sun sprite coordinates making it describe a parabolic movement through the day
    SUN.x = ~~(WIDTH * ((curPos.azimuth + azimuthOffset) % (azimuthOffset * 2)) / (azimuthOffset * 2));
    SUN.y = ~~(SEA_LEVEL - (SEA_LEVEL - 10) * curPos.altitude / noonPos.altitude);
}

/**
 * Spawns a shooting star in the sky at night at random coordinates.
 *
 * @param {boolean} night
 */
function spawnShootingStar(night) {
    if (night && !~~(Math.random() * 200)) {
        const shootingStar = new PIXI.AnimatedSprite(SHOOTING_STAR_TEXT);

        shootingStar.loop = false;
        shootingStar.animationSpeed = 0.8;
        shootingStar.x = ~~(Math.random() * WIDTH);
        shootingStar.y = ~~(Math.random() * STARS_SPAWN_HEIGHT);

        shootingStar.onComplete = () => {
            shootingStar.destroy();
        };

        APP.stage.addChildAt(shootingStar, 1);
        shootingStar.play();
    }
}

/**
 * Updates each stars transparency.
 * They're invisible if not at night.
 *
 * @param {boolean} night
 */
function starsUpdate(night) {

    // stars visibility
    STARS.visible = night;

    // stars twinkling
    if (STARS.visible) {
        for (let i = 0; i < STAR_NUMBER; i++) {
            if (!~~(Math.random() * 40)) {
                const star = STARS.getChildAt(i);
                const originalAlpha = starAlpha(star.y);
                const offsetAlpha = Math.random() / 4;
                star.alpha = originalAlpha - offsetAlpha;
            }
        }
    }
}

/**
 * Returns the appropriate alpha transparency
 * of a star sprite according to its height.
 *
 * @param {number} y star height in pixels
 * @return {number}
 */
function starAlpha(y) {
    return (STARS_SPAWN_HEIGHT - y) / STARS_SPAWN_HEIGHT;
}

/**
 * @param {Object} events
 * @return {CanvasRenderingContext2D[]}
 */
function createSkyGradients(events) {

    // events progressions percentages of the current day
    const sunrisePrg = dayProgression(events.dawn);
    const dayPrg = dayProgression(events.sunriseEnd);
    const sunsetPrg = dayProgression(events.sunsetStart);
    const nightPrg = dayProgression(events.dusk);

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
        gradient.addColorStop(sunrisePrg - GRAD_TRANSITION, SKY_COLORS.night[i]);
        gradient.addColorStop(sunrisePrg, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(dayPrg - GRAD_TRANSITION, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(dayPrg, SKY_COLORS.day[i]);
        gradient.addColorStop(sunsetPrg - GRAD_TRANSITION, SKY_COLORS.day[i]);
        gradient.addColorStop(sunsetPrg, SKY_COLORS.sunset[i]);
        gradient.addColorStop(nightPrg - GRAD_TRANSITION, SKY_COLORS.sunset[i]);
        gradient.addColorStop(nightPrg, SKY_COLORS.night[i]);
        gradient.addColorStop(1, SKY_COLORS.night[i]);

        // drawing gradient on its canvas
        context.fillStyle = gradient;
        context.fillRect(0, 0, GRAD_LENGTH, GRAD_HEIGHT);

        contexts.push(context);
    }

    return contexts;
}

/**
 * Updates sun colors and texture.
 *
 * @param {Date} now
 */
function skyUpdate(now) {

    // x coordinates on gradient corresponding to current day progression
    const x = dayProgression(now) * GRAD_LENGTH;

    // getting current sky colors
    const colors = [
        imageDataToRgbStr(gradients[0].getImageData(x, 0, 1, 1).data),
        imageDataToRgbStr(gradients[1].getImageData(x, 0, 1, 1).data),
    ];

    // applying colors
    SKY.texture = createSkyTexture(colors);
}

/**
 * Creates a vertical gradient texture used for sky sprite.
 *
 * https://pixijs.io/examples/#/textures/gradient-basic.js
 *
 * @param {string[]} colors css rgb strings
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

    return PIXI.Texture.from(canvas);
}

/**
 * Returns progression of a given `time` in its day.
 *
 * @param {Date} date
 * @return {number} day progression in percentage (0 to 1)
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
 * Returns the css rgb string of an ImageData object.
 *
 * @param {Uint8ClampedArray} imgData
 * @return {string}
 */
function imageDataToRgbStr(imgData) {
    return 'rgb(' + imgData[0] + ',' + imgData[1] + ',' + imgData[2] + ')';
}

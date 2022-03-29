// screen composition
const WIDTH = 256;
const HEIGHT = 144;
const SEA_LEVEL = 120;

// geographic position
const LAT = 54;
const LONG = -6.41667;

// sky colors gradients
const GRAD_LENGTH = 512; // length in pixels
const GRAD_HEIGHT = 1;
const GRAD_TRANSITION = 0.03; // transition duration between phases in %

// sky colors
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
const STARS_APPEAR_SPEED = 20; // number of frames between stars appearing/disappearing

for (let i = 0; i < STAR_NUMBER; i++) {
    const randIdx = ~~(Math.random() * STAR_SPRITES.length);
    const star = PIXI.Sprite.from(STAR_SPRITES[randIdx]);
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
SUN.anchor.set(0.5)
SUN.roundPixels = true;

// sea
const SEA_SPRITES = ['/assets/img/sea/1.png', '/assets/img/sea/2.png'];
const SEA = new PIXI.AnimatedSprite(SEA_SPRITES.map((e) => {
    return PIXI.Texture.from(e);
}));
SEA.y = SEA_LEVEL;
SEA.animationSpeed = 0.02;
SEA.play();

// boats
const BOATS = new PIXI.Container();
const BOAT_LENGTH = 8; // in pixels
const BOAT_NUMBER = 3;
const BOAT_OFFSCREEN_MARGIN = BOAT_LENGTH * 10;
for (let i = 0; i < BOAT_NUMBER; i++) {
    let boat = PIXI.Sprite.from('/assets/img/boat.png');
    boat.anchor.x = 0;
    boat.anchor.y = 1;
    boat.scale.x = Math.random() > 0.5 ? 1 : -1;
    boat.x = Math.random() * (WIDTH + 2 * BOAT_OFFSCREEN_MARGIN);
    boat.y = SEA_LEVEL;
    boat.roundPixels = true;
    boat.vx = Math.random() * 0.1;
    BOATS.addChild(boat);
}

// front sprites group
const FRONT = new PIXI.Container();
FRONT.addChild(SEA);
FRONT.addChild(BOATS);

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
let progressions = {
    sunrise: 0,
    day: 0,
    sunset: 0,
    night: 0,
    now: 0,
};

// main loop
APP.ticker.add(() => {

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
        progressions.sunrise = dayProgression(events.dawn);
        progressions.day = dayProgression(events.sunriseEnd);
        progressions.sunset = dayProgression(events.sunsetStart);
        progressions.night = dayProgression(events.dusk);
        gradients = createSkyGradients(events, progressions);
    }
    progressions.now = dayProgression(now);

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

    let visibleStars = false;
    if (progressions.now >= (progressions.night - GRAD_TRANSITION) ||
        progressions.now <= progressions.sunrise - GRAD_TRANSITION) {
        visibleStars = true;
    }

    // getting current sky colors
    const x = progressions.now * GRAD_LENGTH;
    const colors = [
        imageDataToRgbStr(gradients[0].getImageData(x, 0, 1, 1).data),
        imageDataToRgbStr(gradients[1].getImageData(x, 0, 1, 1).data),
    ];

    // canvas updates
    sunUpdate(curPos, sunrisePos, noonPos);
    boatsUpdate();
    spawnShootingStar(visibleStars);
    starsUpdate(visibleStars);
    SKY.texture = createSkyTexture(colors);

    // front sprites brightness adjustment
    FILTER.brightness(luminosityOfRgbStr(colors[1]) / 255);

    lastNow = now;
    if (DEBUG && init) console.timeEnd();
    init = false;
});

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
    SUN.x = WIDTH * ((curPos.azimuth + azimuthOffset) % (azimuthOffset * 2)) / (azimuthOffset * 2);
    SUN.y = SEA_LEVEL - (SEA_LEVEL - 10) * curPos.altitude / noonPos.altitude;
}

function boatsUpdate() {
    for (let i = 0; i < BOAT_NUMBER; i++) {

        const boat = BOATS.getChildAt(i);

        boat.x += boat.vx * boat.scale.x;

        if (boat.x + BOAT_OFFSCREEN_MARGIN < 0) {
            // off-screen on left border
            boat.scale.x = 1;
            boat.x = -BOAT_LENGTH;
        } else if (boat.x > WIDTH + BOAT_OFFSCREEN_MARGIN) {
            // off-screen on right border
            boat.scale.x = -1;
            boat.x = WIDTH + BOAT_LENGTH;
        }
    }
}

/**
 * Spawns a shooting star in the sky at night at random coordinates.
 *
 * @param {boolean} visibleStars
 */
function spawnShootingStar(visibleStars) {

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
}

/**
 * Updates each stars transparency.
 * Each one of them appears slowly if at night.
 * They disappear slowly if not.
 *
 * @param {boolean} visibleStars True if stars can be visible in the sky.
 */
function starsUpdate(visibleStars)  {

    const updateStarsVisibility = counter % STARS_APPEAR_SPEED === 0;
    let checked = false;

    for (let i = 0; i < RAND_STAR_INDEXES.length; i++) {

        const star = STARS.getChildAt(RAND_STAR_INDEXES[i]);

        // star appearance and disappearance
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
 * @param {Object} progressions
 * @return {CanvasRenderingContext2D[]}
 */
function createSkyGradients(events, progressions) {

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
        gradient.addColorStop(progressions.sunrise - GRAD_TRANSITION, SKY_COLORS.night[i]);
        gradient.addColorStop(progressions.sunrise, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(progressions.day - GRAD_TRANSITION, SKY_COLORS.sunrise[i]);
        gradient.addColorStop(progressions.day, SKY_COLORS.day[i]);
        gradient.addColorStop(progressions.sunset - GRAD_TRANSITION, SKY_COLORS.day[i]);
        gradient.addColorStop(progressions.sunset, SKY_COLORS.sunset[i]);
        gradient.addColorStop(progressions.night - GRAD_TRANSITION, SKY_COLORS.sunset[i]);
        gradient.addColorStop(progressions.night, SKY_COLORS.night[i]);
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
 * Returns progression of the given `date` in its day.
 * Exemple: a date at noon is 0.5, at midnight is 0.
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

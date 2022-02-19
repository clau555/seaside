// screen composition config
const WIDTH = 256;
const HEIGHT = 144;
const SEA_LEVEL = 120;

// geographic position config
const LAT = 54;
const LONG = -6.41667;

// window progression percentage at which the
// color transition to the next window begins
const TRANSITION = 0.98;

// sky colors config
const SKY_COLORS = {
    sunrise: [ 'rgb(63, 144, 208)', 'rgb(255, 194, 117)' ],
    day: [ 'rgb(42, 207, 255)', 'rgb(181, 255, 246)' ],
    sunset: [ 'rgb(68,0,39)', 'rgb(255,155,24)' ],
    night: [ 'rgb(8, 0, 30)', 'rgb(50, 39, 119)' ],
};
const SKY_TEXT = {
    sunrise: createSkyTexture(SKY_COLORS.sunrise[0], SKY_COLORS.sunrise[1]),
    day: createSkyTexture(SKY_COLORS.day[0], SKY_COLORS.day[1]),
    sunset: createSkyTexture(SKY_COLORS.sunset[0], SKY_COLORS.sunset[1]),
    night: createSkyTexture(SKY_COLORS.night[0], SKY_COLORS.night[1]),
};

// sky
const SKY = new PIXI.Sprite(SKY_TEXT.day);

// stars
const STARS = new PIXI.Container();
const STAR_SPRITES = ['/assets/img/star_1.png', '/assets/img/star_2.png'];
const STAR_NUMBER = 60;
const SPAWN_AMPLITUDE = 2 * HEIGHT / 3;
for (let i = 0; i < STAR_NUMBER; i++) {
    const star = PIXI.Sprite.from(STAR_SPRITES[~~(Math.random() * STAR_SPRITES.length)]);
    star.x = ~~(i / STAR_NUMBER * WIDTH) + 1;
    star.y = ~~(Math.random() * SPAWN_AMPLITUDE);
    star.alpha = (SPAWN_AMPLITUDE - star.y) / SPAWN_AMPLITUDE;
    STARS.addChild(star);
}

// sun
const SUN = PIXI.Sprite.from('/assets/img/sun.png');
SUN.anchor.set(0.5); // makes sun coordinates centered on its sprite

// sea
const SEA = new PIXI.AnimatedSprite(['/assets/img/sea/1.png', '/assets/img/sea/2.png'].map((e) => {
    return PIXI.Texture.from(e);
}));
SEA.y = SEA_LEVEL; // places sea sprite on the correct height
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

// main loop
let counter = 0;
APP.ticker.add(() => {

    // getting today time and events
    const today = new Date();
    today.setTime(today.getTime() + 60000 * counter); // time speed up
    counter++;
    const events = SunCalc.getTimes(today, LAT, LONG);

    // getting tomorrow time and events
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomEvents = SunCalc.getTimes(tomorrow, LAT, LONG);

    // getting yesterday time and events
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestEvents = SunCalc.getTimes(yesterday, LAT, LONG);

    // sun angle position in the sky at different times of the day
    const sunrisePos = SunCalc.getPosition(events.sunrise, LAT, LONG);
    const noonPos = SunCalc.getPosition(events.solarNoon, LAT, LONG);
    const curPos = SunCalc.getPosition(today, LAT, LONG);

    // windows of the different phases of the day
    const windows = [
        { name: "sunrise", skyTexture: SKY_TEXT.sunrise, colors: SKY_COLORS.sunrise, brightness: 0.6, start: events.dawn.getTime() },
        { name: "day", skyTexture: SKY_TEXT.day, colors: SKY_COLORS.day, brightness: 1, start: events.sunriseEnd.getTime() },
        { name: "sunset", skyTexture: SKY_TEXT.sunset, colors: SKY_COLORS.sunset, brightness: 0.6, start: events.sunsetStart.getTime() },
        { name: "night", skyTexture: SKY_TEXT.night, colors: SKY_COLORS.night, brightness: 0.2, start: events.dusk.getTime() },
    ];

    // finding the current window

    let found = false;
    let night = false;

    const idx = {
        cur: 0, // current window index
        next: 0, // next window index
    };

    const times = {
        now: today.getTime(), // current time
        start: 0, // current window starting time
        end: 0, // current window ending time
    };

    while (!found && idx.cur < windows.length) {

        idx.next = (idx.cur + 1) % windows.length; // loops through the array
        times.start = windows[idx.cur].start;
        times.end = windows[idx.next].start;
        night = windows[idx.cur].name === "night";

        // at night, the window can end on tomorrow's dawn
        // and begin on yesterday's sunset
        let hour = today.getHours();

        if (night && (hour > 12 || hour < 1))
            times.end = tomEvents.dawn.getTime();

        else if (night)
            times.start = yestEvents.sunset.getTime();

        if (times.start <= times.now && times.now < times.end)
            found = true;

        idx.cur++;
    }
    idx.cur--;

    // canvas elements updates
    sunUpdate(curPos, sunrisePos, noonPos);
    starsUpdate(times, windows, idx);
    skyUpdate(times, windows, idx);
    luminosityUpdate(times, windows, idx);
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
    SUN.x = ~~(WIDTH * ((curPos.azimuth + azimuthOffset) % (azimuthOffset * 2)) / (azimuthOffset * 2));
    SUN.y = ~~(SEA_LEVEL - (SEA_LEVEL - 10) * curPos.altitude / noonPos.altitude);
}

/**
 * Updates stars appearance.
 *
 * @param {{now: number, start: number, end: number}} windowTimes
 * @param {{name: string, skyTexture: PIXI.Texture, start: number, brightness: number, colors: string[]}[]} windows
 * @param {{cur: number, next: number}} idx
 */
function starsUpdate(windowTimes, windows, idx) {
    const windowDuration = windowTimes.end - windowTimes.start;
    const now = windowTimes.now - windowTimes.start;

    // stars visibility
    STARS.visible = true;
    switch (windows[idx.cur].name) {

        case "sunrise":
            STARS.alpha = 1 - now / windowDuration;
            break;

        case "sunset":
            STARS.alpha = now / windowDuration;
            break;

        case "day":
            STARS.visible = false;
            break;
    }

    // stars twinkling
    if (STARS.visible) {
        for (let i = 0; i < STAR_NUMBER; i++) {
            if (!~~(Math.random() * 40)) {
                const star = STARS.getChildAt(i);
                const originalAlpha = (SPAWN_AMPLITUDE - star.y) / SPAWN_AMPLITUDE;
                const offsetAlpha = Math.random() / 4;
                star.alpha = originalAlpha - offsetAlpha;
            }
        }
    }
}

/**
 * Updates sun colors and texture.
 *
 * @param {{now: number, start: number, end: number}} windowTimes
 * @param {{name: string, skyTexture: PIXI.Texture, start: number, brightness: number, colors: string[]}[]} windows
 * @param {{cur: number, next: number}} idx
 */
function skyUpdate(windowTimes, windows, idx) {

    // the sky takes the texture of the current window
    SKY.texture = windows[idx.cur].skyTexture;

    // saving current sky colors
    let topColor = windows[idx.cur].colors[0];
    let bottomColor = windows[idx.cur].colors[1];

    // color transition begins when the current time window has reached 98% of its progression
    const beginTransition = windowTimes.start + (windowTimes.end - windowTimes.start) * TRANSITION;

    if (windowTimes.now >= beginTransition) {
        const progress = (windowTimes.now - beginTransition) / (windowTimes.end - beginTransition);

        topColor = interpolationColor(
            windows[idx.cur].colors[0], windows[idx.next].colors[0], progress);
        bottomColor = interpolationColor(
            windows[idx.cur].colors[1], windows[idx.next].colors[1], progress);

        SKY.texture = createSkyTexture(topColor, bottomColor);
    }
}

/**
 * Updates ambiant light.
 *
 * @param {{now: number, start: number, end: number}} windowTimes
 * @param {{name: string, skyTexture: PIXI.Texture, start: number, brightness: number, colors: string[]}[]} windows
 * @param {{cur: number, next: number}} idx
 */
function luminosityUpdate(windowTimes, windows, idx) {

    FILTER.brightness(windows[idx.cur].brightness);

    const beginTransition = windowTimes.start + (windowTimes.end - windowTimes.start) * TRANSITION;

    if (windowTimes.now >= beginTransition) {
        const progress = (windowTimes.now - beginTransition) / (windowTimes.end - beginTransition);
        const dist = windows[idx.next].brightness - windows[idx.cur].brightness;
        FILTER.brightness(windows[idx.cur].brightness + dist * progress);
    }
}

/**
 * Creates a vertical gradient texture used for sky sprite.
 *
 * https://pixijs.io/examples/#/textures/gradient-basic.js
 *
 * @param {string} topColor
 * @param {string} bottomColor
 * @return {PIXI.Texture}
 */
function createSkyTexture(topColor, bottomColor) {

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grd.addColorStop(0.1, topColor);
    grd.addColorStop(0.7, bottomColor);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    return PIXI.Texture.from(canvas);
}

/**
 * Given a gradient starting with colorStart and ending with colorEnd,
 * returns the color in that gradient associated with the percentage in argument.
 *
 * https://stackoverflow.com/questions/22218140/calculate-the-color-at-a-given-point-on-a-gradient-between-two-colors
 *
 * @param {number} percentage
 * @param {string} startColor
 * @param {string} endColor
 * @return {string}
 */
function interpolationColor(startColor, endColor, percentage) {

    // gets each color components
    const colorStartComp = rgbComp(startColor);
    const colorEndComp = rgbComp(endColor);

    // processes interpolation color components
    const r = colorStartComp.r + percentage * (colorEndComp.r - colorStartComp.r);
    const g = colorStartComp.g + percentage * (colorEndComp.g - colorStartComp.g);
    const b = colorStartComp.b + percentage * (colorEndComp.b - colorStartComp.b);

    // returns the css rgb color string
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/**
 * Returns the rgb components of a css rgb color string.
 *
 * https://stackoverflow.com/questions/10970958/get-a-color-component-from-an-rgb-string-in-javascript
 *
 * @param {string} color
 * @return {{r: number, b: number, g: number}}
 */
function rgbComp(color) {
    let rgb = color.replace(/[^\d,]/g, '').split(',').map((e) => {
        return parseInt(e);
    });
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
}

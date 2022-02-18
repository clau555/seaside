// screen composition config
const sceneWidth = 256;
const sceneHeight = 144;
const seaLevel = 120;

// geographic position config
const latitude = 54;
const longitude = -6.41667;

// sky colors config
const skyColors = {
    sunrise: [ 'rgb(63, 144, 208)', 'rgb(255, 194, 117)' ],
    day: [ 'rgb(42, 207, 255)', 'rgb(181, 255, 246)' ],
    sunset: [ 'rgb(90,40,145)', 'rgb(255,162,24)' ],
    night: [ 'rgb(8, 0, 30)', 'rgb(50, 39, 119)' ],
};
const skyTextures = {
    sunrise: createSkyTexture(skyColors.sunrise[0], skyColors.sunrise[1]),
    day: createSkyTexture(skyColors.day[0], skyColors.day[1]),
    sunset: createSkyTexture(skyColors.sunset[0], skyColors.sunset[1]),
    night: createSkyTexture(skyColors.night[0], skyColors.night[1]),
};

// sky
const sky = new PIXI.Sprite(skyTextures.day);

// stars
/*const stars = [];
for (let i = 0; i < 4; i++) {
    const star = PIXI.Sprite.from('/assests/img/star.png');
    star.anchor.set(0.5);
    stars.push(star);
}*/

// sun
const sun = PIXI.Sprite.from('/assets/img/sun.png');
sun.anchor.set(0.5); // makes sun coordinates centered on its sprite

// sea
const sea = new PIXI.AnimatedSprite(['/assets/img/sea/1.png', '/assets/img/sea/2.png'].map((e) => {
    return PIXI.Texture.from(e);
}));
sea.y = seaLevel; // places sea sprite on the correct height
sea.animationSpeed = 0.02;
sea.play();

// front sprites group
const front = new PIXI.Container();
front.addChild(sea);

// front sprites luminosity
const frontBrightness = new PIXI.filters.ColorMatrixFilter();
front.filters = [frontBrightness];

// stage initialization
const app = new PIXI.Application({width: sceneWidth, height: sceneHeight});
document.body.appendChild(app.view);
app.stage.addChildAt(sky, 0);
app.stage.addChildAt(sun, 1);
app.stage.addChildAt(front, 2);

// main loop
let counter = 0;
app.ticker.add(() => {

    // getting today time and events
    const today = new Date();
    today.setTime(today.getTime() + 60000 * counter); // time speed up
    counter++;
    const events = SunCalc.getTimes(today, latitude, longitude);

    // getting tomorrow time and events
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomEvents = SunCalc.getTimes(tomorrow, latitude, longitude);

    // getting yesterday time and events
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestEvents = SunCalc.getTimes(yesterday, latitude, longitude);

    // sun angle position in the sky at different times of the day
    const sunrisePos = SunCalc.getPosition(events.sunrise, latitude, longitude);
    const noonPos = SunCalc.getPosition(events.solarNoon, latitude, longitude);
    const curPos = SunCalc.getPosition(today, latitude, longitude);

    // windows of the different phases of the day
    const windows = [
        { name: "sunrise", skyTexture: skyTextures.sunrise, colors: skyColors.sunrise, brightness: 0.6, start: events.dawn.getTime() },
        { name: "day", skyTexture: skyTextures.day, colors: skyColors.day, brightness: 1, start: events.sunriseEnd.getTime() },
        { name: "sunset", skyTexture: skyTextures.sunset, colors: skyColors.sunset, brightness: 0.6, start: events.sunsetStart.getTime() },
        { name: "night", skyTexture: skyTextures.night, colors: skyColors.night, brightness: 0.2, start: events.dusk.getTime() },
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
    sun.x = ~~(sceneWidth * ((curPos.azimuth + azimuthOffset) % (azimuthOffset * 2)) / (azimuthOffset * 2));
    sun.y = ~~(seaLevel - (seaLevel - 10) * curPos.altitude / noonPos.altitude);
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
    sky.texture = windows[idx.cur].skyTexture;

    // saving current sky colors
    let topColor = windows[idx.cur].colors[0];
    let bottomColor = windows[idx.cur].colors[1];

    // color transition begins when the current time window has reached 98% of its progression
    const beginTransition = windowTimes.start + (windowTimes.end - windowTimes.start) * 0.98;

    if (windowTimes.now >= beginTransition) {
        const progress = (windowTimes.now - beginTransition) / (windowTimes.end - beginTransition);

        topColor = interpolationColor(
            windows[idx.cur].colors[0], windows[idx.next].colors[0], progress);
        bottomColor = interpolationColor(
            windows[idx.cur].colors[1], windows[idx.next].colors[1], progress);

        sky.texture = createSkyTexture(topColor, bottomColor);
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

    frontBrightness.brightness(windows[idx.cur].brightness);

    const beginTransition = windowTimes.start + (windowTimes.end - windowTimes.start) * 0.98;

    if (windowTimes.now >= beginTransition) {
        const progress = (windowTimes.now - beginTransition) / (windowTimes.end - beginTransition);
        const dist = windows[idx.next].brightness - windows[idx.cur].brightness;
        frontBrightness.brightness(windows[idx.cur].brightness + dist * progress);
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
    canvas.width = sceneWidth;
    canvas.height = sceneHeight;

    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 0, sceneHeight);
    grd.addColorStop(0.1, topColor);
    grd.addColorStop(0.7, bottomColor);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, sceneWidth, sceneHeight);

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

/**
 * Returns the hexadecimal value of a rgb color string.
 *
 * https://stackoverflow.com/questions/13070054/convert-rgb-strings-to-hex-in-javascript
 *
 * @param {string} color
 * @return {number}
 */
function colorToHex(color) {
    let rgb = color.split('(')[1].split(')')[0];
    rgb = rgb.split(',');
    let hex = rgb.map((x) => {
        x = parseInt(x).toString(16);
        return (x.length === 1) ? '0' + x : x;
    });
    hex = hex.join('');
    return parseInt(hex, 16);
}

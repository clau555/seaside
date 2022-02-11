// screen composition config
const sceneWidth = 256;
const sceneHeight = 144;
const seaLevel = 120;

// sky colors config
const skyColors = {
    sunrise: [ hexToRgbObj('#3f90d0'), hexToRgbObj('#ffc275') ],
    day: [ hexToRgbObj('#2acfff'), hexToRgbObj('#b5fff6') ],
    sunset: [ hexToRgbObj('#c42e0c'), hexToRgbObj('#fbc903') ],
    night: [ hexToRgbObj('#08001e'), hexToRgbObj('#322777') ],
};
const skyTextures = {
    sunrise: createSkyTexture(skyColors.sunrise.map(rgbObjToString)),
    day: createSkyTexture(skyColors.day.map(rgbObjToString)),
    sunset: createSkyTexture(skyColors.sunset.map(rgbObjToString)),
    night: createSkyTexture(skyColors.night.map(rgbObjToString)),
};

// geographic position config
const latitude = 54;
const longitude = -6.41667;

// sky
const sky = new PIXI.Sprite(skyTextures.day);

// sun
const sun = PIXI.Sprite.from('/assets/img/sun.png');
sun.anchor.set(0.5); // makes sun coordinates centered on its sprite

// sea
let sea = new PIXI.AnimatedSprite(['/assets/img/sea/1.png', '/assets/img/sea/2.png'].map((e) => {
    return PIXI.Texture.from(e);
}));
sea.y = seaLevel; // places sea sprite on the correct height
sea.animationSpeed = 0.02;
sea.play();

// stage initialization
const app = new PIXI.Application({width: sceneWidth, height: sceneHeight});
document.body.appendChild(app.view);
app.stage.addChildAt(sky, 0);
app.stage.addChildAt(sun, 1);
app.stage.addChildAt(sea, 2);

// main loop
let counter = 0;
app.ticker.add(() => {

    // getting today time and events
    let today = new Date();
    today.setTime(today.getTime() + 60000 * counter); // time acceleration
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
        { skyTexture: skyTextures.sunrise, colors: skyColors.sunrise, start: events.dawn.getTime() },
        { skyTexture: skyTextures.day, colors: skyColors.day, start: events.sunriseEnd.getTime() },
        { skyTexture: skyTextures.sunset, colors: skyColors.sunset, start: events.sunsetStart.getTime() },
        { skyTexture: skyTextures.night, colors: skyColors.night, start: events.dusk.getTime() },
    ];

    // finding the current time window

    let found = false; // true when the current window has been found
    let night = false; // true if the current window is nighttime

    const idx = {
        cur: 0, // current window index
        next: 0, // next window index
    };

    const times = {
        now: today.getTime(), // current time
        start: 0, // current window starting time
        end: 0, // current window ending time
    };
    while (idx.cur < windows.length && !found) {

        idx.next = (idx.cur + 1) % windows.length; // loops through the array
        times.start = windows[idx.cur].start;
        times.end = windows[idx.next].start;
        night = idx.cur + 1 === windows.length;

        // at night, the window can end on tomorrow's dawn
        // and begin on yesterday's sunset
        let hour = today.getHours();
        if (night && (hour > 12 || hour < 1)) {
            times.end = tomEvents.dawn.getTime();
        } else if (night) {
            times.start = yestEvents.sunset.getTime();
        }
        if (times.start <= times.now && times.now < times.end) {
            found = true;
        }
        idx.cur++;
    }
    idx.cur--;

    // canvas elements updates
    sunUpdate(curPos, sunrisePos, noonPos);
    skyUpdate(windows, idx, times);
    randomShootingStars(night);
});

/**
 * Updates sun sprite position on screen according to real time sun position.
 * @param {Object} curPos
 * @param {Object} sunrisePos
 * @param {Object} noonPos
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
 * @param {Object} windows
 * @param {Object} idx
 * @param {Object} times
 */
function skyUpdate(windows, idx, times) {

    // the sky takes the texture of the current window
    sky.texture = windows[idx.cur].skyTexture;

    // color transition begins when the current time window has reached 98% of its progression
    const beginTransition = times.start + (times.end - times.start) * 0.98;

    if (times.now >= beginTransition) {
        const progress = (times.now - beginTransition) / (times.end - beginTransition);

        const color1 = interpolationColorStr(
            progress, windows[idx.cur].colors[0], windows[idx.next].colors[0]
        );
        const color2 = interpolationColorStr(
            progress, windows[idx.cur].colors[1], windows[idx.next].colors[1]
        );
        sky.texture = createSkyTexture([color1, color2]);
    }
}

function randomShootingStars(night) {
}

/**
 * https://pixijs.io/examples/#/textures/gradient-basic.js
 * @param {Array<string>} colorsStr
 * @return {PIXI.Texture}
 */
function createSkyTexture(colorsStr) {
    const canvas = document.createElement('canvas');
    canvas.width = sceneWidth;
    canvas.height = sceneHeight;

    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 0, sceneHeight);
    grd.addColorStop(0.1, colorsStr[0]);
    grd.addColorStop(0.7, colorsStr[1]);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, sceneWidth, sceneHeight);

    return PIXI.Texture.from(canvas);
}

/**
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param {string} hexStr
 * @return {{r: number, b: number, g: number}}
 */
function hexToRgbObj(hexStr) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexStr);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
    } else {
        throw new Error("can't parse hex data");
    }
}

/**
 * https://stackoverflow.com/questions/22218140/calculate-the-color-at-a-given-point-on-a-gradient-between-two-colors
 * @param {number} percent
 * @param {{r: number, b: number, g: number}} colorStart
 * @param {{r: number, b: number, g: number}} colorEnd
 * @return {string}
 */
function interpolationColorStr(percent, colorStart, colorEnd) {
    const r = colorStart.r + percent * (colorEnd.r - colorStart.r);
    const g = colorStart.g + percent * (colorEnd.g - colorStart.g);
    const b = colorStart.b + percent * (colorEnd.b - colorStart.b);
    return rgbObjToString({ r: r, g: g, b: b });
}

/**
 * Returns the css string of a rgb color object.
 * @param {{r: number, b: number, g: number}} color
 * @return {string}
 */
function rgbObjToString(color) {
    return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}

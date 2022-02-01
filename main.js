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

// sprites
const sky = new PIXI.Sprite(skyTextures.day);
const sun = PIXI.Sprite.from('/assets/img/sun.png');
const sea = PIXI.Sprite.from('/assets/img/sea.png');
sun.anchor.set(0.5); // makes sun coordinates centered on its sprite
sea.y = seaLevel; // places sea sprite on the correct height

// stage initialization
const app = new PIXI.Application({width: sceneWidth, height: sceneHeight});
document.body.appendChild(app.view);
app.stage.addChildAt(sky, 0);
app.stage.addChildAt(sun, 1);
app.stage.addChildAt(sea, 2);

// main loop
let counter = 0;
app.ticker.add(() => {
    let today = new Date();
    today.setTime(today.getTime() + 60000 * counter);
    counter++;
    const times = SunCalc.getTimes(today, latitude, longitude); // today's events

    // sun angle position in the sky at different times of the day
    const sunrisePos = SunCalc.getPosition(times.sunrise, latitude, longitude);
    const noonPos = SunCalc.getPosition(times.solarNoon, latitude, longitude);
    const curPos = SunCalc.getPosition(today, latitude, longitude);

    const timeWindows = [
        { skyTexture: skyTextures.sunrise, colors: skyColors.sunrise, start: times.dawn.getTime() },
        { skyTexture: skyTextures.day, colors: skyColors.day, start: times.sunriseEnd.getTime() },
        { skyTexture: skyTextures.sunset, colors: skyColors.sunset, start: times.sunsetStart.getTime() },
        { skyTexture: skyTextures.night, colors: skyColors.night, start: times.sunset.getTime() },
    ];

    sunUpdate(curPos, sunrisePos, noonPos);
    skyUpdate(today, timeWindows);
});

/**
 * Updates sun sprite position on screen according to real time sun position.
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
 */
function skyUpdate(today, timeWindows) {
    const now = today.getTime();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = SunCalc.getTimes(tomorrow, latitude, longitude);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimes = SunCalc.getTimes(yesterday, latitude, longitude);

    for (let i = 0; i < timeWindows.length; i++) {
        const j = (i + 1) % timeWindows.length; // next index, loops through the array

        let start = timeWindows[i].start;
        let end = timeWindows[j].start;

        // if at night, the window ends on tomorrow's dawn
        let night = i + 1 === timeWindows.length;
        if (night && today.getHours() > 12) {
            end = tomorrowTimes.dawn.getTime();
        } else if (night && today.getHours() <= 12) {
            start = yesterdayTimes.sunset.getTime();
        }

        if (start <= now && now < end) {
            sky.texture = timeWindows[i].skyTexture;

            // color transition begins when the current time window has reached 98% of its progression
            const beginTransition = start + (end - start) * 0.98;
            if (now >= beginTransition) {
                const progress = (now - beginTransition) / (end - beginTransition);
                const color1 = getInterpolationColorStr(progress, timeWindows[i].colors[0], timeWindows[j].colors[0]);
                const color2 = getInterpolationColorStr(progress, timeWindows[i].colors[1], timeWindows[j].colors[1]);
                sky.texture = createSkyTexture([color1, color2]);
            }
        }
    }
}

// https://pixijs.io/examples/#/textures/gradient-basic.js
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

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
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

// https://stackoverflow.com/questions/22218140/calculate-the-color-at-a-given-point-on-a-gradient-between-two-colors
function getInterpolationColorStr(percent, colorStart, colorEnd) {
    const r = colorStart.r + percent * (colorEnd.r - colorStart.r);
    const g = colorStart.g + percent * (colorEnd.g - colorStart.g);
    const b = colorStart.b + percent * (colorEnd.b - colorStart.b);
    return rgbObjToString({ r: r, g: g, b: b });
}

function rgbObjToString(color) {
    return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}

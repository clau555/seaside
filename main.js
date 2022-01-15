const sceneWidth = 256;
const sceneHeight = 144;
const seaLevel = 120;
const noonAngle = 5;

let latitude = 48.85341;
let longitude =  2.3488;

const skyColors = {
    sunrise: ['#4291d0', '#FDC274'],
    day: ['#29CFFF', '#FFFFFF'],
    sunset: ['#BD242B', '#fbc903'],
    night: ['#08001F', '#120054'],
};

const sunriseText = createSkyTexture(skyColors.sunrise);
const dayText = createSkyTexture(skyColors.day);
const sunsetText = createSkyTexture(skyColors.sunset);
const nightText = createSkyTexture(skyColors.night);

const app = new PIXI.Application({width: sceneWidth, height: sceneHeight});
document.body.appendChild(app.view);

// sprites
const sky = new PIXI.Sprite(dayText);
const sun = PIXI.Sprite.from('/assets/img/sun.png');
const sea = PIXI.Sprite.from('/assets/img/sea.png');
sun.anchor.set(0.5);
sea.y = seaLevel;
app.stage.addChildAt(sky, 0);
app.stage.addChildAt(sun, 1);
app.stage.addChildAt(sea, 2);

//  main loop
app.ticker.add(() => {
    const curDate = new Date();

    const times = SunCalc.getTimes(curDate, latitude, longitude);

    const sunrisePos = SunCalc.getPosition(times.sunrise, latitude, longitude);
    const noonPos = SunCalc.getPosition(times.solarNoon, latitude, longitude);
    const curPos = SunCalc.getPosition(curDate, latitude, longitude);

    sunUpdate(curPos, sunrisePos, noonPos);
    skyUpdate(curDate, times);
});

function sunUpdate(curPos, sunrisePos, noonPos) {
    const azimuthOffset = Math.abs(sunrisePos.azimuth) + 0.1;
    sun.x = ~~(sceneWidth * ((curPos.azimuth + azimuthOffset) % (azimuthOffset * 2)) / (azimuthOffset * 2));
    sun.y = ~~(seaLevel - (seaLevel - 10) * curPos.altitude / noonPos.altitude);
}

function skyUpdate(todayDate) {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(todayDate.getDate() + 1);

    const todayTimes = SunCalc.getTimes(todayDate, latitude, longitude);
    const tomorrowTimes = SunCalc.getTimes(tomorrowDate, latitude, longitude);

    const timeWindows = [
        {texture: sunriseText, start: todayTimes.sunrise.getTime(), end: todayTimes.sunriseEnd.getTime()},
        {texture: dayText, start: todayTimes.sunriseEnd.getTime(), end: todayTimes.sunsetStart.getTime()},
        {texture: sunsetText, start: todayTimes.sunsetStart.getTime(), end: todayTimes.sunset.getTime()},
        {texture: nightText, start: todayTimes.sunset.getTime(), end: tomorrowTimes.dawn.getTime()},
    ];

    const now = todayDate.getTime();

    for (let timeWindow of timeWindows) {
        if (now >= timeWindow.start && now < timeWindow.end) {
            //const prog = (timeWindow.end - timeWindow.start) / (now - timeWindow.start);
            sky.texture = timeWindow.texture;
        }
    }
}

// https://pixijs.io/examples/#/textures/gradient-basic.js
function createSkyTexture(colors) {
    const canvas = document.createElement('canvas');
    canvas.width = sceneWidth;
    canvas.height = sceneHeight;

    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 0, sceneHeight);
    grd.addColorStop(0.1, colors[0]);
    grd.addColorStop(0.7, colors[1]);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, sceneWidth, sceneHeight);

    return PIXI.Texture.from(canvas);
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// https://stackoverflow.com/questions/22218140/calculate-the-color-at-a-given-point-on-a-gradient-between-two-colors
function getInterpolationColor(percent, color1, color2) {
    const r = color1.r + percent * (color2.r - color1.r);
    const g = color1.g + percent * (color2.g - color1.g);
    const b = color1.b + percent * (color2.b - color1.b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

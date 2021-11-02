// CONSTANTS

const sceneWidth = 256;
const sceneHeight = 144;
const seaLevel = 130;
const noonAngle = 5;

const latitude = 48.85341;
const longitude =  2.3488;

const times = {
    DAY: "day",
    NOON: "noon",
    NIGHT: "night"
};
let time = times.DAY;

const urls = {
    skyDay: "/assets/img/sky_day.png",
    skyNoon: "/assets/img/sky_noon.png",
    skyNight: "/assets/img/sky_night.png",
    sun: "/assets/img/sun.png",
    sea: "/assets/img/sea.png"
};


// FUNCTIONS

function createLayer(stage) {
    const layer = new Konva.Layer();
    layer.imageSmoothingEnabled(false);
    stage.add(layer);
    return layer;
}

function radianToDegree(angle) {
    return angle * 180 / Math.PI;
}

function loadImages(urls, callback) {
    const images = {};
    const numImages = Object.keys(urls).length;
    let loadedImages = 0;

    for (let urlKey in urls) {

        // creating new image
        let image = new Image();
        image.src = urls[urlKey];
        image.onload = () => {
            loadedImages++;
            if (loadedImages >= numImages) {
                callback(images);
            }
        };

        // adding it to the document
        images[urlKey] = image;
    }
}

// main function, called when all images are loaded
function buildStage(images) {

    // layers
    const backLayer = createLayer(stage);
    const frontLayer = createLayer(stage);

    // sky
    const sky = new Konva.Image({
        image: images.skyDay,
    });

    // sun
    const sun = new Konva.Image({
        image: images.sun,
    });

    // sea
    const sea = new Konva.Image({
        image: images.sea,
        y: seaLevel,
    });

    backLayer.add(sky);
    frontLayer.add(sun);
    frontLayer.add(sea);

    //TODO sky animations (tween can't work)

    // sun animation
    const sunAnimation = new Konva.Animation(() => {
        const position = SunCalc.getPosition(new Date(), latitude, longitude);
        const azimuth = radianToDegree(position.azimuth);
        const altitude = radianToDegree(position.altitude);

        // period of the day depending on sun altitude angle
        if (altitude > noonAngle) {
            time = times.DAY;
        } else if (altitude < -noonAngle) {
            time = times.NIGHT;
        } else {
            time = times.NOON;
        }

        // invisible at night (avoid seeing sun flare at night)
        if (time === times.NIGHT) {
            sun.opacity(0);
        } else {
            sun.opacity(1);
        }

        // screen position update
        sun.x(sceneWidth / 2 - sun.width() / 2); //TODO horizontal translation
        sun.y(~~(seaLevel - altitude * seaLevel / 90) - sun.height() / 2);

    }, frontLayer);
    sunAnimation.start();

    backLayer.draw();
    frontLayer.draw();
    resizeUpdate();
}


// INITIALIZATION

const stage = new Konva.Stage({
    container: "container",
    width: sceneWidth,
    height: sceneHeight
});

loadImages(urls, buildStage);


// EVENTS

function resizeUpdate() {
    let container = document.querySelector("#container");

    // scale the canvas properly
    let scale = container.clientHeight / sceneHeight;
    stage.height(sceneHeight * scale);
    stage.width(sceneWidth * scale);
    stage.scale({x: scale, y: scale});

    // keep the canvas centered
    let offset;
    if (stage.width() > window.innerWidth) {
        offset = (stage.width() - window.innerWidth) / -2;
    } else {
        offset = (window.innerWidth - stage.width()) / 2;
    }
    container.style.left = offset.toString() + "px";
}

window.addEventListener("resize", () => {
    resizeUpdate();
});

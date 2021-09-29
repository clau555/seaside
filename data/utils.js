class Utils {

    static getSunAltitudeDegree() {
        const position = SunCalc.getPosition(new Date(), Config.lat, Config.long);
        return position.altitude * (180 / Math.PI);
    }

    static clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

}

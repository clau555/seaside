class Utils {

    static getSunAltitudeDegree() {
        const position = SunCalc.getPosition(new Date(), Config.lat, Config.long);
        return position.altitude * (180 / Math.PI);
    }

    static isInsideRect(x, y, rect) {
        return rect.x <= x && x <= rect.x + rect.w
            && rect.y <= y && y <= rect.y + rect.h;
    }

    static isInsideCanvas(x, y) {
        return 0  <= x && x <= Constants.WIDTH
            && 0 <= y && y <= Constants.HEIGHT;
    }

    static isRectInsideCanvas(x, y, w, h) {
        return (0  <= x && x <= Constants.WIDTH) || (0 <= x + w && x + w <= Constants.WIDTH)
            || (0 <= y && y <= Constants.HEIGHT) || (0 <= y + h && y + h <= Constants.HEIGHT);
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

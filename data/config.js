class Config {
    static DEFAULTLAT = 48.85341;
    static DEFAULTLONG = 2.3488;

    static positionId;
    static lat = Config.DEFAULTLAT;
    static long = Config.DEFAULTLONG;
    static positionSet = false;

    static audio = new Audio("assets/sea-waves.wav");

    static toggleVolume() {
        Config.audio.volume = Config.audio.volume === 0 ? Constants.VOLUME : 0;
        return Boolean(Config.audio.volume);
    }

    static setPosition(successCallback, errorCallback) {
        Config.positionId = navigator.geolocation.watchPosition(
            (pos) => {
                Config.lat = pos.coords.latitude;
                Config.long = pos.coords.longitude;
                navigator.geolocation.clearWatch(Config.positionId);
                successCallback();
            },
            () => {
                errorCallback();
            });
        Config.positionSet = true;
    }
}

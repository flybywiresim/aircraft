class City {
    constructor() {
        this.size = 2;
    }
    toString() {
        return "[" + this.name + "] " + fastToFixed(this.lat, 5) + ":" + fastToFixed(this.long, 6);
    }
}
//# sourceMappingURL=City.js.map
class SvgCityManager {
    constructor(map) {
        this.map = map;
        this.displayedCities = [];
        this._iterator = 0;
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    this.cities = JSON.parse(request.responseText);
                }
            }
        };
        request.open("GET", "/Pages/VCockpit/Instruments/Shared/Map/Cities/cities.json?_=" + new Date().getTime());
        request.send();
    }
    update() {
        if (this.cities) {
            let l = this.cities.cities.length;
            let bottomLeft = this.map.bottomLeftCoordinates;
            let topRight = this.map.topRightCoordinates;
            let i = 0;
            let t0 = performance.now();
            while (i++ < l && (performance.now() - t0) < 0.1) {
                this._iterator = (this._iterator + 1) % l;
                let city = this.cities.cities[this._iterator];
                if (city.lat > bottomLeft.lat) {
                    if (city.lat < topRight.lat) {
                        if (city.long > bottomLeft.long) {
                            if (city.long < topRight.long) {
                                let found = this.displayedCities.find((c) => { return c.name === city.name; });
                                if (!found) {
                                    let svgCityElement = new SvgCityElement();
                                    svgCityElement.name = city.name.replace("'", "");
                                    svgCityElement.lat = city.lat;
                                    svgCityElement.long = city.long;
                                    svgCityElement.size = city.size;
                                    svgCityElement.onDrawOutOfFrame = () => {
                                        let index = this.displayedCities.indexOf(svgCityElement);
                                        if (index !== -1) {
                                            this.displayedCities.splice(index, 1);
                                        }
                                    };
                                    this.displayedCities.push(svgCityElement);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=SvgCityManager.js.map
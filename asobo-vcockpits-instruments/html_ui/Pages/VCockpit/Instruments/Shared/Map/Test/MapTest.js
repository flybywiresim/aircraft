class SortedListElement {
    constructor(age, name) {
        this.age = age;
        this.name = name;
    }
    compare(other) {
        if (this.age < other.age) {
            return -1;
        }
        if (this.age === other.age) {
            if (this.name < other.name) {
                return -1;
            }
            if (this.name === other.name) {
                return 0;
            }
            return 1;
        }
        return 1;
    }
    clone() {
        return new SortedListElement(this.age, this.name);
    }
}
class MapTest extends ISvgMapRootElement {
    get templateID() { return "MapTest"; }
    connectedCallback() {
        super.connectedCallback();
        this.Test1();
    }
    Test1() {
        let l = 100000;
        let all = [];
        for (let i = 0; i < l; i++) {
            all.push(new SortedListElement(Math.floor(Math.random() * 100), this.RandomLetter() + this.RandomLetter() + this.RandomLetter()));
        }
        let list = [];
        let sortedList = new SortedList();
        let t0 = performance.now();
        for (let i = 0; i < l; i++) {
            sortedList.add(all[i]);
        }
        console.log((performance.now() - t0).toFixed(2) + " ms with SortedList<T> " + sortedList.length + " elements added.");
        let t1 = performance.now();
        for (let i = 0; i < l; i++) {
            let newElement = all[i];
            if (!list.find(e => { return e.compare(newElement) === 0; })) {
                list.push(newElement);
            }
        }
        console.log((performance.now() - t1).toFixed(2) + " ms with [] " + list.length + " elements added.");
        let map = new SvgMap(this, { svgElementId: "pouet-pouet" });
        let bodAirport = new SvgNearestAirportElement();
        bodAirport.coordinates = new LatLongAlt(44.8305935, -0.7124992);
        let lonLat = new SvgLatLonElement();
        let zizAirport = new SvgNearestAirportElement();
        zizAirport.ident = "ZIZ";
        zizAirport.bearing = 0;
        zizAirport.distance = 10;
        map.mapElements = [lonLat];
        let targetNmWidth = Math.random() * 1000 + 0.1;
        setInterval(() => {
            map.update();
            map.NMWidth *= 19 / 20;
            map.NMWidth += targetNmWidth / 20;
        }, 50);
        setInterval(() => {
            targetNmWidth = Math.pow(2, Math.random() * 16) + 0.1;
        }, 5000);
        return map;
    }
    RandomLetter() {
        return MapTest.Alphabet[Math.floor(Math.random() * 26)];
    }
    getWidth() {
        return this.clientWidth;
    }
    getHeight() {
        return this.clientHeight;
    }
    onBeforeMapRedraw() {
    }
}
MapTest.Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
window.customElements.define("map-test", MapTest);
//# sourceMappingURL=MapTest.js.map
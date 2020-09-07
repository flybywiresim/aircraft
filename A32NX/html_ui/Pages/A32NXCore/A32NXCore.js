class A32NXCore {
    constructor() {
        console.log('A32NXCore constructed');
    }
    init() {
        console.log('A32NXCore init');
        this.flag = true;
    }
    update(deltaTime) {
        if (this.flag) {
            console.log('A32NXCore first update! ' + deltaTime);
            this.flag = false;
        }
    }
}

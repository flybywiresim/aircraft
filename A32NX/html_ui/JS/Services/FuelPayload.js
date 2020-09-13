class PayloadValue extends RangeDataValue {
    constructor() {
        super(...arguments);
        this.__Type = "PayloadValue";
    }
}
class ContactPoint {
}
class FuelPayloadData {
}
class BalanceData {
}
class ShapeData {
}
class FuelPayloadListener extends ViewListener.ViewListener {
    constructor(name) {
        super(name);
    }
    onFuelPayloadDataUpdated(callback) {
        this.on("SetFuelPayloadData", callback);
    }
    onBalanceDataUpdated(callback) {
        this.on("SetBalanceData", callback);
    }
    onShapeDataUpdated(callback) {
        this.on("SetShapeData", callback);
    }
    resetFuelPayload() {
        this.trigger("FUEL_RESET");
    }
}
function RegisterFuelPayloadListener(callback) {
    return RegisterViewListenerT("JS_LISTENER_FUEL_PAYLOAD", callback, FuelPayloadListener);
}
checkAutoload();

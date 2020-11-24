class DataReadMetaManager {
    constructor() {
        this.managerList = [];
    }
    UpdateAll() {
        for (let i = 0; i < this.managerList.length; i++) {
            this.managerList[i].Update();
        }
    }
    RegisterManager(_Manager) {
        this.managerList.push(_Manager);
    }
}
class DataReadManager {
    constructor(_metaManager) {
        this.registered = false;
        this.waitingForUpdate = [];
        this.metaManager = _metaManager;
    }
    Update() {
        this.Register();
        if (this.waitingForUpdate.length > 0 && this.waitingForUpdate[0].IsUpToDate()) {
            this.waitingForUpdate.shift().EndLoad();
        }
        if (this.waitingForUpdate.length > 0) {
            this.waitingForUpdate[0].LoadData();
        }
    }
    AddToQueue(_Getter) {
        this.Register();
        if (this.waitingForUpdate.lastIndexOf(_Getter) == -1) {
            this.waitingForUpdate.push(_Getter);
            return true;
        }
        return false;
    }
    Register() {
        if (!this.registered && this.metaManager) {
            try {
                this.metaManager.RegisterManager(this);
                this.registered = true;
            } catch (Error) {
                this.registered = false;
            }
        }
    }
}
class InstrumentDataReadManager {
    constructor() {
        this.array = new Array();
    }
    AddToQueue(_instrument, _Getter) {
        if (_instrument == undefined) {
            console.error("Trying to push a Null Instrument to DataReadManager");
        }
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i].metaManager == _instrument.dataMetaManager) {
                return this.array[i].AddToQueue(_Getter);
            }
        }
        const readManager = new DataReadManager(_instrument.dataMetaManager);
        this.array.push(readManager);
        return readManager.AddToQueue(_Getter);
    }
}
//# sourceMappingURL=DataReadManager.js.map
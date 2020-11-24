class Message {
    SetAirspaceMessageType(_airspaceMsgType) {
        this.airspaceMessageType = _airspaceMsgType;
        switch (this.airspaceMessageType) {
            case 0:
                this.message = "";
                break;
            case 1:
                this.message = "Near airspace less than 2nm";
                break;
            case 2:
                this.message = "Airpsace ahead -- less than 10 minutes";
                break;
            case 3:
                this.message = "Airspace near and ahead";
                break;
            case 4:
                this.message = "Inside airspace";
                break;
        }
    }
}
class MessageList {
    constructor(_instrument) {
        this.messages = [];
        this.instrument = _instrument;
        this.haveNewMessages = false;
        this.batch = new SimVar.SimVarBatch("C:fs9gps:MessageItemsNumber", "C:fs9gps:MessageCurrentLine");
        this.batch.add("C:fs9gps:MessageCurrentType", "number", "number");
    }
    Update() {
        if (MessageList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
        }
        this.haveNewMessages = (SimVar.GetSimVarValue("C:fs9gps:NewMessagesNumber", "number") > 0);
    }
    SetNewMessagesRead() {
        SimVar.SetSimVarValue("C:fs9gps:NewMessagesConfirm", "number", 0);
    }
    LoadData() {
        switch (this.loadState) {
            case 0:
                SimVar.GetSimVarArrayValues(this.batch, function (_values) {
                    for (let i = 0; i < _values.length; i++) {
                        const message = new Message();
                        message.SetAirspaceMessageType(_values[i][0]);
                        this.loadState++;
                    }
                }.bind(this));
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 2;
    }
    EndLoad() {
    }
}
MessageList.readManager = new InstrumentDataReadManager();
//# sourceMappingURL=Messages.js.map
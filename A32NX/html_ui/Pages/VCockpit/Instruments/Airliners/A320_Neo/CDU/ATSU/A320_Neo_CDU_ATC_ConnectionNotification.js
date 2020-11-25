class CDUAtcConnectionNotification {
    static ShowPage(mcdu, store = {"returnMsg": ""}) {
        mcdu.clearDisplay();
        let canNotify = "";
        let flightNo = "______[color]green";
        let connectCtrField = mcdu._cpdlcAtcCenter;

        if (mcdu._cpdlcAtcCenter != "") {
            connectCtrField = mcdu._cpdlcAtcCenter + "[color]green";
            canNotify = "*";
        } else {
            connectCtrField = "____[color]red";
            canNotify = "\xa0";
        }
        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }

        mcdu.setTemplate([
            ["NOTIFICATION"],
            ["ATC FLT NBR"],
            [flightNo],
            ["ATC CENTER"],
            [connectCtrField, "NOTIFY" + canNotify + "[color]blue"],
            [""],
            [""],
            [""],
            ["\xa0\xa0" + store["returnMsg"]],
            [""],
            [""],
            ["ATC MENU", "CONNECTION"],
            ["<RETURN", "STATUS>"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value != "") {
                mcdu._cpdlcAtcCenter = value;
            }
            CDUAtcConnectionNotification.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (mcdu._cpdlcAtcCenter != "") {
                store["returnMsg"] = mcdu._cpdlcAtcCenter + " NOTIFIED[color]green";
            } else {
                store["returnMsg"] = "INVALID ENTRY";
            }
            CDUAtcConnectionNotification.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionStatus.ShowPage(mcdu);
        };
    }
}

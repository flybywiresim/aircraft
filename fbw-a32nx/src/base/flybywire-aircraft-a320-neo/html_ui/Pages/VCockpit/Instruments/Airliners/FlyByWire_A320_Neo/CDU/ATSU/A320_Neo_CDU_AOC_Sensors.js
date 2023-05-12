class CDUAocSensors {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCSensors;

        const message = mcdu.atsu.getAocSensorsMessage();
        let state = "----";
        let strut = "----";
        let brake = "----";
        let latitude = "----";
        let longitude = "----";
        let altitude = "----";
        let speed = "----";
        let fob = "----";
        let print = "{cyan}PRINT\xa0{end}"

        if (message !== null) {
            switch (message.OooiState) {
            case AtsuCommon.OooiState.OutGate:
                state = '{green}OUT{end}';
                break;
            case AtsuCommon.OooiState.OffGround:
                state = '{green}OFF{end}';
                break;
            case AtsuCommon.OooiState.InGate:
                state = '{green}IN{end}';
                break;
            case AtsuCommon.OooiState.OnGround:
                state = '{green}ON{end}';
                break;
            default:
                break;
            }

            if (message.NoseGearDown === true) {
                strut = "{green}ON GND{end}";
            } else {
                strut = "{green}IN AIR{end}";
            }
            if (message.ParkingBrakeSet === true) {
                brake = "{green}SET{end}";
            } else {
                brake = "{green}RLSD{end}";
            }
            if (message.Latitude !== undefined) {
                latitude = `{green}${Number(message.Latitude).toFixed(4).toString()}{end}`;
            }
            if (message.Longitude !== undefined) {
                longitude = `{green}${Number(message.Longitude).toFixed(4).toString()}{end}`;
            }
            if (message.Altitude !== undefined) {
                altitude = `{green}${Math.round(message.Altitude).toString()}{end}`;
            }
            if (message.GroundSpeed !== undefined) {
                speed = `{green}${message.GroundSpeed.toString()}{end}`;
            }

            fob = `{green}${Number(message.FuelOnBoard).toFixed(1).toString()}{end}`;
            print = "{cyan}PRINT*{end}";
        }

        mcdu.setTemplate([
            ["AOC SENSORS"],
            ["OOOI", state],
            ["{small}NOSE STRUT{end}", `{small}${strut}{end}`],
            ["PARKING BRAKE", brake],
            ["{small}LATITUDE{end}", `{small}${latitude}{end}`],
            ["LONGITUDE", longitude],
            ["{small}ALTITUDE{end}", `{small}${altitude}{end}`],
            ["GROUND SPEED", speed],
            ["{small}FOB{end}", `{small}${fob}{end}`],
            [""],
            [""],
            ["\xa0RETURN TO"],
            ["<AOC MENU", print]
        ]);

        // regular update due to showing dynamic data on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.AOCSensors) {
                CDUAocSensors.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Medium);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            const message = mcdu.atsu.getAocSensorsMessage();
            if (message !== null) {
                mcdu.atsu.printMessage(message);
            }
        };
    }
}

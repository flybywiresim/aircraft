class CDUAocOOOI {
    static ShowPage(mcdu, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOooi;

        let outTime = "{small}{cyan}*--:--{end}{end}";
        let outFuel = "{small}{cyan}---.-*{end}{end}";
        let outIcao = "\xa0\xa0\xa0\xa0";
        let offTime = "{small}{cyan}*--:--{end}{end}";
        let offFuel = "{small}{cyan}---.-*{end}{end}";
        let onTime = "{small}{cyan}*--:--{end}{end}";
        let onFuel = "{small}{cyan}---.-*{end}{end}";
        let inTime = "{small}{cyan}*--:--{end}{end}";
        let inFuel = "{small}{cyan}---.-*{end}{end}";
        let inIcao = "\xa0\xa0\xa0\xa0";

        const messages = mcdu.atsu.getAocOooiMessages();
        if (messages.length > offset) {
            if (messages[offset].OutGate.timestamp !== null) {
                outTime = `{small}{green}\xa0${messages[offset].OutGate.timestamp.mailboxTimestamp()}{end}{end}`;
                outFuel = `{small}{green}${Number(messages[offset].OutGate.fuel).toFixed(1).toString()}\xa0{end}{end}`;
            }
            if (messages[offset].OutGate.icao !== '') {
                outIcao = `{green}${messages[offset].OutGate.icao}{end}`;
            }

            if (messages[offset].OffGround.timestamp !== null) {
                offTime = `{small}{green}\xa0${messages[offset].OffGround.timestamp.mailboxTimestamp()}{end}{end}`;
                offFuel = `{small}{green}${Number(messages[offset].OffGround.fuel).toFixed(1).toString()}\xa0{end}{end}`;
            }

            if (messages[offset].OnGround.timestamp !== null) {
                onTime = `{small}{green}\xa0${messages[offset].OnGround.timestamp.mailboxTimestamp()}{end}{end}`;
                onFuel = `{small}{green}${Number(messages[offset].OnGround.fuel).toFixed(1).toString()}\xa0{end}{end}`;
            }

            if (messages[offset].InGate.timestamp !== null) {
                inTime = `{small}{green}\xa0${messages[offset].InGate.timestamp.mailboxTimestamp()}{end}{end}`;
                inFuel = `{small}{green}${Number(messages[offset].InGate.fuel).toFixed(1).toString()}\xa0{end}{end}`;
            }
            if (messages[offset].InGate.icao !== '') {
                inIcao = `{green}${messages[offset].InGate.icao}{end}`;
            }
        }

        mcdu.setTemplate([
            ["AOC OOOI", (offset + 1).toString(), "3"],
            ["TIME", "FUEL"],
            [outTime, outFuel, `{small}OUT\xa0${outIcao}\xa0\xa0{end}`],
            ["", ""],
            [offTime, offFuel, "{small}OFF\xa0\xa0\xa0\xa0\xa0\xa0\xa0{end}"],
            ["", ""],
            [onTime, onFuel, "{small}ON\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0{end}"],
            ["", ""],
            [inTime, inFuel, `{small}IN\xa0\xa0${inIcao}\xa0\xa0{end}`],
            [""],
            [""],
            ["\xa0RETURN TO"],
            ["<AOC MENU"]
        ]);

        // regular update due to showing dynamic data on this page
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.AOCOooi) {
                CDUAocOOOI.ShowPage(mcdu, offset);
            }
        }, mcdu.PageTimeout.Medium);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            if (offset > 0) {
                CDUAocOOOI.ShowPage(mcdu, offset - 1);
            }
        };
        mcdu.onNextPage = () => {
            if (offset < 2) {
                CDUAocOOOI.ShowPage(mcdu, offset + 1);
            }
        };
    }
}

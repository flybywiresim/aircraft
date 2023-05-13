class CDUAocOOOI {
    static TimestampToString(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    static ShowPage(mcdu, offset = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOooi;

        let outTime = "{cyan}*--:--{end}";
        let outFuel = "{cyan}---.-*{end}";
        let outIcao = "\xa0\xa0\xa0\xa0";
        let offTime = "{cyan}*--:--{end}";
        let offFuel = "{cyan}---.-*{end}";
        let onTime = "{cyan}*--:--{end}";
        let onFuel = "{cyan}---.-*{end}";
        let inTime = "{cyan}*--:--{end}";
        let inFuel = "{cyan}---.-*{end}";
        let inIcao = "\xa0\xa0\xa0\xa0";

        const messages = mcdu.atsu.getAocOooiMessages();
        if (messages.length > offset) {
            if (messages[offset].OutGate.timestamp !== null) {
                outTime = `{green}\xa0${CDUAocOOOI.TimestampToString(messages[offset].OutGate.timestamp.Seconds)}{end}`;
                outFuel = `{green}${Number(messages[offset].OutGate.fuel).toFixed(1).toString()}\xa0{end}`;
            }
            if (messages[offset].OutGate.icao !== '') {
                outIcao = `{green}${messages[offset].OutGate.icao}{end}`;
            }

            if (messages[offset].OffGround.timestamp !== null) {
                offTime = `{green}\xa0${CDUAocOOOI.TimestampToString(messages[offset].OffGround.timestamp.Seconds)}{end}`;
                offFuel = `{green}${Number(messages[offset].OffGround.fuel).toFixed(1).toString()}\xa0{end}`;
            }

            if (messages[offset].OnGround.timestamp !== null) {
                onTime = `{green}\xa0${CDUAocOOOI.TimestampToString(messages[offset].OnGround.timestamp.Seconds)}{end}`;
                onFuel = `{green}${Number(messages[offset].OnGround.fuel).toFixed(1).toString()}\xa0{end}`;
            }

            if (messages[offset].InGate.timestamp !== null) {
                inTime = `{green}\xa0${CDUAocOOOI.TimestampToString(messages[offset].InGate.timestamp.Seconds)}{end}`;
                inFuel = `{green}${Number(messages[offset].InGate.fuel).toFixed(1).toString()}\xa0{end}`;
            }
            if (messages[offset].InGate.icao !== '') {
                inIcao = `{green}${messages[offset].InGate.icao}{end}`;
            }
        }

        mcdu.setTemplate([
            ["AOC OOOI", (offset + 1).toString(), "3"],
            ["TIME", "FUEL"],
            [outTime, outFuel, `{small}OUT\xa0\xa0\xa0${outIcao}{end}`],
            ["", ""],
            [offTime, offFuel, "{small}OFF\xa0\xa0\xa0\xa0\xa0\xa0\xa0{end}"],
            ["", ""],
            [onTime, onFuel, "{small}ON\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0{end}"],
            ["", ""],
            [inTime, inFuel, `{small}IN\xa0\xa0\xa0\xa0${inIcao}{end}`],
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

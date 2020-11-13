class CDUAocInitRoute {
    static ShowPage(mcdu, store = {offset: 0}) {
        mcdu.clearDisplay();
        mcdu.page.Current = "";
        mcdu.activeSystem = 'ATSU';

        const rows = [["----"]];
        const subRows = [["VIA"]];

        const offset = store["offset"];

        const fltNbr = `${mcdu.simbrief.icao_airline}${mcdu.simbrief.flight_number}`;

        getAllRows();

        const display = [
            ["ROUTE {small}FOR {end}{green}" + fltNbr + "{end}"],
            subRows[0 + offset],
            rows[0 + offset],
            subRows[1 + offset],
            rows[1 + offset],
            subRows[2 + offset],
            rows[2 + offset],
            subRows[3 + offset],
            rows[3 + offset],
            subRows[4 + offset],
            rows[4 + offset],
            [""],
            ["<RETURN", "INSERT*[color]red"]
        ];
        mcdu.setTemplate(display);

        mcdu.onLeftInput[5] = () => {
            CDUAocInit.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            // I dont know if we want this button here
        };

        mcdu.onUp = () => {
            store["offset"]++;
            CDUAocInitRoute.ShowPage(mcdu, store);
        };

        mcdu.onDown = () => {
            store["offset"]--;
            CDUAocInitRoute.ShowPage(mcdu, store);
        };

        function getAllRows() {
            mcdu.simbrief.navlog.forEach((fix, i) => {
                console.log('fix');
                const subRow = [`${fix.distance}nm`, `${fix.altitude_feet}[color]green`];
                const row = [fix.via_airway, fix.ident];
                subRows[i] = subRow;
                rows[i] = row;
            });
        }
    }
}

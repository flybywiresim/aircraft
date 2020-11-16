class CDUAocOfpData {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCOfpData;
        mcdu.activeSystem = 'ATSU';

        let blockFuel = "_____[color]red";
        let taxiFuel = "____[color]red";
        let tripFuel = "_____[color]red";
        let estZfw = "__._[color]red";

        function formatWeight(value) {
            return (+value / 1000).toFixed(1);
        }

        if (mcdu.simbrief["blockFuel"]) {
            blockFuel = `${mcdu.simbrief["blockFuel"]}[color]blue`;
        }
        if (mcdu.simbrief["estZfw"]) {
            estZfw = `${formatWeight(mcdu.simbrief["estZfw"])}[color]blue`;
        }
        if (mcdu.simbrief["taxiFuel"]) {
            taxiFuel = `${mcdu.simbrief["taxiFuel"]}[color]blue`;
        }
        if (mcdu.simbrief["tripFuel"]) {
            tripFuel = `${mcdu.simbrief["tripFuel"]}[color]blue`;
        }

        const display = [
            ["OFP DATA", undefined, undefined, "AOC"],
            ["BLOCK FUEL", "OFP EDNO"],
            [blockFuel, "{white}+/{end}01[color]blue"],
            ["TAXI FUEL", "ZFW"],
            [taxiFuel, estZfw],
            ["TRIP FUEL", "STD"],
            [tripFuel, "{small}0000{end}[color]blue"],
            [""],
            [""],
            ["REFUEL"],
            ["*LOAD[color]blue", "PRINT*[color]blue"],
            ["", "OPF DATA[color]blue"],
            ["<AOC MENU", "SEND*[color]blue"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}

const VorClass = Object.freeze({
    Unknown: 0,
    Terminal: 1,
    LowAltitude: 2,
    HighAlttitude: 3,
    ILS: 4,
    VOT: 5,
});

const VorType = Object.freeze({
    Unknown: 0,
    VOR: 1,
    VORDME: 2,
    DME: 3,
    TACAN: 4,
    VORTAC: 5,
    ILS: 6,
    VOT: 7,
});

class CDUNavaidPage {
    /**
     * @param {A320_Neo_CDU_MainDisplay} mcdu MCDU
     * @param {import('msfs-navdata').VhfNavaid | import('msfs-navdata').NdbNavaid | undefined} facility MSFS facility to show
     * @param {any} returnPage Callback for the RETURN LSK... only for use by SELECTED NAVAIDS
     */
    static ShowPage(mcdu, facility, returnPage) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavaidPage;
        mcdu.returnPageCallback = () => {
            CDUNavaidPage.ShowPage(mcdu);
        };

        const template = [
            ["NAVAID"],
            ["\xa0IDENT"],
            ["____[color]amber"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ];

        if (facility) {
            template[2][0] = `{cyan}${WayPoint.formatIdentFromIcao(facility.databaseId)}{end}`;

            template[3][0] = '\xa0\xa0\xa0\xa0LAT/LONG';
            template[4][0] = `${new LatLong(facility.location.lat, facility.location.long).toShortDegreeString()}[color]green`;

            template[5][0] = '\xa0FREQ';
            template[6][0] = `{green}${CDUNavaidPage.formatFrequency(facility)}{end}`;

            const fom = CDUNavaidPage.formatFigureOfMerit(facility);
            if (fom) {
                template[11][0] = '\xa0FIG OF MERIT';
                template[12][0] = `{green}${fom}{end}`;
            }
        }

        if (returnPage !== undefined) {
            template[12][1] = 'RETURN>';
            mcdu.onRightInput[5] = () => returnPage();
        }

        mcdu.setTemplate(template);

        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            mcdu.getOrSelectNavaidsByIdent(value, res => {
                if (res) {
                    CDUNavaidPage.ShowPage(mcdu, res, returnPage);
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                    scratchpadCallback();
                }
            });
        };
    }

    /**
     * @param {import('msfs-navdata').NdbNavaid | import('msfs-navdata').VhfNavaid} facility Navaid
     * @returns {string} formatted frequency
     */
    static formatFrequency(facility) {
        if (facility.subSectionCode === 1) {
            return facility.frequency.toFixed(0);
        }
        return facility.frequency.toFixed(2);
    }

    /**
     * Format the figure of merit if possible
     * @param {import('msfs-navdata').NdbNavaid | import('msfs-navdata').VhfNavaid} facility Navaid
     * @returns {string} formatted FoM or blank
     */
    static formatFigureOfMerit(facility) {
        if (facility.subSectionCode === 0 /* VhfNavaid */ && facility.type === 8 /* Dme */ || facility.type === 2 /* Vor */ || facility.type === 4 /* VorDme */ || facility.type === 32 /* Vortac */) {
            switch (facility.class) {
                case 8 /* HighAlt */:
                    return '3';
                case 1 /* Unknown */:
                    return '2';
                case 4 /* LowAlt */:
                    return '1';
                case 2 /* Terminal */:
                    return '0';
            }
        }
        return '';
    }
}

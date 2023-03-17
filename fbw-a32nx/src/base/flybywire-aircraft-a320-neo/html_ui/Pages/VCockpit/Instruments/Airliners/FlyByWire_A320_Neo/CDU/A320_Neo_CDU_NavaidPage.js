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
     * @param {RawVor | RawNdb | undefined} facility MSFS facility to show
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
            template[2][0] = `{cyan}${WayPoint.formatIdentFromIcao(facility.icao)}{end}`;

            template[3][0] = '\xa0\xa0\xa0\xa0LAT/LONG';
            template[4][0] = `${new LatLong(facility.lat, facility.lon).toShortDegreeString()}[color]green`;

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
            mcdu.getOrSelectWaypointByIdent(value, res => {
                if (res) {
                    CDUNavaidPage.ShowPage(mcdu, res.additionalData.facility, returnPage);
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                    scratchpadCallback();
                }
            });
        };
    }

    /**
     * @param {RawNdb | RawVor} facility Navaid
     * @returns {string} formatted frequency
     */
    static formatFrequency(facility) {
        if (facility.__Type === 'JS_FacilityNDB') {
            return facility.freqMHz.toFixed(0);
        }
        return facility.freqMHz.toFixed(2);
    }

    /**
     * Format the figure of merit if possible
     * @param {RawNdb | RawVor} facility Navaid
     * @returns {string} formatted FoM or blank
     */
    static formatFigureOfMerit(facility) {
        if (facility.__Type === 'JS_FacilityVOR' && facility.type === VorType.DME || facility.type === VorType.VOR || facility.type === VorType.VORDME || facility.type === VorType.VORTAC) {
            switch (facility.vorClass) {
                case VorClass.HighAlttitude:
                    return '3';
                case VorClass.Unknown:
                    return '2';
                case VorClass.LowAltitude:
                    return '1';
                case VorClass.Terminal:
                    return '0';
            }
        }
        return '';
    }
}

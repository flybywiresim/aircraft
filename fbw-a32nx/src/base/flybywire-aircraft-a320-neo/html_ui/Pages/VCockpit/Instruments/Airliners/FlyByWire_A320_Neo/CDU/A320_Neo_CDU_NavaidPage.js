const VorClass = Object.freeze({
    Unknown: 1,
    Terminal: 2,
    LowAlt: 4,
    HighAlt: 8
});

const VorType = Object.freeze({
    Unknown: 1,
    Vor: 2,
    VorDme: 4,
    Dme: 8,
    Tacan: 16,
    Vortac: 32,
    Vot: 64,
    IlsDme: 128,
    IlsTacan: 256
});

const LsCategory = Object.freeze({
    None: 0,
    LocOnly: 1,
    Category1: 2,
    Category2: 3,
    Category3: 4,
    IgsOnly: 5,
    LdaGlideslope: 6,
    LdaOnly: 7,
    SdfGlideslope: 8,
    SdfOnly: 9,
});

class CDUNavaidPage {
    /**
     * @param {A320_Neo_CDU_MainDisplay} mcdu MCDU
     * @param {import('msfs-navdata').VhfNavaid | import('msfs-navdata').NdbNavaid | import('msfs-navdata').IlsNavaid | undefined} facility MSFS facility to show
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
            let latLon = facility.location;
            if (facility.sectionCode === 4 && facility.subSectionCode === 7) { // airport && ils
                CDUNavaidPage.renderIls(facility, template);
                latLon = facility.locLocation;
            } else if (facility.sectionCode === 1 && facility.subSectionCode === 0) { // navaid && vhf
                CDUNavaidPage.renderVorDme(facility, template);
            }

            template[2][0] = `{cyan}${facility.ident}{end}`;

            // 3L
            template[3][0] = '\xa0\xa0\xa0\xa0LAT/LONG';
            template[4][0] = `{green}${CDUPilotsWaypoint.formatLatLong(latLon)}{end}`;

            // 4L
            template[5][0] = '\xa0FREQ';
            template[6][0] = `{green}${CDUNavaidPage.formatFrequency(facility)}{end}`;
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
     *
     * @param {import('msfs-navdata').IlsNavaid} facility
     */
    static renderIls(facility, template) {
        let cat = 0;
        switch (facility.category) {
            case LsCategory.Category1:
                cat = 1;
                break;
            case LsCategory.Category2:
                cat = 2;
                break;
            case LsCategory.Category3:
                cat = 3;
                break;
        }

        // 1R
        template[1][1] = 'RWY IDENT';
        template[2][1] = `{green}${facility.runwayIdent}{end}`;

        // 2L
        template[3][0] = 'CLASS';
        // FIXME should show "NONCOLLOCATED" for ILS without DME
        template[4][0] = '{green}ILSDME{end}';

        // 2R
        if (cat > 0) {
            template[3][1] = 'CATEGORY';
            template[4][1] = `{green}${cat}{end}`;
        }

        // 3R
        template[5][1] = 'COURSE';
        template[6][1] = `{green}${facility.locBearing.toFixed(0).padStart(3, '0')}{end}`;

        // 4R
        if (facility.gsSlope) {
            template[7][1] = 'SLOPE';
            template[8][1] = `{green}${facility.gsSlope.toFixed(1)}{end}`;
        }
    }

    /**
     *
     * @param {import('msfs-navdata').VhfNavaid} facility
     */
    static renderVorDme(facility, template) {
        const isTrueRef = facility.stationDeclination < 1e-6 && Math.abs(facility.location.lat) > 63;
        const suffix = isTrueRef ? 'T' : (facility.stationDeclination < 0 ? 'W' : 'E');

        // 1R
        template[1][1] = 'STATION DEC';
        template[2][1] = `{green}${Math.abs(facility.stationDeclination).toFixed(0).padStart(3, '0')}${suffix}{end}`;

        // 2L
        template[3][0] = 'CLASS';
        template[4][0] = facility.type === VorType.VorDme || facility.type === VorType.Vortac ? '{green}VORTAC{end}' : '{green}NONCOLLOCATED{end}';

        // 5L
        if (facility.dmeLocation && facility.dmeLocation.alt !== undefined) {
            template[9][0] = 'ELV';
            template[10][0] = `{green}${(10 * Math.round(facility.dmeLocation.alt / 10)).toFixed(0)}{end}`;
        }

        // 6L
        const fom = CDUNavaidPage.formatFigureOfMerit(facility);
        if (fom) {
            template[11][0] = '\xa0FIG OF MERIT';
            template[12][0] = `{green}${fom}{end}`;
        }
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

// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * @typedef {Object} SelectedNavaid
 * @property {Fmgc.SelectedNavaidType} type
 * @property {Fmgc.SelectedNavaidMode} mode
 * @property {string} ident
 * @property {number} frequency
 * @property {RawVor | null} facility
 */

NAVAID_TYPE_STRINGS = Object.freeze({
    [Fmgc.SelectedNavaidType.None]: '',
    [Fmgc.SelectedNavaidType.Dme]: 'DME',
    [Fmgc.SelectedNavaidType.Vor]: 'VOR',
    [Fmgc.SelectedNavaidType.VorDme]: 'VORDME',
    [Fmgc.SelectedNavaidType.VorTac]: 'VORTAC',
    [Fmgc.SelectedNavaidType.Tacan]: 'TACAN',
    [Fmgc.SelectedNavaidType.Ils]: 'ILSDME',
    [Fmgc.SelectedNavaidType.Gls]: 'GLS',
    [Fmgc.SelectedNavaidType.Mls]: 'MLS',
});

NAVAID_MODE_STRINGS = Object.freeze({
    [Fmgc.SelectedNavaidMode.Auto]: 'AUTO',
    [Fmgc.SelectedNavaidMode.Manual]: 'MAN',
    [Fmgc.SelectedNavaidMode.Rmp]: 'RMP',
});

class CDUSelectedNavaids {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.SelectedNavaids;
        mcdu.returnPageCallback = () => CDUSelectedNavaids.ShowPage(mcdu);
        mcdu.pageRedrawCallback = () => CDUSelectedNavaids.ShowPage(mcdu);
        setTimeout(mcdu.requestUpdate.bind(mcdu), 500);

        const template = [
            ["\xa0SELECTED NAVAIDS"],
            ["", "DESELECT"],
            ["", '', ""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0RADIONAV SELECTED[color]cyan"],
            ["{DESELECT[color]inop"],
            ["\xa0GPS SELECTED[color]cyan"],
            ["{DESELECT[color]inop", "RETURN>"]
        ];

        /** @type {SelectedNavaid[]} */
        const selectedNavaids = mcdu.getSelectedNavaids();

        for (const [i, navaid] of selectedNavaids.entries()) {
            if (navaid.frequency < 1) {
                continue;
            }

            const labelRow = 2 * i + 1;
            const lineRow = labelRow + 1;

            template[labelRow][0] = `\xa0${NAVAID_TYPE_STRINGS[navaid.type].padEnd(9, '\xa0')}${NAVAID_MODE_STRINGS[navaid.mode]}`;
            template[lineRow][0] = `{cyan}${navaid.facility !== null ? '{' : '\xa0'}${(navaid.ident !== null ? navaid.ident : '').padEnd(6, '\xa0')}{end}{small}{green}${navaid.frequency.toFixed(2)}{end}{end}`;

            if (navaid.facility !== null) {
                mcdu.onLeftInput[i] = (text, scratchpadCallback) => {
                    if (text === '') {
                        CDUNavaidPage.ShowPage(mcdu, navaid.facility, () => CDUSelectedNavaids.ShowPage(mcdu));
                    } else {
                        scratchpadCallback();
                        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                    }
                };
            }
        }

        const deselected = mcdu.deselectedNavaids;
        for (let i = 0; i < 4; i++) {
            const icao = deselected[i];
            if (!icao) {
                break;
            }

            const lineRow = 2 * i + 2;

            // FIXME take facilities rather than database idents
            template[lineRow][1] = `{cyan}${icao.substring(7).trim()}{end}`;

            mcdu.onRightInput[i] = (text, scratchpadCallback) => {
                if (text === FMCMainDisplay.clrValue) {
                    mcdu.reselectNavaid(icao);
                    mcdu.requestUpdate();
                } else if (text.match(/^[A-Z0-9]{1,4}$/) !== null) {
                    mcdu.getOrSelectNavaidsByIdent(text, (navaid) => {
                        if (navaid) {
                            mcdu.reselectNavaid(icao);
                            mcdu.deselectNavaid(navaid.databaseId);
                            CDUSelectedNavaids.ShowPage(mcdu);
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                        }
                    });
                } else {
                    scratchpadCallback();
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            };
        }
        if (deselected.length < 4) {
            const lineRow = 2 * deselected.length + 2;
            template[lineRow][1] = '{cyan}[\xa0\xa0]{small}*{end}{end}';

            mcdu.onRightInput[deselected.length] = (text, scratchpadCallback) => {
                if (text.match(/^[A-Z0-9]{1,4}$/) !== null) {
                    mcdu.getOrSelectNavaidsByIdent(text, (navaid) => {
                        if (navaid) {
                            mcdu.deselectNavaid(navaid.databaseId);
                            CDUSelectedNavaids.ShowPage(mcdu);
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                        }
                    });
                } else {
                    scratchpadCallback();
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                }
            };
        }

        mcdu.setTemplate(template);

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu);
        };
    }
}

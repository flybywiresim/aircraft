// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class CDUNavRadioPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavRadioPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.pageRedrawCallback = () => {
            CDUNavRadioPage.ShowPage(mcdu);
        };
        setTimeout(mcdu.requestUpdate.bind(mcdu), 500);
        mcdu.returnPageCallback = () => {
            CDUNavRadioPage.ShowPage(mcdu);
        };

        const lsk1Row = [];
        const lsk2Row = [];
        const lsk3Row = [];
        const lsk4Title = ["CRS"];
        const lsk4Row = [];
        const lsk5Row = [];
        const lsk6Row = [];

        // this is the state when FM radio tuning is not active
        const template = [
            ["RADIO NAV"],
            ["VOR1/FREQ", "FREQ/VOR2"],
            lsk1Row,
            ["CRS", "CRS"],
            lsk2Row,
            ["\xa0LS\xa0/FREQ"],
            lsk3Row,
            lsk4Title,
            lsk4Row,
            ["ADF1/FREQ", "FREQ/ADF2"],
            lsk5Row,
            [""],
            lsk6Row,
        ];

        if (!mcdu.isFmTuningActive()) {
            mcdu.setTemplate(template);
            return;
        }

        // VOR 1
        lsk1Row[0] = CDUNavRadioPage.renderVor(mcdu, 1);
        mcdu.onLeftInput[0] = CDUNavRadioPage.handleVorLsk.bind(this, mcdu, 1);
        lsk2Row[0] = CDUNavRadioPage.renderVorCrs(mcdu, 1);
        mcdu.onLeftInput[1] = CDUNavRadioPage.handleVorCrsLsk.bind(this, mcdu, 1);

        // VOR 2
        lsk1Row[1] = CDUNavRadioPage.renderVor(mcdu, 2);
        mcdu.onRightInput[0] = CDUNavRadioPage.handleVorLsk.bind(this, mcdu, 2);
        lsk2Row[1] = CDUNavRadioPage.renderVorCrs(mcdu, 2);
        mcdu.onRightInput[1] = CDUNavRadioPage.handleVorCrsLsk.bind(this, mcdu, 2);

        // LS
        lsk3Row[0] = CDUNavRadioPage.renderMmr(mcdu);
        mcdu.onLeftInput[2] = CDUNavRadioPage.handleMmrLsk.bind(this, mcdu);
        lsk4Row[0] = CDUNavRadioPage.renderMmrCrs(mcdu);
        mcdu.onLeftInput[3] = CDUNavRadioPage.handleMmrCrsLsk.bind(this, mcdu);
        lsk4Title[0] = CDUNavRadioPage.renderMmrCrsTitle(mcdu);

        // ADF 1
        lsk5Row[0] = CDUNavRadioPage.renderAdf(mcdu, 1);
        mcdu.onLeftInput[4] = CDUNavRadioPage.handleAdfLsk.bind(this, mcdu, 1);
        // FIXME BFO

        // ADF 2
        lsk5Row[1] = CDUNavRadioPage.renderAdf(mcdu, 2);
        mcdu.onRightInput[4] = CDUNavRadioPage.handleAdfLsk.bind(this, mcdu, 2);
        // FIXME BFO

        mcdu.setTemplate(template);
    }

    static handleVorLsk(mcdu, receiverIndex, input, scratchpadCallback) {
        if (input === FMCMainDisplay.clrValue) {
            const vor = mcdu.getVorTuningData(receiverIndex);
            if (vor.manual) {
                mcdu.setManualVor(receiverIndex, null);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            }
        } else if (input.match(/^\d{3}(\.\d{1,2})?$/) !== null) {
            const freq = parseInt(input.replace('.', '').padEnd(5, '0'), 16) << 8;

            if (!Fmgc.RadioUtils.isValidRange(freq, Fmgc.RadioUtils.RadioChannelType.VhfNavaid50)) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return false;
            } else if (!Fmgc.RadioUtils.isValidSpacing(freq, Fmgc.RadioUtils.RadioChannelType.VhfNavaid50)) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return false;
            }

            mcdu.setManualVor(receiverIndex, Fmgc.RadioUtils.unpackBcd32(freq) / 1e6);
        } else if (input.length >= 1 && input.length <= 4) {
            // ident
            mcdu.getOrSelectVORsByIdent(input, (navaid) => {
                if (navaid) {
                    if (mcdu.deselectedNavaids.find((databaseId) => databaseId === navaid.databaseId)) {
                        mcdu.setScratchpadMessage(NXSystemMessages.xxxIsDeselected.getModifiedMessage(navaid.ident));
                        scratchpadCallback();
                        return;
                    }
                    mcdu.setManualVor(receiverIndex, navaid);
                    mcdu.requestCall(() => {
                        CDUNavRadioPage.ShowPage(mcdu);
                    });
                } else {
                    // FIXME new navaid page when it's built
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                    scratchpadCallback();
                }
            });
            return;
        } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }

        mcdu.requestCall(() => {
            CDUNavRadioPage.ShowPage(mcdu);
        });
    }

    static renderVor(mcdu, receiverIndex) {
        const vor = mcdu.getVorTuningData(receiverIndex);
        let identText;
        let freqText;
        if (vor.frequency !== null) {
            const ident = vor.ident !== null ? vor.ident : "[\xa0\xa0]";
            identText = `{${vor.manual ? 'big' : 'small'}}${receiverIndex === 2 ? ident.padEnd(4, '\xa0') : ident.padStart(4, '\xa0')}{end}`;
            freqText = `{${vor.manual && vor.ident === null ? 'big' : 'small'}}${vor.frequency.toFixed(2)}{end}`;
        } else {
            identText = "[\xa0\xa0]";
            freqText = "[\xa0\xa0.\xa0]";
        }

        return `{cyan}${receiverIndex === 2 ? freqText : identText}{${vor.manual ? 'big' : 'small'}}/{end}${receiverIndex === 2 ? identText : freqText}{end}`;
    }

    static handleVorCrsLsk(mcdu, receiverIndex, input, scratchpadCallback) {
        if (input === FMCMainDisplay.clrValue) {
            mcdu.setVorCourse(receiverIndex, null);
        } else if (input.match(/^\d{1,3}$/) !== null) {
            const course = parseInt(input);
            if (course < 0 || course > 360) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return;
            }
            mcdu.setVorCourse(receiverIndex, course % 360);
        } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }

        mcdu.requestCall(() => {
            CDUNavRadioPage.ShowPage(mcdu);
        });
    }

    static renderVorCrs(mcdu, receiverIndex) {
        // FIXME T suffix for true-ref VORs
        const vor = mcdu.getVorTuningData(receiverIndex);
        if (vor.dmeOnly) {
            return "";
        }
        if (vor.course !== null) {
            return `{cyan}${vor.course.toFixed(0).padStart(3, "0")}{end}`;
        }
        return "{cyan}[\xa0]{end}";
    }

    static handleMmrLsk(mcdu, input, scratchpadCallback) {
        if (mcdu.isMmrTuningLocked()) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            return;
        }

        const onDone = mcdu.requestCall.bind(mcdu, (() => {
            CDUNavRadioPage.ShowPage(mcdu);
        }));

        if (input === FMCMainDisplay.clrValue) {
            const mmr = mcdu.getMmrTuningData(1);
            if (mmr.manual) {
                mcdu.setManualIls(null).then(onDone);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            }
        } else if (input.match(/^\d{3}(\.\d{1,2})?$/) !== null) {
            const freq = parseInt(input.replace('.', '').padEnd(5, '0'), 16) << 8;

            if (!Fmgc.RadioUtils.isValidRange(freq, Fmgc.RadioUtils.RadioChannelType.IlsNavaid50)) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return false;
            } else if (!Fmgc.RadioUtils.isValidSpacing(freq, Fmgc.RadioUtils.RadioChannelType.IlsNavaid50)) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return false;
            }

            mcdu.setManualIls(Fmgc.RadioUtils.unpackBcd32(freq) / 1e6).then(onDone);
        } else if (input.length >= 1 && input.length <= 4) {
            // ident
            mcdu.getOrSelectILSsByIdent(input, (navaid) => {
                if (navaid) {
                    if (mcdu.deselectedNavaids.find((databaseId) => databaseId === navaid.databaseId)) {
                        mcdu.setScratchpadMessage(NXSystemMessages.xxxIsDeselected.getModifiedMessage(navaid.ident));
                        scratchpadCallback();
                        return;
                    }

                    mcdu.setManualIls(navaid).then(onDone);
                } else {
                    // FIXME new navaid page when it's built
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                    scratchpadCallback();
                }
            });
            return;
        } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }
    }

    static renderMmr(mcdu) {
        const mmr = mcdu.getMmrTuningData(1);
        let identText;
        let freqText;
        if (mmr.frequency !== null) {
            const ident = mmr.ident !== null ? mmr.ident : "[\xa0\xa0]";
            identText = `{${mmr.manual ? 'big' : 'small'}}${ident.padStart(4, '\xa0')}{end}`;
            freqText = `{${mmr.manual && mmr.ident === null ? 'big' : 'small'}}${mmr.frequency.toFixed(2)}{end}`;
        } else {
            identText = "[\xa0\xa0]";
            freqText = "[\xa0\xa0\xa0\xa0]";
        }

        return `{cyan}${identText}{${mmr.manual ? 'big' : 'small'}}/{end}${freqText}{end}`;
    }

    static handleMmrCrsLsk(mcdu, input, scratchpadCallback) {
        if (mcdu.isMmrTuningLocked()) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            return;
        }

        if (input === FMCMainDisplay.clrValue) {
            const mmr = mcdu.getMmrTuningData(1);
            if (mmr.courseManual) {
                mcdu.setIlsCourse(null);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            }
        } else if (input === 'F' || input === 'B') {
            // change existing course between front course and back course
            const mmr = mcdu.getMmrTuningData(1);
            if (mmr.course === null) {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                return;
            }
            const backcourse = input.charAt(0) === 'B';
            mcdu.setIlsCourse(mmr.course, backcourse);
        } else if (input.match(/^[BF]?\d{1,3}$/) !== null) {
            const backcourse = input.charAt(0) === 'B';
            const course = input.charAt(0) === 'F' || backcourse ? parseInt(input.slice(1)) : parseInt(input);
            if (course < 0 || course > 360) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return;
            }
            mcdu.setIlsCourse(course % 360, backcourse);
        } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }

        mcdu.requestCall(() => {
            CDUNavRadioPage.ShowPage(mcdu);
        });
    }

    static showSlope(mcdu, mmr) {
        const takeoff = mcdu.flightPhaseManager.phase <= FmgcFlightPhases.TAKEOFF;
        const ilsAppr = mcdu.flightPlanService.active.approach && mcdu.flightPlanService.active.approach.type === 5; // ILS
        return mmr.manual || (!takeoff && ilsAppr);
    }

    static renderMmrCrs(mcdu) {
        const mmr = mcdu.getMmrTuningData(1);
        const showSlope = CDUNavRadioPage.showSlope(mcdu, mmr);
        const slope = mmr.slope !== null ? `\xa0\xa0{small}{green}${mmr.slope.toFixed(1)}{end}{end}` : '{white}\xa0\xa0\xa0-.-{end}';
        if (mmr.course !== null) {
            return `{${mmr.courseManual ? 'big' : 'small'}}{cyan}${mmr.backcourse ? 'B' : 'F'}${mmr.course.toFixed(0).padStart(3, "0")}{end}{end}${showSlope ? slope : ''}`;
        }
        if (mmr.frequency !== null) {
            return `{amber}____{end}${slope}`;
        }
        return "{cyan}[\xa0\xa0]{end}";
    }

    static renderMmrCrsTitle(mcdu) {
        const mmr = mcdu.getMmrTuningData(1);
        const showSlope = CDUNavRadioPage.showSlope(mcdu, mmr);
        if (showSlope && mmr.frequency !== null) {
            return "CRS\xa0\xa0\xa0SLOPE";
        }
        return "CRS";
    }

    static handleAdfLsk(mcdu, receiverIndex, input, scratchpadCallback) {
        if (input === FMCMainDisplay.clrValue) {
            const adf = mcdu.getAdfTuningData(receiverIndex);
            if (adf.manual) {
                mcdu.setManualAdf(receiverIndex, null);
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            }
        } else if (input.match(/^\d{3,4}(\.\d)?$/) !== null) {
            const freq = parseFloat(input);
            // 190.0 - 1750.0 with some tolerance for FP precision
            if (freq <= 189.95 || freq >= 1750.05) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return false;
            }

            mcdu.setManualAdf(receiverIndex, freq);
        } else if (input.length >= 1 && input.length <= 4) {
            // ident
            mcdu.getOrSelectNDBsByIdent(input, (navaid) => {
                if (navaid) {
                    if (mcdu.deselectedNavaids.find((databaseId) => databaseId === navaid.databaseId)) {
                        mcdu.setScratchpadMessage(NXSystemMessages.xxxIsDeselected.getModifiedMessage(navaid.ident));
                        scratchpadCallback();
                        return;
                    }
                    mcdu.setManualAdf(receiverIndex, navaid);
                    mcdu.requestCall(() => {
                        CDUNavRadioPage.ShowPage(mcdu);
                    });
                } else {
                    // FIXME new navaid page when it's built
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                    scratchpadCallback();
                }
            });
            return;
        } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }

        mcdu.requestCall(() => {
            CDUNavRadioPage.ShowPage(mcdu);
        });
    }

    static renderAdf(mcdu, receiverIndex) {
        const adf = mcdu.getAdfTuningData(receiverIndex);
        let identText;
        let freqText;
        if (adf.frequency !== null) {
            const ident = adf.ident !== null ? adf.ident : "[\xa0\xa0]";
            identText = `{${adf.manual ? 'big' : 'small'}}${receiverIndex === 2 ? ident.padEnd(4, '\xa0') : ident.padStart(4, '\xa0')}{end}`;
            freqText = `{${adf.manual && adf.ident === null ? 'big' : 'small'}}${adf.frequency.toFixed(1)}{end}`;
        } else {
            identText = "[\xa0\xa0]";
            freqText = "[\xa0\xa0\xa0.]";
        }

        return `{cyan}${receiverIndex === 2 ? freqText : identText}{${adf.manual ? 'big' : 'small'}}/{end}${receiverIndex === 2 ? identText : freqText}{end}`;
    }
}

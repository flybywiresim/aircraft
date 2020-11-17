class CDUNavRadioPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavRadioPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.refreshPageCallback = () => {
            CDUNavRadioPage.ShowPage(mcdu);
        };
        const radioOn = mcdu.isRadioNavActive();
        let vor1FrequencyCell = "";
        let vor1CourseCell = "";
        let ilsFrequencyCell = "";
        let ilsCourseCell = "";
        let adf1FrequencyCell = "";
        let adf1BfoOption = "";
        if (!radioOn) {
            vor1FrequencyCell = "[\xa0]/[\xa0\xa0.\xa0]";
            if (mcdu.vor1Frequency > 0) {
                vor1FrequencyCell = "[\xa0]/" + mcdu.vor1Frequency.toFixed(2);
            }
            mcdu.onLeftInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                    mcdu.vor1Frequency = numValue;
                    if (mcdu.isRadioNavActive()) {
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    } else {
                        mcdu.radioNav.setVORStandbyFrequency(1, numValue).then(() => {
                            mcdu.radioNav.swapVORFrequencies(1);
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        });
                    }
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor1Frequency = 0;
                    mcdu.radioNav.setVORActiveFrequency(1, 0);
                    vor1FrequencyCell = "[\xa0]/[\xa0\xa0.\xa0]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
            vor1CourseCell = "[\xa0]";
            if (mcdu.vor1Course >= 0) {
                vor1CourseCell = mcdu.vor1Course.toFixed(0);
            }
            mcdu.onLeftInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 0 && numValue < 360) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", numValue).then(() => {
                        mcdu.vor1Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
            ilsFrequencyCell = "[\xa0\xa0]/[\xa0\xa0.\xa0]";
            ilsCourseCell = "[\xa0]";
            const approach = mcdu.flightPlanManager.getApproach();
            const ilsIdent = mcdu.radioNav.getBestILSBeacon();                 
            if (mcdu.ilsFrequency > 0){
                ilsFrequencyCell = ilsIdent.ident + "/" + mcdu.ilsFrequency.toFixed(2);
                }
                const runway = mcdu.flightPlanManager.getApproachRunway();
                if (runway) {
                    ilsCourseCell = runway.direction.toFixed(0);                   
                }
                        mcdu.onLeftInput[2] = (value) => {
                if (mcdu.setIlsFrequency(value)) {
                    CDUNavRadioPage.ShowPage(mcdu);
                }
            };
            adf1FrequencyCell = "[\xa0]/[\xa0\xa0.]";
            if (mcdu.adf1Frequency > 0) {
                adf1FrequencyCell = "[\xa0]/" + mcdu.adf1Frequency.toFixed(1);
                adf1BfoOption = "<ADF1 BFO";
            }
            mcdu.onLeftInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 100 && numValue <= 1699.9) {
                    SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        mcdu.adf1Frequency = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.adf1Frequency = 0;
                    mcdu.radioNav.setADFActiveFrequency(1, 0);
                    adf1FrequencyCell = "[\xa0]/[\xa0\xa0.]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
        }
        let vor2FrequencyCell = "";
        let vor2CourseCell = "";
        let adf2FrequencyCell = "";
        let adf2BfoOption = "";
        if (!radioOn) {
            vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0]";
            if (mcdu.vor2Frequency > 0) {
                vor2FrequencyCell = mcdu.vor2Frequency.toFixed(2) + "/[\xa0]";
            }
            mcdu.onRightInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                    mcdu.vor2Frequency = numValue;
                    if (mcdu.isRadioNavActive()) {
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    } else {
                        mcdu.radioNav.setVORStandbyFrequency(2, numValue).then(() => {
                            mcdu.radioNav.swapVORFrequencies(2);
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        });
                    }
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor2Frequency = 0;
                    mcdu.radioNav.setVORActiveFrequency(2, 0);
                    vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
            vor2CourseCell = "[\xa0]";
            if (mcdu.vor2Course >= 0) {
                vor2CourseCell = mcdu.vor2Course.toFixed(0);
            }
            mcdu.onRightInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 0 && numValue < 360) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", numValue).then(() => {
                        mcdu.vor2Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
            adf2FrequencyCell = "[\xa0\xa0.]/[\xa0]";
            if (mcdu.adf2Frequency > 0) {
                adf2FrequencyCell = mcdu.adf2Frequency.toFixed(1) + "/[\xa0]";
                adf2BfoOption = "ADF2 BFO>";
            }
            mcdu.onRightInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue >= 100 && numValue <= 1699.9) {
                    SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        mcdu.adf2Frequency = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.adf2Frequency = 0;
                    mcdu.radioNav.setADFActiveFrequency(2, 0);
                    adf2FrequencyCell = "[\xa0\xa0.]/[\xa0]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            };
        }
        mcdu.setTemplate([
            ["RADIO NAV"],
            ["VOR1/FREQ", "FREQ/VOR2"],
            [vor1FrequencyCell + "[color]blue", vor2FrequencyCell + "[color]blue"],
            ["CRS", "CRS"],
            [vor1CourseCell + "[color]blue", vor2CourseCell + "[color]blue"],
            ["\xa0LS\xa0/FREQ"],
            [ilsFrequencyCell + "[color]blue"],
            ["CRS"],
            [ilsCourseCell],
            ["ADF1/FREQ", "FREQ/ADF2"],
            [adf1FrequencyCell + "[color]blue", adf2FrequencyCell + "[color]blue"],
            [""],
            [adf1BfoOption + "[color]inop", adf2BfoOption + "[color]inop"]
        ]);
    }
}

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
        CDUNavRadioPage._timer = 0;
        mcdu.pageUpdate = () => {
            CDUNavRadioPage._timer++;
            if (CDUNavRadioPage._timer >= 10) {
                CDUNavRadioPage.ShowPage(mcdu);
            }
        };
        if (!radioOn) {
            vor1FrequencyCell = "[\xa0\xa0]/[\xa0\xa0.\xa0]";
            const vor1Ident = mcdu.radioNav.getVORBeacon(1);
            //console.log("--VOR1:" + vor1Ident.id + vor1Ident.ident);
            if (mcdu.vor1Frequency > 0) {
                vor1FrequencyCell = "{small}" + "\xa0" + vor1Ident.ident + "{end}" + "/" + mcdu.vor1Frequency.toFixed(2);
            }
            if (vor1Ident.ident == "" && mcdu.vor1Frequency > 0) {
                vor1FrequencyCell = "[\xa0\xa0]/" + mcdu.vor1Frequency.toFixed(2);
            }
            mcdu.onLeftInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue)){
                    mcdu.getOrSelectVORsByIdent(value, (navaids) => {
                        mcdu.vor1Frequency = navaids.infos.frequencyMHz;
                        mcdu.radioNav.setVORActiveFrequency(1, mcdu.vor1Frequency);
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    })
                } else if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                    if (numValue != mcdu.vor1Frequency) {
                        mcdu.vor1Course = 0;
                    }
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
                    mcdu.vor1Course = 0;
                    mcdu.radioNav.setVORActiveFrequency(1, 0);
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
                }
            };
            vor1CourseCell = "[\xa0]";
            if (mcdu.vor1Course > 0) {
                vor1CourseCell = mcdu.vor1Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onLeftInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", numValue).then(() => {
                        mcdu.vor1Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else {
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
                }
            };


            ilsFrequencyCell = "[\xa0\xa0]/[\xa0\xa0.\xa0]";
            ilsCourseCell = "";
            const approach = mcdu.flightPlanManager.getApproach();
            const ilsIdent = mcdu.radioNav.getILSBeacon(1);
            const runway = mcdu.flightPlanManager.getApproachRunway();

            //console.log("--ILS:" + ilsIdent.id + ilsIdent.ident + approach.name + mcdu.radioNav.getILSActiveFrequency(1));
            if (mcdu.ilsFrequency != 0){
                let ilsIdentStr = "[\xa0\xa0]";
                if (ilsIdent.ident != "") {
                    ilsIdentStr = "{small}" + ilsIdent.ident + "{end}";
                }
                if (mcdu._ilsFrequencyPilotEntered) {
                    ilsFrequencyCell = ilsIdentStr + "/" + mcdu.ilsFrequency.toFixed(2);
                    ilsCourseCell = "{inop}____{end}";
                } else {
                    ilsFrequencyCell = ilsIdentStr + "{small}" + "/" + mcdu.ilsFrequency.toFixed(2) + "{end}";
                    ilsCourseCell = "{small}" + ilsIdent.course.toFixed(0).padStart(3, "0") + "{end}"; 
                }
            }
            mcdu.onLeftInput[2] = (value) => {
                if (mcdu.setIlsFrequency(value)) {
                    CDUNavRadioPage.ShowPage(mcdu);
                }
            };

            // if (runway && approach.name.indexOf("ILS") >= 0 && mcdu.ilsFrequency != 0) {

            adf1FrequencyCell = "[\xa0\xa0]/[\xa0\xa0\xa0.]";
            const adf1Ident = SimVar.GetSimVarValue(`ADF IDENT:1`, "string");
            //console.log("--ADF1:" + adf1Ident + adf1Ident.ident);
            if (mcdu.adf1Frequency > 0) {
                adf1FrequencyCell = "{small}" + "\xa0" + adf1Ident.padStart(3, "\xa0") + "{end}" + "/" + mcdu.adf1Frequency.toFixed(1);
                adf1BfoOption = "<ADF1 BFO";
            }
            if (adf1Ident == "" && mcdu.adf1Frequency > 0) {
                adf1FrequencyCell = "[\xa0\xa0]/" + mcdu.adf1Frequency.toFixed(1);
            }
            mcdu.onLeftInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue)){
                    mcdu.getOrSelectNDBsByIdent(value, (navaids) => {
                        mcdu.adf1Frequency = navaids.infos.frequencyMHz;
                        mcdu.radioNav.setADFActiveFrequency(1, mcdu.adf1Frequency);
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    })
                }                
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
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
                }
            };
        }
        let vor2FrequencyCell = "";
        let vor2CourseCell = "";
        let adf2FrequencyCell = "";
        let adf2BfoOption = "";
        if (!radioOn) {
            vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0\xa0]";
            const vor2Ident = mcdu.radioNav.getVORBeacon(2);
            //console.log("--VOR2:" + vor2Ident.id);
            if (mcdu.vor2Frequency > 0) {
                vor2FrequencyCell = mcdu.vor2Frequency.toFixed(2) + "/" + "{small}" + vor2Ident.ident + "\xa0" + "{end}";
            }
            if (vor2Ident.ident == "" && mcdu.vor2Frequency > 0) {
                vor2FrequencyCell = mcdu.vor2Frequency.toFixed(2) + "/[\xa0\xa0]";
            }
            mcdu.onRightInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue)){
                    mcdu.getOrSelectVORsByIdent(value, (navaids) => {
                        mcdu.vor2Frequency = navaids.infos.frequencyMHz;
                        mcdu.radioNav.setVORActiveFrequency(2, mcdu.vor2Frequency);
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    })
                }
                if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
                    if (numValue != mcdu.vor2Frequency) {
                        mcdu.vor2Course = 0;
                    }
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
                    mcdu.vor2Course = 0;
                    mcdu.radioNav.setVORActiveFrequency(2, 0);
                    vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
                }
            };
            vor2CourseCell = "[\xa0]";
            if (mcdu.vor2Course > 0) {
                vor2CourseCell = mcdu.vor2Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onRightInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", numValue).then(() => {
                        mcdu.vor2Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else {
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
                }
            }; 
            adf2FrequencyCell = "[\xa0\xa0\xa0.]/[\xa0\xa0]";
            const adf2Ident = SimVar.GetSimVarValue(`ADF IDENT:2`, "string");
            //console.log("--ADF2:" + adf2Ident);
            if (mcdu.adf2Frequency > 0) {
                adf2FrequencyCell = mcdu.adf2Frequency.toFixed(1) + "/" + "{small}" + adf2Ident.padEnd(3, "\xa0") + "\xa0" + "{end}";
                adf2BfoOption = "ADF2 BFO>";
            }
            if (adf2Ident == "" && mcdu.adf2Frequency > 0) {
                adf2FrequencyCell = mcdu.adf2Frequency.toFixed(1) + "/[\xa0\xa0]";
            }
            mcdu.onRightInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue)){
                    mcdu.getOrSelectNDBsByIdent(value, (navaids) => {
                        mcdu.adf2Frequency = navaids.infos.frequencyMHz;
                        mcdu.radioNav.setADFActiveFrequency(2, mcdu.adf2Frequency);
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    })
                } 
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
                    mcdu.showErrorMessage("ENTRY OUT OF RANGE");
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
            [ilsCourseCell + "[color]blue"],
            ["ADF1/FREQ", "FREQ/ADF2"],
            [adf1FrequencyCell + "[color]blue", adf2FrequencyCell + "[color]blue"],
            [""],
            [adf1BfoOption + "[color]inop", adf2BfoOption + "[color]inop"]
        ]);
    }
}
CDUNavRadioPage._timer = 0;
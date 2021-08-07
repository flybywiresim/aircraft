class CDUNavRadioPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUNavRadioPage.ShowPage(fmc, mcdu);
        }, 'FMGC');
        mcdu.returnPageCallback = () => {
            CDUNavRadioPage.ShowPage(fmc, mcdu);
        };
        const radioOn = fmc.isRadioNavActive();
        let vor1FrequencyCell = "";
        let vor1CourseCell = "";
        let ilsFrequencyCell = "";
        let ilsCourseCell = "";
        let adf1FrequencyCell = "";
        let adf1BfoOption = "";
        let vor2FrequencyCell = "";
        let vor2CourseCell = "";
        let adf2FrequencyCell = "";
        let adf2BfoOption = "";
        if (!radioOn) {
            vor1FrequencyCell = "[\xa0]/[\xa0\xa0.\xa0]";
            const vor1Beacon = fmc.radioNav.getVORBeacon(1);
            const vor1Ident = vor1Beacon && vor1Beacon.ident.length >= 2 && vor1Beacon.ident.length <= 3 ? vor1Beacon.ident : "";
            if (fmc.vor1Frequency != 0 && !fmc.vor1IdIsPilotEntered && fmc.vor1FreqIsPilotEntered) {
                vor1FrequencyCell = "{small}" + vor1Ident.padStart(3, "\xa0") + "{end}" + "/" + fmc.vor1Frequency.toFixed(2);
            } else if (fmc.vor1Frequency != 0 && fmc.vor1IdIsPilotEntered && !fmc.vor1FreqIsPilotEntered) {
                vor1FrequencyCell = fmc.vor1IdPilotValue.padStart(3, "\xa0") + "/" + "{small}" + fmc.vor1Frequency.toFixed(2) + "{end}";
            }
            mcdu.onLeftInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (value === FMCMainDisplay.clrValue) {
                    fmc.vor1FreqIsPilotEntered = false;
                    fmc.vor1IdIsPilotEntered = false;
                    fmc.vor1Frequency = 0;
                    fmc.vor1Course = 0;
                    fmc.radioNav.setVORActiveFrequency(1, 0);
                    mcdu.requestUpdate();
                } else if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    fmc.getOrSelectVORsByIdent(mcdu, value, (navaids) => {
                        if (navaids) {
                            fmc.vor1IdIsPilotEntered = true;
                            fmc.vor1FreqIsPilotEntered = false;
                            fmc.vor1IdPilotValue = value;
                            fmc.vor1Frequency = navaids.infos.frequencyMHz;
                            fmc.radioNav.setVORActiveFrequency(1, fmc.vor1Frequency);
                            fmc.vor1Course = 0;
                            mcdu.requestOffsideUpdate();
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        }
                        CDUNavRadioPage.ShowPage(fmc, mcdu);
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3}(\.\d{1,2})?$/.test(value) || !RadioNav.isHz50Compliant(numValue)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        return false;
                    }
                    if (numValue < 108 || numValue > 117.95) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }
                    fmc.vor1IdIsPilotEntered = false;
                    fmc.vor1FreqIsPilotEntered = true;
                    if (numValue != fmc.vor1Frequency) {
                        fmc.vor1Course = 0;
                    }
                    fmc.vor1Frequency = numValue;
                    if (fmc.isRadioNavActive()) {
                        mcdu.requestUpdate();
                    } else {
                        fmc.radioNav.setVORStandbyFrequency(1, numValue).then(() => {
                            fmc.radioNav.swapVORFrequencies(1);
                            mcdu.requestUpdate();
                        });
                    }
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
            vor1CourseCell = "[\xa0]";
            if (fmc.vor1Course > 0) {
                vor1CourseCell = fmc.vor1Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onLeftInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", numValue).then(() => {
                        fmc.vor1Course = numValue;
                        mcdu.requestUpdate();
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    fmc.vor1Course = 0;
                    mcdu.requestUpdate();
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
            ilsFrequencyCell = "[\xa0\xa0]/[\xa0\xa0.\xa0]";
            ilsCourseCell = "";
            if (fmc.ilsFrequency != 0) {
                if (fmc._ilsFrequencyPilotEntered) {
                    const ilsIdent = fmc.radioNav.getILSBeacon(1);
                    ilsFrequencyCell = `{small}${ilsIdent.ident.trim().padStart(4, "\xa0")}{end}/${fmc.ilsFrequency.toFixed(2)}`;
                    ilsCourseCell = "{small}F" + ilsIdent.course.toFixed(0).padStart(3, "0") + "{end}";
                } else if (fmc.ilsAutoTuned) {
                    ilsFrequencyCell = `{small}${fmc.ilsAutoIdent.padStart(4, "\xa0")}/${fmc.ilsFrequency.toFixed(2)}{end}`;
                    ilsCourseCell = `{small}F${fmc.ilsAutoCourse.toFixed(0).padStart(3, "0")}{end}`;
                }
            }
            mcdu.onLeftInput[2] = (value) => {
                if (fmc.setIlsFrequency(value)) {
                    mcdu.requestUpdate();
                }
            };
            adf1FrequencyCell = "[\xa0]/[\xa0\xa0\xa0.]";
            const adf1Ident = SimVar.GetSimVarValue(`ADF IDENT:1`, "string");
            if (fmc.adf1Frequency != 0 && !fmc.adf1IdIsPilotEntered && fmc.adf1FreqIsPilotEntered) {
                adf1FrequencyCell = "{small}" + adf1Ident.padStart(3, "\xa0") + "{end}" + "/" + fmc.adf1Frequency.toFixed(1);
                adf1BfoOption = "<ADF1 BFO";
            } else if (fmc.adf1Frequency != 0 && fmc.adf1IdIsPilotEntered && !fmc.adf1FreqIsPilotEntered) {
                adf1FrequencyCell = fmc.adf1IdPilotValue.padStart(3, "\xa0") + "/" + "{small}" + fmc.adf1Frequency.toFixed(1) + "{end}";
                adf1BfoOption = "<ADF1 BFO";
            }
            mcdu.onLeftInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    fmc.getOrSelectNDBsByIdent(mcdu, value, (navaids) => {
                        if (navaids) {
                            fmc.adf1FreqIsPilotEntered = false;
                            fmc.adf1IdIsPilotEntered = true;
                            fmc.adf1IdPilotValue = value;
                            fmc.adf1Frequency = navaids.infos.frequencyMHz;
                            fmc.radioNav.setADFActiveFrequency(1, fmc.adf1Frequency);
                            mcdu.requestOffsideUpdate();
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        }
                        CDUNavRadioPage.ShowPage(fmc, mcdu);
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3,4}(\.\d{1})?$/.test(value)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        return false;
                    }
                    if (numValue < 190 || numValue > 1750) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }
                    SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        fmc.adf1FreqIsPilotEntered = true;
                        fmc.adf1IdIsPilotEntered = false;
                        fmc.adf1Frequency = numValue;
                        mcdu.requestUpdate();
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    fmc.adf1FreqIsPilotEntered = false;
                    fmc.adf1IdIsPilotEntered = false;
                    fmc.adf1Frequency = 0;
                    fmc.radioNav.setADFActiveFrequency(1, 0);
                    mcdu.requestUpdate();
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
        }

        if (!radioOn) {
            vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0]";
            const vor2Beacon = fmc.radioNav.getVORBeacon(2);
            const vor2Ident = vor2Beacon && vor2Beacon.ident.length >= 2 && vor2Beacon.ident.length <= 3 ? vor2Beacon.ident : "";
            if (fmc.vor2Frequency != 0 && fmc.vor2FreqIsPilotEntered && !fmc.vor2IdIsPilotEntered) {
                vor2FrequencyCell = fmc.vor2Frequency.toFixed(2) + "/" + "{small}" + vor2Ident.padEnd(3, "\xa0") + "{end}";
            } else if (fmc.vor2Frequency != 0 && !fmc.vor2FreqIsPilotEntered && fmc.vor2IdIsPilotEntered) {
                vor2FrequencyCell = "{small}" + fmc.vor2Frequency.toFixed(2) + "{end}" + "/" + fmc.vor2IdPilotValue.padEnd(3, "\xa0");
            }
            mcdu.onRightInput[0] = (value) => {
                const numValue = parseFloat(value);
                if (value === FMCMainDisplay.clrValue) {
                    fmc.vor2FreqIsPilotEntered = false;
                    fmc.vor2IdIsPilotEntered = false;
                    fmc.vor2Frequency = 0;
                    fmc.vor2Course = 0;
                    fmc.radioNav.setVORActiveFrequency(2, 0);
                    mcdu.requestUpdate();
                } else if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    fmc.getOrSelectVORsByIdent(mcdu, value, (navaids) => {
                        if (navaids) {
                            fmc.vor2IdIsPilotEntered = true;
                            fmc.vor2FreqIsPilotEntered = false;
                            fmc.vor2IdPilotValue = value;
                            fmc.vor2Frequency = navaids.infos.frequencyMHz;
                            fmc.radioNav.setVORActiveFrequency(2, fmc.vor2Frequency);
                            fmc.vor2Course = 0;
                            mcdu.requestOffsideUpdate();
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        }
                        CDUNavRadioPage.ShowPage(fmc, mcdu);
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3}(\.\d{1,2})?$/.test(value) || !RadioNav.isHz50Compliant(numValue)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        return false;
                    }
                    if (numValue < 108 || numValue > 117.95) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }
                    fmc.vor2FreqIsPilotEntered = true;
                    fmc.vor2IdIsPilotEntered = false;
                    if (numValue != fmc.vor2Frequency) {
                        fmc.vor2Course = 0;
                    }
                    fmc.vor2Frequency = numValue;
                    if (fmc.isRadioNavActive()) {
                        mcdu.requestUpdate();
                    } else {
                        fmc.radioNav.setVORStandbyFrequency(2, numValue).then(() => {
                            fmc.radioNav.swapVORFrequencies(2);
                            mcdu.requestUpdate();
                        });
                    }
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
            vor2CourseCell = "[\xa0]";
            if (fmc.vor2Course > 0) {
                vor2CourseCell = fmc.vor2Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onRightInput[1] = (value) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", numValue).then(() => {
                        fmc.vor2Course = numValue;
                        mcdu.requestUpdate();
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    fmc.vor2Course = 0;
                    mcdu.requestUpdate();
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
            adf2FrequencyCell = "[\xa0\xa0\xa0.]/[\xa0]";
            const adf2Ident = SimVar.GetSimVarValue(`ADF IDENT:2`, "string");
            if (fmc.adf2Frequency > 0 && fmc.adf2FreqIsPilotEntered && !fmc.adf2IdIsPilotEntered) {
                adf2FrequencyCell = fmc.adf2Frequency.toFixed(1) + "/" + "{small}" + adf2Ident.padEnd(3, "\xa0") + "{end}";
                adf2BfoOption = "ADF2 BFO>";
            } else if (fmc.adf2Frequency > 0 && !fmc.adf2FreqIsPilotEntered && fmc.adf2IdIsPilotEntered) {
                adf2FrequencyCell = "{small}" + fmc.adf2Frequency.toFixed(1) + "{end}" + "/" + fmc.adf2IdPilotValue.padEnd(3, "\xa0");
                adf2BfoOption = "ADF2 BFO>";
            }
            mcdu.onRightInput[4] = (value) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    fmc.adf2FreqIsPilotEntered = false;
                    fmc.adf2IdIsPilotEntered = true;
                    fmc.adf2IdPilotValue = value;
                    fmc.getOrSelectNDBsByIdent(mcdu, value, (navaids) => {
                        if (navaids) {
                            fmc.adf2Frequency = navaids.infos.frequencyMHz;
                            fmc.radioNav.setADFActiveFrequency(2, fmc.adf2Frequency);
                            mcdu.requestOffsideUpdate();
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        }
                        CDUNavRadioPage.ShowPage(fmc, mcdu);
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3,4}(\.\d{1})?$/.test(value)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        return false;
                    }
                    if (numValue < 190 || numValue > 1750) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }
                    SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        fmc.adf2FreqIsPilotEntered = true;
                        fmc.adf2IdIsPilotEntered = false;
                        fmc.adf2Frequency = numValue;
                        mcdu.requestUpdate();
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    fmc.adf2FreqIsPilotEntered = false;
                    fmc.adf2IdIsPilotEntered = false;
                    fmc.adf2Frequency = 0;
                    fmc.radioNav.setADFActiveFrequency(2, 0);
                    adf2FrequencyCell = "[\xa0\xa0.]/[\xa0]";
                    mcdu.requestUpdate();
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                }
            };
        }
        mcdu.setTemplate([
            ["RADIO NAV"],
            ["VOR1/FREQ", "FREQ/VOR2"],
            [vor1FrequencyCell + "[color]cyan", vor2FrequencyCell + "[color]cyan"],
            ["CRS", "CRS"],
            [vor1CourseCell + "[color]cyan", vor2CourseCell + "[color]cyan"],
            ["\xa0LS\xa0/FREQ"],
            [ilsFrequencyCell + "[color]cyan"],
            ["CRS"],
            [ilsCourseCell + "[color]cyan"],
            ["ADF1/FREQ", "FREQ/ADF2"],
            [adf1FrequencyCell + "[color]cyan", adf2FrequencyCell + "[color]cyan"],
            [""],
            [adf1BfoOption + "[color]inop", adf2BfoOption + "[color]inop"]
        ]);
    }
}

class CDUNavRadioPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavRadioPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.refreshPageCallback = () => {
            CDUNavRadioPage.ShowPage(mcdu);
        };
        mcdu.returnPageCallback = () => {
            CDUNavRadioPage.ShowPage(mcdu);
        };
        const radioOn = mcdu.isRadioNavActive();
        let vor1FrequencyCell = "";
        let vor1CourseCell = "";
        let ilsFrequencyCell = "";
        let ilsCourseCell = "[  ]";
        let adf1FrequencyCell = "";
        let adf1BfoOption = "";
        let vor2FrequencyCell = "";
        let vor2CourseCell = "";
        let adf2FrequencyCell = "";
        let adf2BfoOption = "";
        CDUNavRadioPage._timer = 0;
        mcdu.pageUpdate = () => {
            CDUNavRadioPage._timer++;
            if (CDUNavRadioPage._timer >= 5) {
                CDUNavRadioPage.ShowPage(mcdu);
            }
        };
        if (!radioOn) {
            vor1FrequencyCell = "[\xa0]/[\xa0\xa0.\xa0]";
            const vor1Beacon = mcdu.radioNav.getVORBeacon(1);
            const vor1Ident = vor1Beacon && vor1Beacon.ident.length >= 2 && vor1Beacon.ident.length <= 3 ? vor1Beacon.ident : "";
            if (mcdu.vor1Frequency != 0 && !mcdu.vor1IdIsPilotEntered && mcdu.vor1FreqIsPilotEntered) {
                vor1FrequencyCell = "{small}" + vor1Ident.padStart(3, "\xa0") + "{end}" + "/" + mcdu.vor1Frequency.toFixed(2);
            } else if (mcdu.vor1Frequency != 0 && mcdu.vor1IdIsPilotEntered && !mcdu.vor1FreqIsPilotEntered) {
                vor1FrequencyCell = mcdu.vor1IdPilotValue.padStart(3, "\xa0") + "/" + "{small}" + mcdu.vor1Frequency.toFixed(2) + "{end}";
            }
            mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor1FreqIsPilotEntered = false;
                    mcdu.vor1IdIsPilotEntered = false;
                    mcdu.vor1Frequency = 0;
                    mcdu.vor1Course = 0;
                    mcdu.radioNav.setVORActiveFrequency(1, 0);
                    CDUNavRadioPage.ShowPage(mcdu);
                } else if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    mcdu.getOrSelectVORsByIdent(value, (navaids) => {
                        if (navaids) {
                            mcdu.vor1IdIsPilotEntered = true;
                            mcdu.vor1FreqIsPilotEntered = false;
                            mcdu.vor1IdPilotValue = value;
                            mcdu.vor1Frequency = navaids.infos.frequencyMHz;
                            mcdu.radioNav.setVORActiveFrequency(1, mcdu.vor1Frequency);
                            mcdu.vor1Course = 0;
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            scratchpadCallback();
                        }
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3}(\.\d{1,2})?$/.test(value) || !RadioNav.isHz50Compliant(numValue)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        scratchpadCallback();
                        return false;
                    }
                    if (numValue < 108 || numValue > 117.95) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        scratchpadCallback();
                        return false;
                    }
                    mcdu.vor1IdIsPilotEntered = false;
                    mcdu.vor1FreqIsPilotEntered = true;
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
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                }
            };
            vor1CourseCell = "[\xa0]";
            if (mcdu.vor1Course > 0) {
                vor1CourseCell = mcdu.vor1Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", numValue).then(() => {
                        mcdu.vor1Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor1Course = 0;
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                }
            };
            ilsFrequencyCell = "[\xa0\xa0]/[\xa0\xa0.\xa0]";
            if (mcdu.ilsFrequency != 0) {
                if (mcdu._ilsFrequencyPilotEntered) {
                    const ilsIdent = mcdu.radioNav.getILSBeacon(1);
                    ilsFrequencyCell = `{small}${ilsIdent.ident.trim().padStart(4, "\xa0")}{end}/${mcdu.ilsFrequency.toFixed(2)}`;
                } else if (mcdu._ilsIdentPilotEntered) {
                    ilsFrequencyCell = `${mcdu._ilsIdent.trim().padStart(4, "\xa0")}/{small}${mcdu.ilsFrequency.toFixed(2)}{end}`;
                } else if (mcdu.ilsAutoTuned) {
                    ilsFrequencyCell = `{small}${mcdu.ilsAutoIdent.padStart(4, "\xa0")}/${mcdu.ilsFrequency.toFixed(2)}{end}`;
                }

                const lsCourse = SimVar.GetSimVarValue('L:A32NX_FM_LS_COURSE', 'number');
                if (lsCourse >= 0) {
                    ilsCourseCell = `{${mcdu.ilsCourse !== undefined ? 'big' : 'small'}}F${lsCourse.toFixed(0).padStart(3, "0")}{end}`;
                } else {
                    ilsCourseCell = "{amber}____{end}";
                }
            }
            mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
                mcdu.setIlsFrequency(value, (result) => {
                    if (result) {
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    } else {
                        scratchpadCallback();
                    }
                });
            };
            mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
                mcdu.setLsCourse(value, (result) => {
                    if (result) {
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    } else {
                        scratchpadCallback();
                    }
                });
            };
            adf1FrequencyCell = "[\xa0]/[\xa0\xa0\xa0.]";
            const adf1Ident = SimVar.GetSimVarValue(`ADF IDENT:1`, "string");
            if (mcdu.adf1Frequency != 0 && !mcdu.adf1IdIsPilotEntered && mcdu.adf1FreqIsPilotEntered) {
                adf1FrequencyCell = "{small}" + adf1Ident.padStart(3, "\xa0") + "{end}" + "/" + mcdu.adf1Frequency.toFixed(1);
                adf1BfoOption = "<ADF1 BFO";
            } else if (mcdu.adf1Frequency != 0 && mcdu.adf1IdIsPilotEntered && !mcdu.adf1FreqIsPilotEntered) {
                adf1FrequencyCell = mcdu.adf1IdPilotValue.padStart(3, "\xa0") + "/" + "{small}" + mcdu.adf1Frequency.toFixed(1) + "{end}";
                adf1BfoOption = "<ADF1 BFO";
            }
            mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    mcdu.getOrSelectNDBsByIdent(value, (navaids) => {
                        if (navaids) {
                            mcdu.adf1FreqIsPilotEntered = false;
                            mcdu.adf1IdIsPilotEntered = true;
                            mcdu.adf1IdPilotValue = value;
                            mcdu.adf1Frequency = navaids.infos.frequencyMHz;
                            mcdu.radioNav.setADFActiveFrequency(1, mcdu.adf1Frequency);
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            scratchpadCallback();
                        }
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3,4}(\.\d{1})?$/.test(value)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        scratchpadCallback();
                        return false;
                    }
                    if (numValue < 190 || numValue > 1750) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        scratchpadCallback();
                        return false;
                    }
                    SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        mcdu.adf1FreqIsPilotEntered = true;
                        mcdu.adf1IdIsPilotEntered = false;
                        mcdu.adf1Frequency = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.adf1FreqIsPilotEntered = false;
                    mcdu.adf1IdIsPilotEntered = false;
                    mcdu.adf1Frequency = 0;
                    mcdu.radioNav.setADFActiveFrequency(1, 0);
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                }
            };
        }

        if (!radioOn) {
            vor2FrequencyCell = "[\xa0\xa0.\xa0]/[\xa0]";
            const vor2Beacon = mcdu.radioNav.getVORBeacon(2);
            const vor2Ident = vor2Beacon && vor2Beacon.ident.length >= 2 && vor2Beacon.ident.length <= 3 ? vor2Beacon.ident : "";
            if (mcdu.vor2Frequency != 0 && mcdu.vor2FreqIsPilotEntered && !mcdu.vor2IdIsPilotEntered) {
                vor2FrequencyCell = mcdu.vor2Frequency.toFixed(2) + "/" + "{small}" + vor2Ident.padEnd(3, "\xa0") + "{end}";
            } else if (mcdu.vor2Frequency != 0 && !mcdu.vor2FreqIsPilotEntered && mcdu.vor2IdIsPilotEntered) {
                vor2FrequencyCell = "{small}" + mcdu.vor2Frequency.toFixed(2) + "{end}" + "/" + mcdu.vor2IdPilotValue.padEnd(3, "\xa0");
            }
            mcdu.onRightInput[0] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor2FreqIsPilotEntered = false;
                    mcdu.vor2IdIsPilotEntered = false;
                    mcdu.vor2Frequency = 0;
                    mcdu.vor2Course = 0;
                    mcdu.radioNav.setVORActiveFrequency(2, 0);
                    CDUNavRadioPage.ShowPage(mcdu);
                } else if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    mcdu.getOrSelectVORsByIdent(value, (navaids) => {
                        if (navaids) {
                            mcdu.vor2IdIsPilotEntered = true;
                            mcdu.vor2FreqIsPilotEntered = false;
                            mcdu.vor2IdPilotValue = value;
                            mcdu.vor2Frequency = navaids.infos.frequencyMHz;
                            mcdu.radioNav.setVORActiveFrequency(2, mcdu.vor2Frequency);
                            mcdu.vor2Course = 0;
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            scratchpadCallback();
                        }
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3}(\.\d{1,2})?$/.test(value) || !RadioNav.isHz50Compliant(numValue)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        scratchpadCallback();
                        return false;
                    }
                    if (numValue < 108 || numValue > 117.95) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        scratchpadCallback();
                        return false;
                    }
                    mcdu.vor2FreqIsPilotEntered = true;
                    mcdu.vor2IdIsPilotEntered = false;
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
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                }
            };
            vor2CourseCell = "[\xa0]";
            if (mcdu.vor2Course > 0) {
                vor2CourseCell = mcdu.vor2Course.toFixed(0).padStart(3, "0");
            }
            mcdu.onRightInput[1] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (isFinite(numValue) && numValue > 0 && numValue <= 360) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", numValue).then(() => {
                        mcdu.vor2Course = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.vor2Course = 0;
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                }
            };
            adf2FrequencyCell = "[\xa0\xa0\xa0.]/[\xa0]";
            const adf2Ident = SimVar.GetSimVarValue(`ADF IDENT:2`, "string");
            if (mcdu.adf2Frequency > 0 && mcdu.adf2FreqIsPilotEntered && !mcdu.adf2IdIsPilotEntered) {
                adf2FrequencyCell = mcdu.adf2Frequency.toFixed(1) + "/" + "{small}" + adf2Ident.padEnd(3, "\xa0") + "{end}";
                adf2BfoOption = "ADF2 BFO>";
            } else if (mcdu.adf2Frequency > 0 && !mcdu.adf2FreqIsPilotEntered && mcdu.adf2IdIsPilotEntered) {
                adf2FrequencyCell = "{small}" + mcdu.adf2Frequency.toFixed(1) + "{end}" + "/" + mcdu.adf2IdPilotValue.padEnd(3, "\xa0");
                adf2BfoOption = "ADF2 BFO>";
            }
            mcdu.onRightInput[4] = (value, scratchpadCallback) => {
                const numValue = parseFloat(value);
                if (!isFinite(numValue) && value.length >= 2 && value.length <= 3) {
                    mcdu.adf2FreqIsPilotEntered = false;
                    mcdu.adf2IdIsPilotEntered = true;
                    mcdu.adf2IdPilotValue = value;
                    mcdu.getOrSelectNDBsByIdent(value, (navaids) => {
                        if (navaids) {
                            mcdu.adf2Frequency = navaids.infos.frequencyMHz;
                            mcdu.radioNav.setADFActiveFrequency(2, mcdu.adf2Frequency);
                            mcdu.requestCall(() => {
                                CDUNavRadioPage.ShowPage(mcdu);
                            });
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                            scratchpadCallback();
                        }
                    });
                } else if (isFinite(numValue)) {
                    if (!/^\d{3,4}(\.\d{1})?$/.test(value)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        scratchpadCallback();
                        return false;
                    }
                    if (numValue < 190 || numValue > 1750) {
                        mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                        scratchpadCallback();
                        return false;
                    }
                    SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(numValue * 1000)).then(() => {
                        mcdu.adf2FreqIsPilotEntered = true;
                        mcdu.adf2IdIsPilotEntered = false;
                        mcdu.adf2Frequency = numValue;
                        mcdu.requestCall(() => {
                            CDUNavRadioPage.ShowPage(mcdu);
                        });
                    });
                } else if (value === FMCMainDisplay.clrValue) {
                    mcdu.adf2FreqIsPilotEntered = false;
                    mcdu.adf2IdIsPilotEntered = false;
                    mcdu.adf2Frequency = 0;
                    mcdu.radioNav.setADFActiveFrequency(2, 0);
                    adf2FrequencyCell = "[\xa0\xa0.]/[\xa0]";
                    CDUNavRadioPage.ShowPage(mcdu);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
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
CDUNavRadioPage._timer = 0;

// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

class CDUFixInfoPage {
    static ShowPage(mcdu, page = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FixInfoPage;
        mcdu.returnPageCallback = () => {
            CDUFixInfoPage.ShowPage(mcdu, page);
        };
        mcdu.activeSystem = 'FMGC';

        const fixInfo = mcdu.flightPlanService.active.fixInfos[page];

        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                if (fixInfo.fix) {
                    mcdu.flightPlanService.setFixInfoEntry(page, null);

                    return CDUFixInfoPage.ShowPage(mcdu, page);
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                    return scratchpadCallback();
                }
            }
            if (mcdu.isPlaceFormat(value)) {
                mcdu.parsePlace(value).then((runway) => {
                    mcdu.flightPlanService.setFixInfoEntry(page, {
                        fix: runway,
                        radii: [],
                        radials: [],
                    });

                    CDUFixInfoPage.ShowPage(mcdu, page);
                }).catch((message) => {
                    if (message instanceof McduMessage) {
                        mcdu.setScratchpadMessage(message);

                        scratchpadCallback();
                    } else {
                        console.error(err);
                    }
                });
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);

                scratchpadCallback();
            }
        };

        const template = [
            [`\xa0\xa0\xa0\xa0\xa0FIX INFO\xa0\xa0{small}${page + 1}/4{end}`],
            [`REF FIX ${page + 1}`],
            ['{amber}_______{end}'],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
        ];

        if (fixInfo && fixInfo.fix) {
            template[2] = [`{cyan}${fixInfo.fix.ident}{end}`];
            template[3] = ['\xa0RADIAL\xa0\xa0TIME\xa0\xa0DTG\xa0\xa0ALT'];

            for (let i = 0; i <= 1; i++) {
                const radial = fixInfo.radials[i];

                if (radial !== undefined) {
                    template[4 + i * 2] = [`\xa0{cyan}${("" + radial.magneticBearing).padStart(3, "0")}°{end}\xa0\xa0\xa0\xa0----\xa0----\xa0----`];
                } else if (i === 0 || fixInfo.radials[0] !== undefined) {
                    template[4 + i * 2] = [`\xa0{cyan}[\xa0]°{end}\xa0\xa0\xa0\xa0----\xa0----\xa0----`];
                }

                mcdu.onLeftInput[1 + i] = (value, scratchpadCallback) => {
                    if (value === FMCMainDisplay.clrValue) {
                        if (radial !== undefined) {
                            mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                                fixInfo.radials.splice(i);
                            });

                            CDUFixInfoPage.ShowPage(mcdu, page);
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                            scratchpadCallback();
                        }
                    } else if (value.match(/^[0-9]{1,3}$/)) {
                        const degrees = parseInt(value);

                        if (degrees <= 360) {
                            const magvar = Facilities.getMagVar(fixInfo.fix.location.lat, fixInfo.fix.location.long);

                            mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                                fixInfo.radials[i] = { magneticBearing: degrees, trueBearing: A32NX_Util.magneticToTrue(degrees, magvar) };
                            });

                            CDUFixInfoPage.ShowPage(mcdu, page);
                        } else {
                            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);

                            scratchpadCallback();
                        }
                    } else if (value === '' && radial !== undefined) {
                        mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);

                        scratchpadCallback();
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.formatError);

                        scratchpadCallback();
                    }
                };
            }

            template[7] = ['\xa0RADIUS'];
            if (fixInfo.radii[0] !== undefined) {
                template[8] = [`\xa0{cyan}${("" + fixInfo.radii[0].radius).padStart(3, "\xa0")}{small}NM{end}{end}\xa0\xa0\xa0----\xa0----\xa0----`];
            } else {
                template[8] = [`\xa0{cyan}[\xa0]{small}NM{end}{end}\xa0\xa0\xa0----\xa0----\xa0----`];
            }

            mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
                if (value === FMCMainDisplay.clrValue) {
                    if (fixInfo.radii[0] !== undefined) {
                        mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                            fixInfo.radii.length = 0;
                        });

                        CDUFixInfoPage.ShowPage(mcdu, page);
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                        scratchpadCallback();
                    }
                } else if (value.match(/^[0-9]{1,3}$/)) {
                    const radius = parseInt(value);
                    if (radius >= 1 && radius <= 256) {
                        mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                            if (fixInfo.radii[0]) {
                                fixInfo.radii[0].radius = radius;
                            } else {
                                fixInfo.radii[0] = { radius };
                            }
                        });

                        CDUFixInfoPage.ShowPage(mcdu, page);
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                        scratchpadCallback();
                    }
                } else if (value === '' && fixInfo.radii[0] !== undefined) {
                    mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);

                    scratchpadCallback();
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);

                    scratchpadCallback();
                }
            };

            template[10] = ['{inop}<ABEAM{end}'];
            mcdu.onLeftInput[4] = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        }

        mcdu.setArrows(false, false, true, true);
        mcdu.setTemplate(template);
        mcdu.onPrevPage = () => {
            if (page > 0) {
                CDUFixInfoPage.ShowPage(mcdu, page - 1);
            } else {
                CDUFixInfoPage.ShowPage(mcdu, 3);
            }
        };
        mcdu.onNextPage = () => {
            if (page < 3) {
                CDUFixInfoPage.ShowPage(mcdu, page + 1);
            } else {
                CDUFixInfoPage.ShowPage(mcdu, 0);
            }
        };
    }
}

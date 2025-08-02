// @ts-strict-ignore
// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { A32NX_Util } from '../../../../shared/src/A32NX_Util';
import { McduMessage, NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';

export class CDUFixInfoPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, page: 1 | 2 | 3 | 4 = 1) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FixInfoPage;
    mcdu.returnPageCallback = () => {
      CDUFixInfoPage.ShowPage(mcdu, page);
    };
    mcdu.activeSystem = 'FMGC';

    const fixInfo = mcdu.flightPlanService.active.fixInfos[page];

    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        if (fixInfo.fix) {
          mcdu.flightPlanService.setFixInfoEntry(page, null);

          return CDUFixInfoPage.ShowPage(mcdu, page);
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

          return scratchpadCallback();
        }
      }
      if (WaypointEntryUtils.isPlaceFormat(value)) {
        WaypointEntryUtils.parsePlace(mcdu, value)
          .then((runway) => {
            mcdu.flightPlanService.setFixInfoEntry(page, new FixInfoEntry(runway));

            CDUFixInfoPage.ShowPage(mcdu, page);
          })
          .catch((message) => {
            if (message.type !== undefined) {
              mcdu.showFmsErrorMessage(message.type);
            } else if (message instanceof McduMessage) {
              mcdu.setScratchpadMessage(message);

              scratchpadCallback();
            } else {
              console.error(message);
            }
          });
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);

        scratchpadCallback();
      }
    };

    const template = [
      [`\xa0\xa0\xa0\xa0\xa0FIX INFO\xa0\xa0{small}${page}/4{end}`],
      [`REF FIX ${page}`],
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
        const radial = fixInfo.radials?.[i];

        if (radial !== undefined) {
          template[4 + i * 2] = [
            `\xa0{cyan}${('' + radial.magneticBearing).padStart(3, '0')}°{end}\xa0\xa0\xa0\xa0----\xa0----\xa0----`,
          ];
        } else if (i === 0 || fixInfo.radials?.[0] !== undefined) {
          template[4 + i * 2] = [`\xa0{cyan}[\xa0]°{end}\xa0\xa0\xa0\xa0----\xa0----\xa0----`];
        }

        mcdu.onLeftInput[1 + i] = (value, scratchpadCallback) => {
          if (value === Keypad.clrValue) {
            if (radial !== undefined) {
              mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                fixInfo.radials.splice(i);
                return fixInfo;
              });

              CDUFixInfoPage.ShowPage(mcdu, page);
            } else {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

              scratchpadCallback();
            }
          } else if (value.match(/^[0-9]{1,3}$/)) {
            const degrees = parseInt(value);

            if (degrees <= 360) {
              mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
                if (!fixInfo.radials) {
                  fixInfo.radials = [];
                }
                fixInfo.radials[i] = {
                  magneticBearing: degrees,
                  trueBearing: A32NX_Util.magneticToTrue(degrees, A32NX_Util.getRadialMagVar(fixInfo.fix)),
                };
                return fixInfo;
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
      if (fixInfo.radii?.[0] !== undefined) {
        template[8] = [
          `\xa0{cyan}${('' + fixInfo.radii[0].radius).padStart(3, '\xa0')}{small}NM{end}{end}\xa0\xa0\xa0----\xa0----\xa0----`,
        ];
      } else {
        template[8] = [`\xa0{cyan}[\xa0]{small}NM{end}{end}\xa0\xa0\xa0----\xa0----\xa0----`];
      }

      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          if (fixInfo.radii?.[0] !== undefined) {
            mcdu.flightPlanService.editFixInfoEntry(page, (fixInfo) => {
              fixInfo.radii.length = 0;
              return fixInfo;
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
              if (!fixInfo.radii) {
                fixInfo.radii = [];
              }
              if (fixInfo.radii?.[0]) {
                fixInfo.radii[0].radius = radius;
              } else {
                fixInfo.radii[0] = { radius };
              }
              return fixInfo;
            });

            CDUFixInfoPage.ShowPage(mcdu, page);
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            scratchpadCallback();
          }
        } else if (value === '' && fixInfo.radii?.[0] !== undefined) {
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
      if (page >= 2) {
        CDUFixInfoPage.ShowPage(mcdu, (page - 1) as 1 | 2 | 3 | 4);
      } else {
        CDUFixInfoPage.ShowPage(mcdu, 4);
      }
    };
    mcdu.onNextPage = () => {
      if (page <= 3) {
        CDUFixInfoPage.ShowPage(mcdu, (page + 1) as 1 | 2 | 3 | 4);
      } else {
        CDUFixInfoPage.ShowPage(mcdu, 1);
      }
    };
  }
}

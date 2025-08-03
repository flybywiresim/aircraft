// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtisType, AtsuStatusCodes } from '@datalink/common';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Keypad } from '../../legacy/A320_Neo_CDU_Keypad';
import { CDUAocMenu } from './A320_Neo_CDU_AOC_Menu';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

// FIXME cannot access the flight phase manager!

export class CDUAocRequestsAtis {
  static CreateDataBlock(mcdu: LegacyAtsuPageInterface): any {
    const retval = {
      requestId: mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight ? AtisType.Departure : AtisType.Arrival,
      departure: '',
      arrival: '',
      selected: '',
      manual: false,
      formatID: 1,
      sendStatus: '',
    };

    const activePlan = mcdu.flightPlanService.active;

    if (activePlan.originAirport) {
      retval.departure = activePlan.originAirport.ident;

      if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight) {
        retval.selected = retval.departure;
      }
    }

    if (activePlan.destinationAirport) {
      retval.arrival = activePlan.destinationAirport.ident;

      if (mcdu.flightPhaseManager.phase !== FmgcFlightPhase.Preflight) {
        retval.selected = retval.arrival;
      }
    }

    return retval;
  }

  static ShowPage(mcdu: LegacyAtsuPageInterface, store = CDUAocRequestsAtis.CreateDataBlock(mcdu)) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AOCRequestAtis;
    let labelTimeout;
    let formatString;

    if (store.formatID === 0) {
      formatString = 'PRINTER*[color]cyan';
    } else {
      formatString = 'MCDU*[color]cyan';
    }

    let arrivalText = '{ARRIVAL[color]cyan';
    let departureText = '{DEPARTURE[color]cyan';
    let enrouteText = 'ENROUTE}[color]cyan';

    if (store.requestId === AtisType.Arrival) {
      arrivalText = 'ARRIVAL[color]cyan';
    } else if (store.requestId === AtisType.Departure) {
      departureText = 'DEPARTURE[color]cyan';
    } else {
      enrouteText = 'ENROUTE[color]cyan';
    }

    let arrText = '[ ]';
    if (store.selected !== '') {
      arrText = store.selected;
      if (!store.manual) {
        arrText += '[s-text]';
      }
    }

    const updateView = () => {
      if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
        let sendMessage = 'SEND*[color]cyan';
        if (store.selected === '' || store.sendStatus === 'SENDING') {
          sendMessage = 'SEND\xa0[color]cyan';
        }

        mcdu.setTemplate([
          ['AOC ATIS REQUEST'],
          ['\xa0AIRPORT', '↓FORMAT FOR\xa0'],
          [`${arrText}[color]cyan`, formatString],
          ['', '', '-------SELECT ONE-------'],
          [arrivalText, enrouteText],
          [''],
          [departureText],
          [''],
          [''],
          [''],
          [''],
          ['\xa0RETURN TO', `${store.sendStatus}\xa0`],
          ['<AOC MENU', sendMessage],
        ]);
      }
    };
    updateView();

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = (value) => {
      if (value === Keypad.clrValue) {
        store.selected = '';
        CDUAocRequestsAtis.ShowPage(mcdu, store);
      } else if (value) {
        store.selected = value;
        store.manual = true;

        if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
          CDUAocRequestsAtis.ShowPage(mcdu, store);
        }
      }
    };
    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = () => {
      if (store.reqID !== AtisType.Arrival) {
        if (!store.manual) {
          store.selected = store.arrival;
        }
        store.requestId = AtisType.Arrival;
      }
      CDUAocRequestsAtis.ShowPage(mcdu, store);
    };
    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      if (store.reqID !== AtisType.Departure) {
        if (!store.manual) {
          store.selected = store.departure;
        }
        store.requestId = AtisType.Departure;
      }
      CDUAocRequestsAtis.ShowPage(mcdu, store);
    };
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      clearTimeout(labelTimeout);
      CDUAocMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[0] = () => {
      store.formatID = (store.formatID + 1) % 2;
      CDUAocRequestsAtis.ShowPage(mcdu, store);
    };
    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = () => {
      if (store.reqID !== AtisType.Enroute) {
        store.requestId = AtisType.Enroute;
      }
      CDUAocRequestsAtis.ShowPage(mcdu, store);
    };
    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = async () => {
      store.sendStatus = 'SENDING';
      updateView();

      const onRequestSent = () => {
        store.sendStatus = 'SENT';
        if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
          updateView();
        }
      };

      mcdu.atsu.receiveAocAtis(store.selected, store.requestId, onRequestSent).then((retval) => {
        if (retval[0] === AtsuStatusCodes.Ok) {
          retval[1].Confirmed = store.formatID === 0;
          mcdu.atsu.registerMessages([retval[1]]);
          store.sendStatus = '';
          if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
            CDUAocRequestsAtis.ShowPage(mcdu, store);
          }

          // print the message
          if (store.formatID === 0) {
            mcdu.atsu.printAocAtis(retval[1]);
          }
        } else {
          mcdu.addNewAtsuMessage(retval[0]);

          if (mcdu.page.Current === mcdu.page.AOCRequestAtis) {
            store.sendStatus = 'FAILED';
            CDUAocRequestsAtis.ShowPage(mcdu, store);
          }
        }
      });
    };
  }
}

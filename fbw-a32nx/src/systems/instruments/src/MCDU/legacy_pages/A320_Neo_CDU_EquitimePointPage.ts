// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FormatTemplate, Column } from '../legacy/A320_Neo_CDU_Format';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { CDUWindPage } from './A320_Neo_CDU_WindPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { formatWindVector } from '@fmgc/flightplanning/data/wind';
import { FmsError } from '@fmgc/FmsError';

export class CDUEquitimePointPage {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.EquitimePointPage;
    mcdu.activeSystem = 'FMGC';

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.EquitimePointPage) {
        CDUEquitimePointPage.ShowPage(mcdu);
      }
    }, mcdu.PageTimeout.Medium);

    const plan = mcdu.getFlightPlan(FlightPlanIndex.Active);

    const ref1IdentColumn = new Column(0, '[     ]', Column.cyan, Column.big);
    const ref1BrgColumn = new Column(9, '---', Column.white, Column.big);
    const ref1DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const ref1UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindRef1LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToRef1LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindRef1Column = new Column(0, '', Column.cyan, Column.big);
    const etpToRef1BrgColumn = new Column(9, '', Column.white, Column.small);
    const etpToRef1DistColumn = new Column(18, '', Column.white, Column.small, Column.right);
    const etpToRef1UtcColumn = new Column(20, '', Column.white, Column.small);

    const ref2IdentColumn = new Column(0, '[     ]', Column.cyan, Column.big);
    const ref2BrgColumn = new Column(9, '---', Column.white, Column.big);
    const ref2DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const ref2UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindRef2LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToRef2LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindRef2Column = new Column(0, '', Column.cyan, Column.big);
    const etpToRef2BrgColumn = new Column(9, '', Column.white, Column.small);
    const etpToRef2DistColumn = new Column(18, '', Column.white, Column.small, Column.right);
    const etpToRef2UtcColumn = new Column(20, '', Column.white, Column.small);

    const etpLocationLabelColumn = new Column(11, '', Column.white, Column.small);

    const etpLocationLegColumn = new Column(16, '', Column.white, Column.right, Column.big);
    const etpLocationLegDistanceColumn = new Column(23, '', Column.white, Column.right, Column.big);

    const acToLabelColumn = new Column(0, '', Column.white, Column.small);
    const acToColumn = new Column(0, '', Column.white, Column.big);
    const acToDistColumn = new Column(18, '----', Column.white, Column.right, Column.big);
    const acToUtcColumn = new Column(20, '----', Column.white, Column.big);

    const etpService = mcdu.equitimePoint;

    if (etpService.referenceFix1 !== undefined) {
      const ref1Ident = etpService.referenceFix1.ident;

      ref1IdentColumn.update(
        ref1Ident,
        Column.cyan,
        etpService.isReferenceFix1PilotEntered ? Column.big : Column.small,
      );
      if (etpService.pposBearingToReferenceFix1 !== undefined) {
        ref1BrgColumn.update(`${etpService.pposBearingToReferenceFix1.toFixed(0).padStart(3, '0')}°`, Column.green);
      }
      if (etpService.pposDistanceToReferenceFix1 !== undefined) {
        ref1DistColumn.update(etpService.pposDistanceToReferenceFix1.toFixed(0), Column.green);
      }

      if (etpService.pposTimeToReferenceFix1 !== undefined) {
        ref1UtcColumn.update(
          mcdu.getTimePrediction(etpService.pposTimeToReferenceFix1 * 3600, FlightPlanIndex.Active),
          Column.green,
        );
      }

      trueWindRef1LabelColumn.update('TRU WIND');

      trueWindRef1Column.update(
        etpService.isWindToReferenceFix1PilotEntered
          ? `${formatWindVector(etpService.windToReferenceFix1)}`
          : '[ ]°/[ ]',
      );

      // Update wind 1
      mcdu.onLeftInput[1] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            etpService.setPilotEnteredWindToReferenceFix1(undefined);
          } else {
            const wind = CDUWindPage.parseWindVector(mcdu, value);
            if (!wind) {
              mcdu.setScratchpadMessage(NXSystemMessages.formatError);
              scratchpadCallback();
              return;
            }

            etpService.setPilotEnteredWindToReferenceFix1(wind);
          }

          CDUEquitimePointPage.ShowPage(mcdu);
        } catch (err) {
          console.error(err);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    if (etpService.referenceFix2 !== undefined) {
      const ref2Ident = etpService.referenceFix2.ident;

      ref2IdentColumn.update(
        ref2Ident,
        Column.cyan,
        etpService.isReferenceFix2PilotEntered ? Column.big : Column.small,
      );
      if (etpService.pposBearingToReferenceFix2 !== undefined) {
        ref2BrgColumn.update(`${etpService.pposBearingToReferenceFix2.toFixed(0).padStart(3, '0')}°`, Column.green);
      }
      if (etpService.pposDistanceToReferenceFix2 !== undefined) {
        ref2DistColumn.update(etpService.pposDistanceToReferenceFix2.toFixed(0), Column.green);
      }

      if (etpService.pposTimeToReferenceFix2 !== undefined) {
        ref2UtcColumn.update(
          mcdu.getTimePrediction(etpService.pposTimeToReferenceFix2 * 3600, FlightPlanIndex.Active),
          Column.green,
        );
      }

      trueWindRef2LabelColumn.update('TRU WIND');

      trueWindRef2Column.update(
        etpService.isWindToReferenceFix2PilotEntered
          ? `${formatWindVector(etpService.windToReferenceFix2)}`
          : '[ ]°/[ ]',
      );

      // Update wind 2
      mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            etpService.setPilotEnteredWindToReferenceFix2(undefined);
          } else {
            const wind = CDUWindPage.parseWindVector(mcdu, value);
            if (!wind) {
              mcdu.setScratchpadMessage(NXSystemMessages.formatError);
              scratchpadCallback();
              return;
            }

            etpService.setPilotEnteredWindToReferenceFix2(wind);
          }

          CDUEquitimePointPage.ShowPage(mcdu);
        } catch (err) {
          console.error(err);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    if (etpService.referenceFix1 !== undefined || etpService.referenceFix2 !== undefined) {
      acToColumn.update('NO (ETP)');
    }

    const etp = etpService.get();
    if (etpService.referenceFix1 !== undefined && etpService.referenceFix2 !== undefined && etp) {
      if (etpService.etpBearingToReferenceFix1 !== undefined) {
        etpToRef1BrgColumn.update(`${etpService.etpBearingToReferenceFix1.toFixed(0).padStart(3, '0')}°`, Column.green);
      }

      if (etpService.etpDistanceToReferenceFix1 !== undefined) {
        etpToRef1DistColumn.update(etpService.etpDistanceToReferenceFix1.toFixed(0), Column.green);
      }

      if (etpService.etpBearingToReferenceFix2 !== undefined) {
        etpToRef2BrgColumn.update(`${etpService.etpBearingToReferenceFix2.toFixed(0).padStart(3, '0')}°`, Column.green);
      }

      if (etpService.etpDistanceToReferenceFix2 !== undefined) {
        etpToRef2DistColumn.update(etpService.etpDistanceToReferenceFix2.toFixed(0), Column.green);
      }

      etpToRef1LabelColumn.update(`ETP TO ${etpService.referenceFix1.ident}`);
      etpToRef2LabelColumn.update(`ETP TO ${etpService.referenceFix2.ident}`);

      etpLocationLabelColumn.update('ETP LOCATION');
      acToLabelColumn.update('A/C TO');

      const legIdent = plan.legElementAt(etp[2])?.ident;

      etpLocationLegColumn.update(legIdent ?? '-----', legIdent ? Column.green : Column.white);
      etpLocationLegDistanceColumn.update(`/${(-etp[1]).toFixed(1).padStart(6, ' ')}`, Column.green);

      acToColumn.update('(ETP)', Column.green);

      if (etpService.pposDistanceToEtp !== undefined && etpService.pposTimeToEtp !== undefined) {
        acToDistColumn.update(etpService.pposDistanceToEtp.toFixed(0), Column.green);

        acToUtcColumn.update(
          mcdu.getTimePrediction(etpService.pposTimeToEtp * 3600, FlightPlanIndex.Active),
          Column.green,
        );

        if (etpService.etpTimeToReferenceFix1 !== undefined) {
          etpToRef1UtcColumn.update(
            mcdu.getTimePrediction(etpService.etpTimeToReferenceFix1 * 3600, FlightPlanIndex.Active),
            Column.green,
          );
        }

        if (etpService.etpTimeToReferenceFix2 !== undefined) {
          etpToRef2UtcColumn.update(
            mcdu.getTimePrediction(etpService.etpTimeToReferenceFix2 * 3600, FlightPlanIndex.Active),
            Column.green,
          );
        }
      }
    }

    // Reference 1
    mcdu.onLeftInput[0] = async (value, scratchpadCallback) => {
      etpService
        .setPilotEnteredReferenceFix1(
          value === Keypad.clrValue ? undefined : await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false),
        )
        .then(() => {
          CDUEquitimePointPage.ShowPage(mcdu);
        })
        .catch((err) => {
          if (err instanceof FmsError) {
            mcdu.showFmsErrorMessage(err.type);
          } else {
            console.error(err);
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          }
        })
        .finally(() => {
          scratchpadCallback();
        });
    };

    // Reference 2
    mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
      etpService
        .setPilotEnteredReferenceFix2(
          value === Keypad.clrValue ? undefined : await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false),
        )
        .then(() => {
          CDUEquitimePointPage.ShowPage(mcdu);
        })
        .catch((err) => {
          if (err instanceof FmsError) {
            mcdu.showFmsErrorMessage(err.type);
          } else {
            console.error(err);
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          }
        })
        .finally(() => {
          scratchpadCallback();
        });
    };

    const timeHeader = mcdu.getTimePredictionHeader(FlightPlanIndex.Active);

    mcdu.setTemplate(
      FormatTemplate([
        [new Column(4, 'EQUI-TIME POINT')],
        [
          new Column(0, 'A/C TO', Column.white, Column.small),
          new Column(9, 'BRG', Column.white, Column.small),
          new Column(18, 'DIST', Column.white, Column.small, Column.right),
          new Column(20, timeHeader, Column.white, Column.small),
        ],
        [ref1IdentColumn, ref1BrgColumn, ref1DistColumn, ref1UtcColumn],
        [trueWindRef1LabelColumn, etpToRef1LabelColumn],
        [trueWindRef1Column, etpToRef1BrgColumn, etpToRef1DistColumn, etpToRef1UtcColumn],
        [],
        [ref2IdentColumn, ref2BrgColumn, ref2DistColumn, ref2UtcColumn],
        [trueWindRef2LabelColumn, etpToRef2LabelColumn],
        [trueWindRef2Column, etpToRef2BrgColumn, etpToRef2DistColumn, etpToRef2UtcColumn],
        [etpLocationLabelColumn],
        [etpLocationLegColumn, etpLocationLegDistanceColumn],
        [acToLabelColumn, new Column(15, 'DIST'), new Column(20, timeHeader)],
        [acToColumn, acToDistColumn, acToUtcColumn],
      ]),
    );
  }
}

import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FormatTemplate, Column } from '../legacy/A320_Neo_CDU_Format';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { CDUWindPage } from './A320_Neo_CDU_WindPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';

export class CDUEquitimePointPage {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.EquitimePointPage;
    mcdu.activeSystem = 'FMGC';

    const plan = mcdu.getFlightPlan(FlightPlanIndex.Active);

    const ref1IdentColumn = new Column(0, '[    ]', Column.cyan, Column.big);
    const ref1BrgColumn = new Column(9, '---', Column.white, Column.big);
    const ref1DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const ref1UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindRef1LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToRef1LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindRef1Column = new Column(0, '', Column.cyan, Column.big);
    const etpToRef1BrgColumn = new Column(9, '', Column.white, Column.small);
    const etpToRef1DistColumn = new Column(18, '', Column.white, Column.small, Column.right);
    const etpToRef1UtcColumn = new Column(20, '', Column.white, Column.small);

    const ref2IdentColumn = new Column(0, '[    ]', Column.cyan, Column.big);
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
    const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

    if (etpService.referenceFix1 !== undefined) {
      const ref1Ident = etpService.referenceFix1.ident;

      ref1IdentColumn.update(
        ref1Ident,
        Column.cyan,
        etpService.isReferenceFix1PilotEntered ? Column.big : Column.small,
      );
      ref1BrgColumn.update(`${etpService.pposBearingToReferenceFix1.toFixed(0).padStart(3, '0')}°T`, Column.green);
      ref1DistColumn.update(etpService.pposDistanceToReferenceFix1.toFixed(0), Column.green);

      if (Number.isFinite(etpService.pposTimeToReferenceFix1)) {
        ref1UtcColumn.update(
          FmsFormatters.secondsToUTC(utcTime + etpService.pposTimeToReferenceFix1 * 3600),
          Column.green,
        );
      }

      trueWindRef1LabelColumn.update('TRU WIND');
      etpToRef1LabelColumn.update(`ETP TO ${ref1Ident}`);

      trueWindRef1Column.update(
        etpService.isWindToReferenceFix1PilotEntered
          ? `${MathUtils.normalise360(Vec2Math.theta(etpService.windToReferenceFix1) * MathUtils.RADIANS_TO_DEGREES)
              .toFixed(0)
              .padStart(3, '0')}°/${Vec2Math.abs(etpService.windToReferenceFix1).toFixed(0).padStart(3, '0')}`
          : '000°/000',
        etpService.isWindToReferenceFix1PilotEntered ? Column.big : Column.small,
      );

      etpToRef1BrgColumn.update('----');
      if (Number.isFinite(etpService.etpBearingToReferenceFix1)) {
        etpToRef1BrgColumn.update(
          `${etpService.etpBearingToReferenceFix1.toFixed(0).padStart(3, '0')}°T`,
          Column.green,
        );
      }

      etpToRef1DistColumn.update('----');
      if (Number.isFinite(etpService.etpDistanceToReferenceFix1)) {
        etpToRef1DistColumn.update(etpService.etpDistanceToReferenceFix1.toFixed(0), Column.green);
      }

      etpToRef1UtcColumn.update('----');
      if (Number.isFinite(etpService.etpTimeToReferenceFix1)) {
        etpToRef1UtcColumn.update(
          FmsFormatters.secondsToUTC(utcTime + etpService.etpTimeToReferenceFix1 * 3600),
          Column.green,
        );
      }

      // Update wind 1
      mcdu.onLeftInput[1] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            etpService.setPilotEnteredWindToReferenceFix1(undefined);
          } else {
            const wind = CDUWindPage.ParseWind(value);
            if (!wind) {
              mcdu.setScratchpadMessage(NXSystemMessages.formatError);
              scratchpadCallback();
              return;
            }

            etpService.setPilotEnteredWindToReferenceFix1(
              Vec2Math.setFromPolar(wind.speed, wind.direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
            );
          }

          CDUEquitimePointPage.ShowPage(mcdu);
          await etpService.resetAndRecompute();
          CDUEquitimePointPage.ShowPage(mcdu);
        } catch (err) {
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
      ref2BrgColumn.update(`${etpService.pposBearingToReferenceFix2.toFixed(0).padStart(3, '0')}°T`, Column.green);
      ref2DistColumn.update(etpService.pposDistanceToReferenceFix2.toFixed(0), Column.green);

      if (Number.isFinite(etpService.pposTimeToReferenceFix2)) {
        ref2UtcColumn.update(
          FmsFormatters.secondsToUTC(utcTime + etpService.pposTimeToReferenceFix2 * 3600),
          Column.green,
        );
      }

      trueWindRef2LabelColumn.update('TRU WIND');
      etpToRef2LabelColumn.update(`ETP TO ${ref2Ident}`);

      trueWindRef2Column.update(
        etpService.isWindToReferenceFix2PilotEntered
          ? `${MathUtils.normalise360(Vec2Math.theta(etpService.windToReferenceFix2) * MathUtils.RADIANS_TO_DEGREES)
              .toFixed(0)
              .padStart(3, '0')}°/${Vec2Math.abs(etpService.windToReferenceFix2).toFixed(0).padStart(3, '0')}`
          : '000°/000',
        etpService.isWindToReferenceFix2PilotEntered ? Column.big : Column.small,
      );

      etpToRef2BrgColumn.update('----');
      if (Number.isFinite(etpService.etpBearingToReferenceFix2)) {
        etpToRef2BrgColumn.update(
          `${etpService.etpBearingToReferenceFix2.toFixed(0).padStart(3, '0')}°T`,
          Column.green,
        );
      }

      etpToRef2DistColumn.update('----');
      if (Number.isFinite(etpService.etpDistanceToReferenceFix2)) {
        etpToRef2DistColumn.update(etpService.etpDistanceToReferenceFix2.toFixed(0), Column.green);
      }

      etpToRef2UtcColumn.update('----');
      if (Number.isFinite(etpService.etpTimeToReferenceFix2)) {
        etpToRef2UtcColumn.update(
          FmsFormatters.secondsToUTC(utcTime + etpService.etpTimeToReferenceFix2 * 3600),
          Column.green,
        );
      }

      // Update wind 2
      mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            etpService.setPilotEnteredWindToReferenceFix2(undefined);
          } else {
            const wind = CDUWindPage.ParseWind(value);
            if (!wind) {
              mcdu.setScratchpadMessage(NXSystemMessages.formatError);
              scratchpadCallback();
              return;
            }

            etpService.setPilotEnteredWindToReferenceFix2(
              Vec2Math.setFromPolar(wind.speed, wind.direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
            );
          }

          CDUEquitimePointPage.ShowPage(mcdu);
          await etpService.resetAndRecompute();
          CDUEquitimePointPage.ShowPage(mcdu);
        } catch (err) {
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    if (etpService.referenceFix2 !== undefined || etpService.referenceFix2 !== undefined) {
      etpLocationLegColumn.update('-----');
      etpLocationLegDistanceColumn.update('/-----');

      etpLocationLabelColumn.update('ETP LOCATION');
      acToDistColumn.update('----');
      acToUtcColumn.update('----');

      acToLabelColumn.update('A/C TO');
      acToColumn.update('(NO ETP)');
      if (etpService?.isComputed()) {
        const etp = etpService.get();
        const legIdent = plan.legElementAt(etp[2])?.ident;

        etpLocationLegColumn.update(legIdent ?? '-----', legIdent ? Column.green : Column.white);
        etpLocationLegDistanceColumn.update(`/${(-etp[1]).toFixed(1).padStart(6, ' ')}`, Column.green);

        acToColumn.update('(ETP)');
        acToDistColumn.update('412', Column.green);
        acToUtcColumn.update('1744', Column.green);
      }
    }

    // Reference 1
    mcdu.onLeftInput[0] = async (value, scratchpadCallback) => {
      try {
        if (value === Keypad.clrValue) {
          etpService.setPilotEnteredReferenceFix1(undefined);
        } else {
          etpService.setPilotEnteredReferenceFix1(await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false));
        }

        CDUEquitimePointPage.ShowPage(mcdu);
        await etpService.resetAndRecompute();
        CDUEquitimePointPage.ShowPage(mcdu);
      } catch (err) {
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
      }
    };

    // Reference 2
    mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
      try {
        if (value === Keypad.clrValue) {
          etpService.setPilotEnteredReferenceFix2(undefined);
        } else {
          etpService.setPilotEnteredReferenceFix2(await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false));
        }

        CDUEquitimePointPage.ShowPage(mcdu);
        await etpService.resetAndRecompute();
        CDUEquitimePointPage.ShowPage(mcdu);
      } catch (err) {
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
      }
    };

    mcdu.setTemplate(
      FormatTemplate([
        [new Column(4, 'EQUI-TIME POINT')],
        [
          new Column(0, 'A/C TO', Column.white, Column.small),
          new Column(9, 'BRG', Column.white, Column.small),
          new Column(18, 'DIST', Column.white, Column.small, Column.right),
          new Column(20, 'UTC', Column.white, Column.small),
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
        [acToLabelColumn, new Column(15, 'DIST'), new Column(20, 'UTC')],
        [acToColumn, acToDistColumn, acToUtcColumn],
      ]),
    );
  }
}

import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FormatTemplate, Column } from '../legacy/A320_Neo_CDU_Format';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { CDUWindPage } from './A320_Neo_CDU_WindPage';
import { NXSystemMessages } from '../messages/NXSystemMessages';

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
    const etpToRef1BrgColumn = new Column(9, '', Column.green, Column.small);
    const etpToRef1DistColumn = new Column(18, '', Column.green, Column.small, Column.right);
    const etpToRef1UtcColumn = new Column(20, '', Column.green, Column.small);

    const ref2IdentColumn = new Column(0, '[    ]', Column.cyan, Column.big);
    const ref2BrgColumn = new Column(9, '---', Column.white, Column.big);
    const ref2DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const ref2UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindRef2LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToRef2LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindRef2Column = new Column(0, '', Column.cyan, Column.big);
    const etpToRef2BrgColumn = new Column(9, '', Column.green, Column.small);
    const etpToRef2DistColumn = new Column(18, '', Column.green, Column.small, Column.right);
    const etpToRef2UtcColumn = new Column(20, '', Column.green, Column.small);

    const etpLocationLabelColumn = new Column(11, '', Column.white, Column.small);

    const etpLocationLegColumn = new Column(16, '', Column.green, Column.right, Column.big);
    const etpLocationLegDistanceColumn = new Column(23, '', Column.green, Column.right, Column.big);

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
      ref1UtcColumn.update(
        FmsFormatters.secondsToUTC(utcTime + etpService.pposTimeToReferenceFix1 * 3600),
        Column.green,
      );

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
      etpToRef1BrgColumn.update(`${etpService.etpBearingToReferenceFix1.toFixed(0).padStart(3, '0')}°T`, Column.green);
      etpToRef1DistColumn.update(etpService.etpDistanceToReferenceFix1.toFixed(0), Column.green);
      etpToRef1UtcColumn.update(
        FmsFormatters.secondsToUTC(utcTime + etpService.etpTimeToReferenceFix1 * 3600),
        Column.green,
      );

      // Update wind 1
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          etpService.pilotEnteredWindToReferenceFix1 = undefined;
          CDUEquitimePointPage.ShowPage(mcdu);
          return;
        }

        const wind = CDUWindPage.ParseWind(value);
        if (!wind) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        etpService.pilotEnteredWindToReferenceFix1 = Vec2Math.setFromPolar(
          wind.speed,
          wind.direction * MathUtils.DEGREES_TO_RADIANS,
          Vec2Math.create(),
        );

        CDUEquitimePointPage.ShowPage(mcdu);
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
      ref2UtcColumn.update(
        FmsFormatters.secondsToUTC(utcTime + etpService.pposTimeToReferenceFix2 * 3600),
        Column.green,
      );

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

      etpToRef2BrgColumn.update(`${etpService.etpBearingToReferenceFix2.toFixed(0).padStart(3, '0')}°T`, Column.green);
      etpToRef2DistColumn.update(etpService.etpDistanceToReferenceFix2.toFixed(0), Column.green);
      etpToRef2UtcColumn.update(
        FmsFormatters.secondsToUTC(utcTime + etpService.etpTimeToReferenceFix2 * 3600),
        Column.green,
      );

      // Update wind 2
      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          etpService.pilotEnteredWindToReferenceFix2 = undefined;
          CDUEquitimePointPage.ShowPage(mcdu);
          return;
        }

        const wind = CDUWindPage.ParseWind(value);
        if (!wind) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        etpService.pilotEnteredWindToReferenceFix2 = Vec2Math.setFromPolar(
          wind.speed,
          wind.direction * MathUtils.DEGREES_TO_RADIANS,
          Vec2Math.create(),
        );

        CDUEquitimePointPage.ShowPage(mcdu);
      };
    }

    if (etpService?.isComputed()) {
      const etp = etpService.get();
      const legIdent = plan.legElementAt(etp[2])?.ident;

      etpLocationLabelColumn.update('ETP LOCATION');
      etpLocationLegColumn.update(legIdent ?? '-----', legIdent ? Column.green : Column.white);
      etpLocationLegDistanceColumn.update(`/${(-etp[1]).toFixed(1).padStart(5, ' ')}`, Column.green);

      acToLabelColumn.update('A/C TO');

      acToColumn.update('(ETP)');
      acToDistColumn.update('412', Column.green);
      acToUtcColumn.update('1744', Column.green);
    }

    // Reference 1
    mcdu.onLeftInput[0] = async (value) => {
      if (value === Keypad.clrValue) {
        etpService.pilotEnteredReferenceFix1 = undefined;
        CDUEquitimePointPage.ShowPage(mcdu);
        return;
      }

      try {
        etpService.pilotEnteredReferenceFix1 = await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false);

        CDUEquitimePointPage.ShowPage(mcdu);
      } catch (err) {
        // Rethrow if error is not an FMS message to display
        if (err.type === undefined) {
          throw err;
        }

        mcdu.showFmsErrorMessage(err.type);
      }
    };

    // Reference 2
    mcdu.onLeftInput[2] = async (value) => {
      if (value === Keypad.clrValue) {
        etpService.pilotEnteredReferenceFix2 = undefined;
        CDUEquitimePointPage.ShowPage(mcdu);
        return;
      }

      try {
        etpService.pilotEnteredReferenceFix2 = await WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false);

        CDUEquitimePointPage.ShowPage(mcdu);
      } catch (err) {
        // Rethrow if error is not an FMS message to display
        if (err.type === undefined) {
          throw err;
        }

        mcdu.showFmsErrorMessage(err.type);
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

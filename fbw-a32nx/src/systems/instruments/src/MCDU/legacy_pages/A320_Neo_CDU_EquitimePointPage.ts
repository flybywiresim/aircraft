import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FormatTemplate, Column } from '../legacy/A320_Neo_CDU_Format';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUEquitimePointPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, showDetail = false) {
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

    mcdu.onLeftInput[0] = () => {
      CDUEquitimePointPage.ShowPage(mcdu, !showDetail);
    };

    if (showDetail) {
      const ref1Ident = 'CYYR';
      const ref2Ident = 'KBGR';

      ref1IdentColumn.update(ref1Ident, Column.cyan);
      ref1BrgColumn.update('305°T', Column.green);
      ref1DistColumn.update('336', Column.green);
      ref1UtcColumn.update('1936', Column.green);

      trueWindRef1LabelColumn.update('TRU WIND');
      etpToRef1LabelColumn.update(`ETP TO ${ref1Ident}`);

      trueWindRef1Column.update('190°/048');
      etpToRef1BrgColumn.update('010°T', Column.green);
      etpToRef1DistColumn.update('367', Column.green);
      etpToRef1UtcColumn.update('1839', Column.green);

      ref2IdentColumn.update(ref2Ident, Column.cyan);
      ref2BrgColumn.update('249°T', Column.green);
      ref2DistColumn.update('729', Column.green);
      ref2UtcColumn.update('1834', Column.green);

      trueWindRef2LabelColumn.update('TRU WIND');
      etpToRef2LabelColumn.update(`ETP TO ${ref2Ident}`);

      trueWindRef2Column.update('[ ]°/[ ]');
      etpToRef2BrgColumn.update('244°T', Column.green);
      etpToRef2DistColumn.update('317', Column.green);
      etpToRef2UtcColumn.update('1839', Column.green);

      etpLocationLabelColumn.update('ETP LOCATION');
      etpLocationLegColumn.update('CONAY');
      etpLocationLegDistanceColumn.update('/ -87.7');

      acToLabelColumn.update('A/C TO');

      acToColumn.update('(ETP)');
      acToDistColumn.update('412', Column.green);
      acToUtcColumn.update('1744', Column.green);
    }

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

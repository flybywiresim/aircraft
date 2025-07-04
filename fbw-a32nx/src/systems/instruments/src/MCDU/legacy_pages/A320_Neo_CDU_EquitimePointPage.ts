import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FormatTemplate, Column } from '../legacy/A320_Neo_CDU_Format';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUEquitimePointPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, showDetail = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.EquitimePointPage;
    mcdu.activeSystem = 'FMGC';

    const plan = mcdu.getFlightPlan(FlightPlanIndex.Active);

    const airport1IdentColumn = new Column(0, '[    ]', Column.cyan, Column.big);
    const airport1BrgColumn = new Column(9, '---', Column.white, Column.big);
    const airport1DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const airport1UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindAirport1LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToAirport1LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindAirport1Column = new Column(0, '', Column.cyan, Column.big);
    const etpToAirport1BrgColumn = new Column(9, '', Column.green, Column.small);
    const etpToAirport1DistColumn = new Column(18, '', Column.green, Column.small, Column.right);
    const etpToAirport1UtcColumn = new Column(20, '', Column.green, Column.small);

    const airport2IdentColumn = new Column(0, '[    ]', Column.cyan, Column.big);
    const airport2BrgColumn = new Column(9, '---', Column.white, Column.big);
    const airport2DistColumn = new Column(18, '----', Column.white, Column.big, Column.right);
    const airport2UtcColumn = new Column(20, '----', Column.white, Column.big);

    const trueWindAirport2LabelColumn = new Column(0, '', Column.white, Column.small);
    const etpToAirport2LabelColumn = new Column(10, '', Column.white, Column.small);

    const trueWindAirport2Column = new Column(0, '', Column.cyan, Column.big);
    const etpToAirport2BrgColumn = new Column(9, '', Column.green, Column.small);
    const etpToAirport2DistColumn = new Column(18, '', Column.green, Column.small, Column.right);
    const etpToAirport2UtcColumn = new Column(20, '', Column.green, Column.small);

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
      const airport1Ident = 'CYYR';
      const airport2Ident = 'KBGR';

      airport1IdentColumn.update(airport1Ident, Column.cyan);
      airport1BrgColumn.update('305°T', Column.green);
      airport1DistColumn.update('336', Column.green);
      airport1UtcColumn.update('1936', Column.green);

      trueWindAirport1LabelColumn.update('TRU WIND');
      etpToAirport1LabelColumn.update(`ETP TO ${airport1Ident}`);

      trueWindAirport1Column.update('190°/048');
      etpToAirport1BrgColumn.update('010°T', Column.green);
      etpToAirport1DistColumn.update('367', Column.green);
      etpToAirport1UtcColumn.update('1839', Column.green);

      airport2IdentColumn.update(airport2Ident, Column.cyan);
      airport2BrgColumn.update('249°T', Column.green);
      airport2DistColumn.update('729', Column.green);
      airport2UtcColumn.update('1834', Column.green);

      trueWindAirport2LabelColumn.update('TRU WIND');
      etpToAirport2LabelColumn.update(`ETP TO ${airport2Ident}`);

      trueWindAirport2Column.update('[ ]°/[ ]');
      etpToAirport2BrgColumn.update('244°T', Column.green);
      etpToAirport2DistColumn.update('317', Column.green);
      etpToAirport2UtcColumn.update('1839', Column.green);

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
        [airport1IdentColumn, airport1BrgColumn, airport1DistColumn, airport1UtcColumn],
        [trueWindAirport1LabelColumn, etpToAirport1LabelColumn],
        [trueWindAirport1Column, etpToAirport1BrgColumn, etpToAirport1DistColumn, etpToAirport1UtcColumn],
        [],
        [airport2IdentColumn, airport2BrgColumn, airport2DistColumn, airport2UtcColumn],
        [trueWindAirport2LabelColumn, etpToAirport2LabelColumn],
        [trueWindAirport2Column, etpToAirport2BrgColumn, etpToAirport2DistColumn, etpToAirport2UtcColumn],
        [etpLocationLabelColumn],
        [etpLocationLegColumn, etpLocationLegDistanceColumn],
        [acToLabelColumn, new Column(15, 'DIST'), new Column(20, 'UTC')],
        [acToColumn, acToDistColumn, acToUtcColumn],
      ]),
    );
  }
}

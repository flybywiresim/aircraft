import { DatabaseItem, isFix, isIlsNavaid, isNdbNavaid, isVhfNavaid } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';

export class A320_Neo_CDU_SelectWptPage {
  /**
   * @param mcdu
   * @param fixes
   * @param callback
   * @param page
   * @constructor
   */
  static ShowPage<T extends DatabaseItem<any>>(mcdu: LegacyFmsPageInterface, fixes: T[], callback, page = 0) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.SelectWptPage;
    const rows = [['', 'FREQ', 'LAT/LONG'], [''], [''], [''], [''], [''], [''], [''], [''], [''], [''], ['<RETURN']];

    function calculateDistance(w) {
      const planeLla = new LatLongAlt(
        SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
        SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
      );
      return Avionics.Utils.computeGreatCircleDistance(planeLla, isIlsNavaid(w) ? w.locLocation : w.location);
    }

    const orderedWaypoints = [...fixes].sort((a, b) => calculateDistance(a) - calculateDistance(b));

    for (let i = 0; i < 5; i++) {
      const w = orderedWaypoints[i + 5 * page];
      if (w) {
        let freq = '';

        if (isVhfNavaid(w) || isNdbNavaid(w) || isIlsNavaid(w)) {
          freq = 'frequency' in w ? fastToFixed(w.frequency, 2) : ' ';
        }

        const lat = isIlsNavaid(w) ? w.locLocation.lat : isFix(w) ? w.location.lat : NaN;
        const long = isIlsNavaid(w) ? w.locLocation.long : isFix(w) ? w.location.long : NaN;

        const latString = `${Math.abs(lat).toFixed(0).padStart(2, '0')}${lat >= 0 ? 'N' : 'S'}`;
        const longString = `${Math.abs(long).toFixed(0).padStart(3, '0')}${long >= 0 ? 'E' : 'W'}`;

        const dist = Math.min(calculateDistance(w), 9999);

        rows[2 * i].splice(0, 1, '{green}' + dist.toFixed(0) + '{end}NM');
        rows[2 * i + 1] = [
          '*' + w.ident + '[color]cyan',
          freq + '[color]green',
          `${latString}/${longString}[color]green`,
        ];
        mcdu.onLeftInput[i] = () => {
          callback(w);
        };
        mcdu.onRightInput[i] = () => {
          callback(w);
        };
        mcdu.onLeftInput[5] = () => {
          if (mcdu.returnPageCallback) {
            mcdu.returnPageCallback();
          } else {
            console.error(
              'A return page callback was expected but not declared. Add a returnPageCallback to page: ' +
                mcdu.page.Current,
            );
          }
        };
      }
    }
    mcdu.setTemplate([
      ['DUPLICATE NAMES', (page + 1).toFixed(0), Math.ceil(orderedWaypoints.length / 5).toFixed(0)],
      ...rows,
      [''],
    ]);
    mcdu.onPrevPage = () => {
      if (page > 0) {
        A320_Neo_CDU_SelectWptPage.ShowPage(mcdu, orderedWaypoints, callback, page - 1);
      }
    };
    mcdu.onNextPage = () => {
      if (page < Math.floor(fixes.length / 5)) {
        A320_Neo_CDU_SelectWptPage.ShowPage(mcdu, orderedWaypoints, callback, page + 1);
      }
    };
  }
}

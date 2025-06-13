import { CDUIRSMonitor } from './A320_Neo_CDU_IRSMonitor';
import { CDUIRSStatusFrozen } from './A320_Neo_CDU_IRSStatusFrozen';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';

export class CDUIRSStatus {
  static ShowPage(mcdu: LegacyFmsPageInterface, index, prev_wind_dir?) {
    let currPos = new LatLong(
      SimVar.GetSimVarValue('GPS POSITION LAT', 'degree latitude'),
      SimVar.GetSimVarValue('GPS POSITION LON', 'degree longitude'),
    ).toShortDegreeString();
    let currPosSplit: string[];
    let sep: string;
    if (currPos.includes('N')) {
      currPosSplit = currPos.split('N');
      sep = 'N/';
    } else {
      currPosSplit = currPos.split('S');
      sep = 'S/';
    }
    const latStr = currPosSplit[0];
    const lonStr = currPosSplit[1];
    currPos = latStr + sep + lonStr;
    const GROUNDSPEED = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots') || '0';
    const THDG = SimVar.GetSimVarValue('GPS GROUND TRUE HEADING', 'radians') || '000';
    const TTRK = SimVar.GetSimVarValue('GPS GROUND MAGNETIC TRACK', 'radians') || '000';
    const MHDG = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'radians') || '000';
    const WIND_VELOCITY = SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'Knots') || '00';
    // wind direction smoothing like A32NX_NDInfo.js:setWind()
    let wind_dir = Math.round(Simplane.getWindDirection());
    if (typeof prev_wind_dir == 'undefined') {
      prev_wind_dir = wind_dir;
    }
    let startAngle = prev_wind_dir;
    let endAngle = wind_dir;
    const delta = endAngle - startAngle;
    if (delta > 180) {
      startAngle += 360;
    } else if (delta < -180) {
      endAngle += 360;
    }
    // FIXME filtering inside the page doesn't make a lot of sense!
    const smoothedAngle = Utils.SmoothSin(startAngle, endAngle, 0.25, mcdu._deltaTime / 1000);
    wind_dir = smoothedAngle % 360;

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.IRSStatus;
    mcdu.setTemplate([
      [`IRS${index}`],
      ['POSITION'],
      [`${currPos}[color]green`],
      ['TTRK', 'GS'],
      [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`],
      [`THDG`, 'MHDG'],
      [`${Math.round(THDG)}[color]green`, `${Math.round(MHDG)}[color]green`],
      ['WIND', 'GPIRS ACCUR'],
      [`${Math.round(wind_dir)}°/${Math.round(WIND_VELOCITY)}[color]green`, `200FT[color]green`],
      ['GPIRS POSITION'],
      [`${currPos}[color]green`],
      ['', ''],
      ['{FREEZE[color]cyan', `${index < 3 ? 'NEXT IRS>' : 'RETURN>'}`],
    ]);

    mcdu.onLeftInput[5] = () => {
      CDUIRSStatusFrozen.ShowPage(mcdu, index, wind_dir);
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onRightInput[5] = () => {
      if (index > 2) {
        CDUIRSMonitor.ShowPage(mcdu);
      } else {
        this.ShowPage(mcdu, index + 1);
      }
    };

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.IRSStatus) {
        CDUIRSStatus.ShowPage(mcdu, index, wind_dir);
      }
    }, mcdu.PageTimeout.Default);
  }
}

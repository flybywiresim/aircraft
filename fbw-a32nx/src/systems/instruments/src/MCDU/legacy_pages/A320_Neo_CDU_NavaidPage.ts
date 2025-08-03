// @ts-strict-ignore
import {
  IlsNavaid,
  NdbNavaid,
  VhfNavaid,
  LsCategory,
  VhfNavaidType,
  isIlsNavaid,
  isNdbNavaid,
  VorClass,
  NavaidSubsectionCode,
} from '@flybywiresim/fbw-sdk';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { CDUPilotsWaypoint } from './A320_Neo_CDU_PilotsWaypoint';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';

export class CDUNavaidPage {
  /**
   * @param mcdu MCDU
   * @param facility MSFS facility to show
   * @param returnPage Callback for the RETURN LSK... only for use by SELECTED NAVAIDS
   */
  static ShowPage(mcdu: LegacyFmsPageInterface, facility?: VhfNavaid | NdbNavaid | IlsNavaid, returnPage?) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.NavaidPage;
    mcdu.returnPageCallback = () => {
      CDUNavaidPage.ShowPage(mcdu);
    };

    const template = [
      ['NAVAID'],
      ['\xa0IDENT'],
      ['____[color]amber'],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
    ];

    if (facility) {
      let latLon = isIlsNavaid(facility) ? facility.locLocation : facility.location;
      if (facility.sectionCode === 4 && facility.subSectionCode === 7) {
        // airport && ils
        CDUNavaidPage.renderIls(facility, template);
        latLon = facility.locLocation;
      } else if (facility.sectionCode === 1 && facility.subSectionCode === 0) {
        // navaid && vhf
        CDUNavaidPage.renderVorDme(facility, template);
      }

      template[2][0] = `{cyan}${facility.ident}{end}`;

      // 3L
      template[3][0] = '\xa0\xa0\xa0\xa0LAT/LONG';
      template[4][0] = `{green}${CDUPilotsWaypoint.formatLatLong(latLon)}{end}`;

      // 4L
      template[5][0] = '\xa0FREQ';
      template[6][0] = `{green}${CDUNavaidPage.formatFrequency(facility)}{end}`;
    }

    if (returnPage !== undefined) {
      template[12][1] = 'RETURN>';
      mcdu.onRightInput[5] = () => returnPage();
    }

    mcdu.setTemplate(template);

    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      // FIXME this does not get ILS navaids
      mcdu.getOrSelectNavaidsByIdent(value, (res) => {
        if (res) {
          CDUNavaidPage.ShowPage(mcdu, res, returnPage);
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      });
    };
  }

  static renderIls(facility: IlsNavaid, template: string[][]) {
    let cat = 0;
    switch (facility.category) {
      case LsCategory.Category1:
        cat = 1;
        break;
      case LsCategory.Category2:
        cat = 2;
        break;
      case LsCategory.Category3:
        cat = 3;
        break;
    }

    // 1R
    template[1][1] = 'RWY IDENT';
    // FIXME
    //template[2][1] = `{green}${facility.runwayIdent}{end}`;
    template[2][1] = ``;

    // 2L
    template[3][0] = 'CLASS';
    // FIXME should show "NONCOLLOCATED" for ILS without DME
    template[4][0] = '{green}ILSDME{end}';

    // 2R
    if (cat > 0) {
      template[3][1] = 'CATEGORY';
      template[4][1] = `{green}${cat}{end}`;
    }

    // 3R
    template[5][1] = 'COURSE';
    template[6][1] = `{green}${facility.locBearing.toFixed(0).padStart(3, '0')}{end}`;

    // 4R
    if (facility.gsSlope) {
      template[7][1] = 'SLOPE';
      template[8][1] = `{green}${facility.gsSlope.toFixed(1)}{end}`;
    }
  }

  static renderVorDme(facility: VhfNavaid, template) {
    const isTrueRef = facility.stationDeclination < 1e-6 && Math.abs(facility.location.lat) > 63;
    const suffix = isTrueRef ? 'T' : facility.stationDeclination < 0 ? 'W' : 'E';

    // 1R
    template[1][1] = 'STATION DEC';
    template[2][1] = `{green}${Math.abs(facility.stationDeclination).toFixed(0).padStart(3, '0')}${suffix}{end}`;

    // 2L
    template[3][0] = 'CLASS';
    template[4][0] =
      facility.type === VhfNavaidType.VorDme || facility.type === VhfNavaidType.Vortac
        ? '{green}VORTAC{end}'
        : '{green}NONCOLLOCATED{end}';

    // 5L
    if (facility.dmeLocation && facility.dmeLocation.alt !== undefined) {
      template[9][0] = 'ELV';
      template[10][0] = `{green}${(10 * Math.round(facility.dmeLocation.alt / 10)).toFixed(0)}{end}`;
    }

    // 6L
    const fom = CDUNavaidPage.formatFigureOfMerit(facility);
    if (fom) {
      template[11][0] = '\xa0FIG OF MERIT';
      template[12][0] = `{green}${fom}{end}`;
    }
  }

  /**
   * @param facility Navaid
   * @returns formatted frequency
   */
  static formatFrequency(facility: NdbNavaid | VhfNavaid | IlsNavaid): string {
    if (isNdbNavaid(facility)) {
      return facility.frequency.toFixed(0);
    }
    return facility.frequency.toFixed(2);
  }

  /**
   * Format the figure of merit if possible
   * @param facility Navaid
   * @returns formatted FoM or blank
   */
  static formatFigureOfMerit(facility: VhfNavaid): string {
    if (
      (facility.subSectionCode === NavaidSubsectionCode.VhfNavaid && facility.type === VhfNavaidType.Dme) ||
      facility.type === VhfNavaidType.Vor ||
      facility.type === VhfNavaidType.VorDme ||
      facility.type === VhfNavaidType.Vortac
    ) {
      switch (facility.class) {
        case VorClass.HighAlt:
          return '3';
        case VorClass.Unknown:
          return '2';
        case VorClass.LowAlt:
          return '1';
        case VorClass.Terminal:
          return '0';
      }
    }
    return '';
  }
}

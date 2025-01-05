//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum FansMode {
  FansNone,
  FansA,
  FansB,
}

// Sources for FANS-B areas:
// https://www.icao.int/WACAF/Documents/Meetings/2016/Lisbon-2016/SAT-FI11/SAT-FIT-11_IP%2004%20-attachment_Boeing.pdf
// Station logons are taken from VATSIM vACCs and sector file data of controllers (IVAO and VATSIM use the same callsigns)
export class FutureAirNavigationSystem {
  /* eslint-disable prettier/prettier -- this should be in its own JSON file, the formatting by prettier here is a symptom of this not being in the right place */
  // contains all CPDLC callsigns that use FANS-B
  // FANS-A is assumed to be the fallback
  private static areasFansB = [
    // Eurocontrol
    'EURW', 'EURM', 'EURS', 'EURE', 'EURN',
    // Austria
    // eslint-disable-next-line prettier/prettier
    'LOVV', 'LOVB', 'LOVN', 'LOVF', 'LOVE', 'LOVS', 'LOVW', 'LOVL', 'LOVU', 'LOVC', 'LOVR',
    // Benelux
    // eslint-disable-next-line prettier/prettier
    'EHAW', 'EHAE', 'EHAS', 'EBBU', 'EBBW', 'EBBE',
    // Germany
    // eslint-disable-next-line prettier/prettier
    'EDMM', 'EDMR', 'EDMZ', 'EDMU', 'EDMG', 'EDMS', 'EDML', 'EDMB', 'EDGC', 'EDGE', 'EDGK', 'EDGG', 'EDGP', 'EDGR', 'EDGT', 'EDGZ',
    // eslint-disable-next-line prettier/prettier
    'EDWW', 'EDWA', 'EDWB', 'EDWM', 'EDWE', 'EDWD', 'EDUH', 'EDUP', 'EDUO', 'EDUA', 'EDUD', 'EDUL', 'EDUR', 'EDUF', 'EDUN', 'EDUS',
    'EDUT', 'EDUU', 'EDUW', 'EDYC', 'EDYH', 'EDYJ', 'EDYS', 'EDYM', 'EDYR',
    // Estonia
    'EETT', 'EEEE', 'EENN', 'EESS',
    // Latvia
    'BALT', 'EVRR', 'EVRW', 'EVRE', 'EVRN', 'EVRS',
    // Lithuania
    'EYVL', 'EYVU',
    // Greece
    'LGGG', 'LGGU', 'LGGE', 'LGGW', 'LGGS', 'LGGP', 'LGGK', 'LGGH',
    // Croatia, Slovenia, Zagreb, Sarajevo, Belgrade, Skopje, Tirana, Kosovo (currently no CPDLC)
    // Romania
    'LRBL', 'LRBA', 'LRBC',
    // Bulgary (currently no CPDLC)
    // Cyprus
    'LCCW', 'LCCS', 'LCCE', 'LCCC',
    // Hungary (currently no CPDLC)
    // Italy
    'LMMM', 'LMME', 'LIRD', 'LIRI', 'LIRM', 'LIRN', 'LIRS', 'LIPM', 'LIPN', 'LIPS', 'LIMS', 'LIMN', 'LIBI', 'LIBN', 'LIBS',
    // Romania (currently no CPDLC)
    // Switzerland
    'LSAS', 'LSAA', 'LSAB', 'LSAC', 'LSAD', 'LSAF', 'LSAG', 'LSAH', 'LSAJ', 'LSAU', 'LSAV',
    // Slovakia (currently no CPDLC)
    // France
    'LFXX',
    // Scandinavia
    'EKDK', 'EKDB', 'EKDC', 'EKDD', 'EKDS', 'EKDN', 'EKDV', 'EKCH', 'ESOS', 'ESM2', 'ESM3', 'ESM4', 'ESM5', 'ESM6', 'ESM7', 'ESMW',
    'ENO1', 'ENO2', 'ENO3', 'ENO4', 'ENO5', 'ENO6', 'ENO7', 'ENO8', 'ENS9', 'ENS1', 'ENS2', 'ENS3', 'ENS4', 'ENS5', 'ENS7', 'ENB8',
    'ENB9', 'ENB4', 'ENB5', 'ENB6', 'ENOR', 'ENNS', 'ENOB', 'EFES', 'EFEF', 'EFEG', 'EFEH', 'EFEJ', 'EFEM',
    // Spain
    'CBRA', 'CBRN', 'CBRS', 'CBRW', 'CBRC', 'CBRE', 'CBRD', 'CMRA', 'CMRM', 'CMRN', 'CMRC', 'CMRW', 'CMRE', 'CSRA', 'CSRW',
    'CCRA', 'CCRI', 'CCRL', 'CCRW', 'CCRE', 'CCRO',
    // Portugal
    'LPPC', 'LPZC', 'LPZD', 'LPZE', 'LPZI', 'LPZN', 'LPZS', 'LPZW', 'LPWU', 'LPNU', 'LPCU', 'LPYP', 'LPYL', 'LPYT', 'LPYF', 'LPYM',
    // Poland
    'EPWW', 'EPWU', 'EPWB', 'EPWC', 'EPWD', 'EPWE', 'EPWF', 'EPWG', 'EPWJ', 'EPWK', 'EPWN', 'EPWR', 'EPWZ',
    // Czech
    'LKAA', 'LKAW', 'LKAN', 'LKAU', 'LKAI',
    /* eslint-disable prettier/prettier */
  ];
  public static currentFansMode(identifier: string): FansMode {
    if (/^[0-9A-Z]{4}$/.test(identifier)) {
      if (FutureAirNavigationSystem.areasFansB.findIndex((entry) => entry === identifier) > -1) {
        return FansMode.FansB;
      }
      return FansMode.FansA;
    }
    return FansMode.FansNone;
  }
}

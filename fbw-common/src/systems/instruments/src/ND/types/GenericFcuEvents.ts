import { EfisNdMode, EfisOption, NavAidMode } from '../../NavigationDisplay';

export interface GenericFcuEvents {
  ndRangeSetting: number;
  ndMode: EfisNdMode;
  option: EfisOption;
  navaidMode1: NavAidMode;
  navaidMode2: NavAidMode;
  /** State of the LS pushbutton on the EFIS control panel. */
  efisLsActive: boolean;
}

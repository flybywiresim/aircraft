import { Mode, RangeSetting } from '@shared/NavigationDisplay';

export interface FmsState {
    leftEfisState: EfisState,

    rightEfisState: EfisState,
}

export interface EfisState {
    mode: Mode,

    range: RangeSetting,

    dataLimitReached: boolean,

    legsCulled: boolean,
}

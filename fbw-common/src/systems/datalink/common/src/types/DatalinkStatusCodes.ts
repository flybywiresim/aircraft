//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum DatalinkStatusCode {
    Inop = 0,
    NotInstalled = 1,
    DlkNotAvail = 2,
    DlkAvail = 3,

}

export enum DatalinkModeCode {
    None = 0,
    AtcAoc = 1,
    Aoc = 2,
    Atc = 3,
}

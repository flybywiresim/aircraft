//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum DatalinkStatusCode {
    DlkAvail = '{green}DLK AVAIL{end}',
    DlkNotAvail = '{small}DLK NOT AVAIL{end}',
    Inop = '{red}INOP{end}',
    NotInstalled = '{small}NOT INSTALLED{end}'

}

export enum DatalinkModeCode {
    AtcAoc = 'ATC/AOC',
    Aoc = 'AOC',
    Atc = 'ATC',
    None = ''
}

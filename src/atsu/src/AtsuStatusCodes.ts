//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum AtsuStatusCodes {
    Ok,
    CallsignInUse,
    OwnCallsign,
    NoHoppieConnection,
    NoTelexConnection,
    TelexDisabled,
    ComFailed,
    NoAtc,
    DcduFull,
    UnknownMessage,
    ProxyError,
    NewAtisReceived,
    NoAtisReceived,
    SystemBusy
}

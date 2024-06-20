// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

/**
 * Transmitted from MFD to RMP
 */
export interface MfdSurvData {
    /** (MFD SURV -> RMP) Is AUTO (true) or STBY (false). */
    isAuto: boolean,
    /** (MFD SURV -> RMP) Altitude reporting ON/OFF */
    isAltReportingOn: boolean,
}

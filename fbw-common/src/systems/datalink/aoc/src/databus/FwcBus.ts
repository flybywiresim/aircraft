//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { SimVarSources } from '@datalink/common';

export class AocFwcBus {
    public setCompanyMessageCount(count: number): void {
        SimVar.SetSimVarValue(SimVarSources.companyMessageCount, 'number', count);
    }
}

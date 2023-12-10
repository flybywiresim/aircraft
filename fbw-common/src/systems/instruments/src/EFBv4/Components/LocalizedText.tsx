// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode } from '@microsoft/msfs-sdk';

import { LocalizedString } from '../shared/translation';

export interface LocalizedTextProps {
    locKey: string;
}

export class LocalizedText extends DisplayComponent<LocalizedTextProps> {
    private readonly locStringSub = LocalizedString.create(this.props.locKey);

    destroy() {
        super.destroy();
        this.locStringSub.destroy();
    }

    render(): VNode {
        return (
            <>{this.locStringSub}</>
        );
    }
}

export function t(locKey: string): VNode {
    return <LocalizedText locKey={locKey} />;
}

// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, Subscribable, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429WordData, EfisNdRangeValue } from '@flybywiresim/fbw-sdk';

import { NDPage } from '../NDPage';
import { NDControlEvents } from '../../NDControlEvents';

export interface RoseModeProps extends ComponentProps {
    bus: ArincEventBus,
    rangeValue: Subscribable<EfisNdRangeValue>,
    headingWord: Subscribable<Arinc429WordData>,
    trueHeadingWord: Subscribable<Arinc429WordData>,
    trackWord: Subscribable<Arinc429WordData>
    trueTrackWord: Subscribable<Arinc429WordData>
    isUsingTrackUpMode: Subscribable<boolean>,
}

export abstract class RoseMode<P extends RoseModeProps = RoseModeProps> extends NDPage<P> {
    abstract isVisible: Subject<boolean>;

    onShow() {
        super.onShow();

        this.movePlane();
    }

    private movePlane() {
        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_show_plane', true);
        publisher.pub('set_plane_x', 384);
        publisher.pub('set_plane_y', 384);
    }
}

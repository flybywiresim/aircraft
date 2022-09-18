import {
    FSComponent,
    DisplayComponent,
    EventBus,
    Subject,
    VNode,
    MappedSubject,
    Subscribable,
    ConsumerSubject,
} from 'msfssdk';
import React from 'react';
import { Arinc429Word } from '@shared/arinc429';
import { MathUtils } from '@shared/MathUtils';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { NDSimvars } from '../NDSimvarPublisher';
import { FGVars } from '../../MsfsAvionicsCommon/providers/FGDataPublisher';

export interface TrackLineProps {
    bus: EventBus,
    x: number,
    y: number,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export class TrackLine extends DisplayComponent<TrackLineProps> {
    private readonly lineRef = FSComponent.createRef<SVGLineElement>();

    private headingWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

    private trackWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

    private readonly sub = this.props.bus.getSubscriber<FGVars & NDSimvars>();

    private lateralModeSub = ConsumerSubject.create(this.sub.on('fg.fma.lateralMode').whenChanged(), null);

    private lateralArmedSub = ConsumerSubject.create(this.sub.on('fg.fma.lateralArmedBitmask').whenChanged(), null);

    private readonly rotate = MappedSubject.create(([heading, track]) => {
        if (this.props.isUsingTrackUpMode.get()) {
            return 0;
        }

        if (heading.isNormalOperation() && track.isNormalOperation()) {
            return MathUtils.diffAngle(heading.value, track.value);
        }

        return 0;
    }, this.headingWord, this.trackWord);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.sub.on('heading').whenChanged().handle((v) => {
            const oldSsm = this.headingWord.get().ssm;

            this.headingWord.set(new Arinc429Word(v));

            // FIXME make this not sus
            if (this.headingWord.get().ssm !== oldSsm) {
                this.handleLineVisibility();
            }
        });

        this.sub.on('groundTrack').whenChanged().handle((v) => {
            const oldSsm = this.trackWord.get().ssm;

            this.trackWord.set(new Arinc429Word(v));

            // FIXME make this not sus
            if (this.trackWord.get().ssm !== oldSsm) {
                this.handleLineVisibility();
            }
        });

        this.lateralModeSub.sub(() => this.handleLineVisibility());
        this.lateralArmedSub.sub(() => this.handleLineVisibility());
    }

    private handleLineVisibility() {
        const headingInvalid = !this.headingWord.get().isNormalOperation();
        const trackInvalid = !this.trackWord.get().isNormalOperation();

        const lateralMode = this.lateralModeSub.get();
        const lateralArmed = this.lateralArmedSub.get();

        const shouldShowLine = (lateralMode === LateralMode.NONE || lateralMode === LateralMode.HDG || lateralMode === LateralMode.TRACK)
            && !isArmed(lateralArmed, ArmedLateralMode.NAV);

        if (headingInvalid || trackInvalid || !shouldShowLine) {
            this.lineRef.instance.style.visibility = 'hidden';
        } else {
            this.lineRef.instance.style.visibility = 'inherit';
        }
    }

    render(): VNode | null {
        return (
            <g ref={this.lineRef} transform={this.rotate.map((rotate) => `rotate(${rotate} ${this.props.x} ${this.props.y})`)}>
                <line x1={384} y1={149} x2={this.props.x} y2={this.props.y} class="rounded shadow" strokeWidth={3.0} />
                <line x1={384} y1={149} x2={this.props.x} y2={this.props.y} class="rounded Green" strokeWidth={2.5} />
            </g>
        );
    }
}

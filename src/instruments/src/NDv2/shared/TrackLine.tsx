import { FSComponent, DisplayComponent, EventBus, Subject, VNode, MappedSubject, Subscribable } from 'msfssdk';
import React from 'react';
import { Arinc429Word } from '@shared/arinc429';
import { MathUtils } from '@shared/MathUtils';
import { NDSimvars } from '../NDSimvarPublisher';

export interface TrackLineProps {
    x: number,
    y: number,
    isUsingTrackUpMode: Subscribable<boolean>,
    bus: EventBus,
}

// TODO hook up to lateral modes
export class TrackLine extends DisplayComponent<TrackLineProps> {
    private readonly lineRef = FSComponent.createRef<SVGLineElement>();

    private headingWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

    private trackWord = Subject.create<Arinc429Word>(Arinc429Word.empty());

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

        const sub = this.props.bus.getSubscriber<NDSimvars>();

        sub.on('heading').whenChanged().handle((v) => {
            this.headingWord.set(new Arinc429Word(v));
            this.handleLineVisibility();
        });

        sub.on('groundTrack').whenChanged().handle((v) => {
            this.trackWord.set(new Arinc429Word(v));
            this.handleLineVisibility();
        });
    }

    private handleLineVisibility() {
        const headingInvalid = !this.headingWord.get().isNormalOperation();
        const trackInvalid = !this.trackWord.get().isNormalOperation();

        if (headingInvalid || trackInvalid) {
            this.lineRef.instance.style.visibility = 'hidden';
        } else {
            this.lineRef.instance.style.visibility = 'visible';
        }
    }

    render(): VNode | null {
        return (
            <g ref={this.lineRef} transform={this.rotate.map((rotate) => `rotate(${rotate} ${this.props.x} ${this.props.y})`)}>
                <line x1={384} y1={149} x2={this.props.x} y2={this.props.y} class="shadow rounded" strokeWidth={3.0} />
                <line x1={384} y1={149} x2={this.props.x} y2={this.props.y} class="Green rounded" strokeWidth={2.5} />
            </g>
        );
    }
}

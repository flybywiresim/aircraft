import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { ISISSimvars } from 'instruments/src/ISIS/shared/ISISSimvarPublisher';
import { LagFilter } from './ISISUtils';

const SideslipIndicatorFilter = new LagFilter(0.8);

class SideslipIndicator extends DisplayComponent<{bus: EventBus}> {
    private readonly maxDeflection = 30;

    private sideslipIndicatorTransform = Subject.create('transform: translate3d(0px, 0px, 0px)');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ISISSimvars>();

        sub.on('latAcc').withPrecision(2).handle((latAcc) => {
            const latAccInGUnits = latAcc * 0.0311;
            const accInG = Math.min(0.3, Math.max(-0.3, latAccInGUnits));
            const sideslipIndicatorIndexOffset = SideslipIndicatorFilter.step(-accInG * this.maxDeflection / 0.3, 500 / 1000);

            this.sideslipIndicatorTransform.set(`transform: translate3d(${sideslipIndicatorIndexOffset}px, 0px, 0px)`);
        });
    }

    render(): VNode {
        return (
            <path id="SideSlipIndicator" class="StrokeWhite FillBackground" style={this.sideslipIndicatorTransform} d="M 244 138 h24 l 5 9 h -34 z" />
        );
    }
}

export class RollIndex extends DisplayComponent<{bus: EventBus}> {
    render(): VNode {
        return (
            <g id="RollIndex">
                <rect x={-256} y={-256} width={1024} height={394} class="sky" />
                <path class="StrokeWhite FillBackground" d="M256 118 l10 18 h-20z" />
                <SideslipIndicator bus={this.props.bus} />
            </g>
        );
    }
}

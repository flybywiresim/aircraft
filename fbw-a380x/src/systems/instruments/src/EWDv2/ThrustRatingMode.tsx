import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { useArinc429Var } from '@instruments/common/arinc429';
import { splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWDv2/shared/EwdSimvarPublisher';

type N1LimitProps = {
    x: number,
    y: number,
    active: Subscribable<boolean>,
};

export class N1Limit extends DisplayComponent<{ x: number, y: number, active: Subscribable<boolean>, bus: EventBus}> {


    private readonly N1LimitType = ConsumerSubject.create(null, 0);
    private readonly thrustLimitTypeArray = ['', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'];


    public  onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<EwdSimvars>();

        this.N1LimitType.setConsumer(sub.on('thrust_limit_type').whenChanged());

     /*    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT', 'number', 100);
        const N1ThrustLimitSplit = splitDecimals(N1ThrustLimit);
        const [flexTemp] = useSimVar('L:AIRLINER_TO_FLEX_TEMP', 'number', 1000);
        const sat: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', 500);
        const displayFlexTemp: boolean = flexTemp !== 0 && (flexTemp >= (sat.value - 10)) && N1LimitType === 3; */
    }

    render(): VNode {
         return (

                <g id='Thrust-Rating-Mode'>

                    <text class='F26 Center Amber' x={this.props.x - 18} y={this.props.y} style={{display: this.props.active.map(a => a? 'none':'')}}>XX</text>



                  {/*           <text class='Huge End Cyan' style={{display: this.props.active.map(a => a? '':'none')}} x={this.props.x} y={this.props.y}>{this.N1LimitType.map((t) => this.thrustLimitTypeArray[t])}</text>
                            <text class='F26 End Green Spread' x={this.props.x + 69} y={this.props.y - 2}>{N1ThrustLimitSplit[0]}</text>
                            <text class='F26 End Green' x={this.props.x + 86} y={this.props.y - 2}>.</text>
                            <text class='F20 End Green' x={this.props.x + 101} y={this.props.y - 2}>{N1ThrustLimitSplit[1]}</text>
                            <text class='F20 End Cyan' x={this.props.x + 117} y={this.props.y - 2}>%</text>


                    {active && displayFlexTemp
                    && (
                        <>
                            <text class='F20 Cyan' x={this.props.x + 154} y={this.props.y}>
                                {Math.round(flexTemp)}
                                &deg;C
                            </text>
                        </>
                    )} */}
                </g>

        );
    }
};

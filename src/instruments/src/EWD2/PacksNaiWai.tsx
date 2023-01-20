// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { AutoThrustMode } from '@shared/autopilot';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface PacksNaiWaiProps {
    bus: EventBus;
}
export class PacksNaiWai extends DisplayComponent<PacksNaiWaiProps> {
    private readonly messageLUT = [
        '',
        'WAI',
        'NAI',
        'NAI/WAI',
        'PACKS',
        'PACKS/WAI',
        'PACKS/NAI',
        'PACKS/NAI/WAI',
    ];

    private message = Subject.create('');

    private fwcFlightPhase: number = 0;

    private autoThrustMode: number = 0;

    private packs1Supplying: boolean = false;

    private packs2Supplying: boolean = false;

    private engine1AntiIce: boolean = false;

    private engine1State: number = 0;

    private engine2AntiIce: boolean = false;

    private engine2State: number = 0;

    private wingAntiIce: boolean = false;

    private apuBleedPressure: number = 0;

    private leftLandingGear: boolean = false;

    private rightLandingGear: boolean = false;

    private throttle1Position: number = 0;

    private throttle2Position: number = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

        sub.on('fwcFlightPhase').whenChanged().handle((p) => {
            this.fwcFlightPhase = p;
        });

        sub.on('autoThrustMode').whenChanged().handle((mode) => {
            this.autoThrustMode = mode;
        });

        sub.on('packs1Supplying').whenChanged().handle((pack) => {
            this.packs1Supplying = pack;
        });

        sub.on('packs2Supplying').whenChanged().handle((pack) => {
            this.packs2Supplying = pack;
        });

        sub.on('engine1AntiIce').whenChanged().handle((ai) => {
            this.engine1AntiIce = ai;
        });

        sub.on('engine1State').whenChanged().handle((s) => {
            this.engine1State = s;
        });

        sub.on('engine2AntiIce').whenChanged().handle((ai) => {
            this.engine2AntiIce = ai;
        });

        sub.on('engine2State').whenChanged().handle((s) => {
            this.engine2State = s;
        });

        sub.on('wingAntiIce').whenChanged().handle((ai) => {
            this.wingAntiIce = ai;
        });

        sub.on('apuBleedPressure').whenChanged().handle((psi) => {
            this.apuBleedPressure = psi;
        });

        sub.on('left1LandingGear').whenChanged().handle((g) => {
            this.leftLandingGear = g;
        });

        sub.on('right1LandingGear').whenChanged().handle((g) => {
            this.rightLandingGear = g;
        });

        sub.on('throttle1Position').whenChanged().handle((pos) => {
            this.throttle1Position = pos;
        });

        sub.on('throttle2Position').whenChanged().handle((pos) => {
            this.throttle2Position = pos;
        });

        sub.on('realTime').atFrequency(2).handle((_t) => {
            const showMessage = [3, 4].includes(this.throttle1Position) || [3, 4].includes(this.throttle2Position)
            || ((this.leftLandingGear && this.rightLandingGear) && (this.engine1State === 1 || this.engine2State === 1))
            || (this.autoThrustMode >= AutoThrustMode.MAN_TOGA && this.autoThrustMode <= AutoThrustMode.MAN_DTO && (this.throttle1Position === 2 || this.throttle2Position === 2))
            || (this.fwcFlightPhase >= 5 && this.fwcFlightPhase <= 7 && this.autoThrustMode === AutoThrustMode.MAN_MCT);

            this.message.set(showMessage ? this.messageLUT[this.messageIndex] : '');
        });
    }

    get messageIndex(): number {
        return ((this.packs1Supplying || this.packs2Supplying) && this.apuBleedPressure === 0 ? 4 : 0)
            + (this.engine1AntiIce || this.engine2AntiIce ? 2 : 0)
            + (this.wingAntiIce ? 1 : 0);
    }

    render(): VNode {
        return (
            <text class="Green Large End" x={492} y={27}>{this.message}</text>
        );
    }
}

import { FSComponent, DisplayComponent, EventBus, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { TuningMode } from '@fmgc/radionav';
import { VorSimVars } from 'instruments/src/MsfsAvionicsCommon/providers/VorBusPublisher';
import { NavAidMode } from '@shared/NavigationDisplay';
import { EcpSimVars } from '../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';

export class RadioNavInfo extends DisplayComponent<{ bus: EventBus, index: 1 | 2 }> {
    private readonly isVor = Subject.create(true);

    private readonly isAdf = Subject.create(true);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<EcpSimVars>();

        sub.on(`navaidMode${this.props.index}`).whenChanged().handle((value) => {
            if (value === NavAidMode.VOR) {
                this.isVor.set(true);
                this.isAdf.set(false);
            } else if (value === NavAidMode.ADF) {
                this.isVor.set(false);
                this.isAdf.set(false);
            } else {
                this.isVor.set(false);
                this.isAdf.set(false);
            }
        });
    }

    render(): VNode | null {
        return (
            <VorInfo bus={this.props.bus} index={this.props.index} visible={this.isVor} />
        );
    }
}

class VorInfo extends DisplayComponent<{ bus: EventBus, index: 1 | 2, visible: Subscribable<boolean> }> {
    private readonly VOR_1_NEEDLE = 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719';

    private readonly VOR_2_NEEDLE = 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719';

    private readonly identSub = Subject.create('');

    private readonly frequencySub = Subject.create(0);

    private readonly hasDmeSub = Subject.create(false);

    private readonly dmeDistanceSub = Subject.create(0);

    private readonly availableSub = Subject.create(false);

    private readonly tuningModeSub = Subject.create<TuningMode>(TuningMode.Manual);

    private readonly dmeVisible = MappedSubject.create(([available, hasDme, frequency]) => (available || hasDme) && frequency > 1, this.availableSub, this.hasDmeSub, this.frequencySub);

    private readonly dashedDme = MappedSubject.create(([hasDme, dmeDistance]) => !hasDme || dmeDistance <= 0, this.hasDmeSub, this.dmeDistanceSub);

    private readonly frequencyVisible = MappedSubject.create(([available, hasDme, frequency]) => !(available || hasDme) && frequency > 1, this.availableSub, this.hasDmeSub, this.frequencySub);

    private readonly x = this.props.index === 1 ? 37 : 668

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<VorSimVars>();

        sub.on(`nav${this.props.index}Ident`).whenChanged().handle((v) => this.identSub.set(v));
        sub.on(`nav${this.props.index}Frequency`).whenChanged().handle((v) => this.frequencySub.set(v));
        sub.on(`nav${this.props.index}HasDme`).whenChanged().handle((v) => this.hasDmeSub.set(v));
        sub.on(`nav${this.props.index}DmeDistance`).whenChanged().handle((v) => this.dmeDistanceSub.set(v));
        sub.on(`nav${this.props.index}Available`).whenChanged().handle((v) => this.availableSub.set(v));
        sub.on(`nav${this.props.index}TuningMode`).whenChanged().handle((v) => this.tuningModeSub.set(v));
    }

    render(): VNode | null {
        return (
            <g visibility={this.props.visible.map((v) => (v ? 'visible' : 'hidden'))}>
                <path
                    visibility={this.availableSub.map((v) => (v ? 'visible' : 'hidden'))}
                    d={this.props.index === 1 ? this.VOR_1_NEEDLE : this.VOR_2_NEEDLE}
                    strokeWidth={2}
                    class="White"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                <text x={this.x} y={692} fontSize={24} class="White">
                    {`VOR${this.props.index}`}
                </text>

                <text
                    visibility={this.dmeVisible.map((v) => (v ? 'visible' : 'hidden'))}
                    x={this.x}
                    y={722}
                    fontSize={24}
                    class="White"
                >
                    {this.identSub}
                </text>

                <text
                    x={this.props.index === 2 ? this.x - 26 : this.x}
                    y={722}
                    fontSize={24}
                    class="White"
                >
                    <BigLittle visible={this.frequencyVisible} value={this.frequencySub} digits={2} />
                </text>

                <g transform={`translate(${this.props.index === 1 ? -16 : 0})`}>
                    <text
                        x={this.dmeDistanceSub.map((v) => (v > 20 ? this.x + 46 : this.x + 58))}
                        y={759}
                        fontSize={24}
                        fill="#00ff00"
                        textAnchor="end"
                    >
                        <tspan
                            visibility={MappedSubject.create(([visible, dashedDme]) => visible && dashedDme, this.props.visible, this.dashedDme).map((v) => (v ? 'visible' : 'hidden'))}
                        >
                            ---
                        </tspan>
                        <BigLittle visible={this.dashedDme.map((v) => !v)} value={this.dmeDistanceSub} digits={1} roundedThreshold={20} />
                    </text>

                    <text x={this.x + 66} y={759} fontSize={20} fill="#00ffff">NM</text>
                </g>

                <TuningModeIndicator
                    index={this.props.index}
                    visible={this.props.visible}
                    frequency={this.frequencySub}
                    tuningMode={this.tuningModeSub}
                />
            </g>
        );
    }
}

export interface BigLittleProps {
    visible: Subscribable<boolean>,
    value: Subscribable<number>,
    digits: number,
    roundedThreshold?: number,
}

export class BigLittle extends DisplayComponent<BigLittleProps> {
    private readonly intPartText = Subject.create('');

    private readonly decimalPartText = Subject.create('');

    private showDecimal = Subject.create(true);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.props.value.sub((value) => {
            if (!this.props.visible.get()) {
                return;
            }

            if (this.props.roundedThreshold && value >= this.props.roundedThreshold) {
                this.intPartText.set(value.toFixed(0));
                this.showDecimal.set(false);
            } else {
                const [intPart, decimalPart] = value.toFixed(this.props.digits).split('.', 2);

                this.intPartText.set(intPart);
                this.decimalPartText.set(`.${decimalPart}`);
                this.showDecimal.set(true);
            }
        });

        this.props.visible.sub((visible) => {
            if (!visible) {
                this.intPartText.set('');
                this.decimalPartText.set('');
            }
        });
    }

    render(): VNode | null {
        return (
            <>
                <tspan visibility={this.props.visible.map((v) => (v ? 'visible' : 'hidden'))}>
                    {this.intPartText}
                </tspan>
                <tspan
                    fontSize={20}
                    visibility={this.showDecimal.map((showDecimal) => (showDecimal ? 'visible' : 'hidden'))}
                >
                    {this.decimalPartText}
                </tspan>
            </>
        );
    }
}

interface TuningModeIndicatorProps {
    index: number,
    visible: Subscribable<boolean>,
    frequency: Subscribable<number>,
    tuningMode: Subscribable<TuningMode>
}

class TuningModeIndicator extends DisplayComponent<TuningModeIndicatorProps> {
    // eslint-disable-next-line arrow-body-style
    private readonly indicatorVisible = MappedSubject.create(([visible, frequency, tuningMode]) => {
        return visible && frequency > 1 && tuningMode !== TuningMode.Auto;
    }, this.props.visible, this.props.frequency, this.props.tuningMode);

    render(): VNode | null {
        return (
            <text
                visibility={this.indicatorVisible.map((v) => (v ? 'visible' : 'hidden'))}
                x={this.props.index === 1 ? 138 : 616}
                y={720}
                fontSize={20}
                textDecoration="underline"
                fill="#ffffff"
            >
                {this.props.tuningMode.map((v) => (v === TuningMode.Manual ? 'M' : 'R'))}
            </text>
        );
    }
}

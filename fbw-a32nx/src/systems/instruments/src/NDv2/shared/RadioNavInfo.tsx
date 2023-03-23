import { FSComponent, DisplayComponent, EventBus, MappedSubject, Subject, Subscribable, VNode } from 'msfssdk';
import { TuningMode } from '@fmgc/radionav';
import { VorSimVars } from 'instruments/src/MsfsAvionicsCommon/providers/VorBusPublisher';
import { EfisNdMode, NavAidMode } from '@shared/NavigationDisplay';
import { DmcEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { EcpSimVars } from '../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';

export class RadioNavInfo extends DisplayComponent<{ bus: EventBus, index: 1 | 2, mode: Subscribable<EfisNdMode> }> {
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
            // TODO ADF
            <VorInfo bus={this.props.bus} index={this.props.index} visible={this.isVor} mode={this.props.mode} />
        );
    }
}

class VorInfo extends DisplayComponent<{ bus: EventBus, index: 1 | 2, visible: Subscribable<boolean>, mode: Subscribable<EfisNdMode> }> {
    private readonly VOR_1_NEEDLE = 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719';

    private readonly VOR_2_NEEDLE = 'M749,719 L749,696 L755,696 L743,680 L731,696 L737,696 L737,719 M743,680 L743,675';

    private readonly identSub = Subject.create('');

    private readonly frequencySub = Subject.create(0);

    private readonly hasDmeSub = Subject.create(false);

    private readonly dmeDistanceSub = Subject.create(0);

    private readonly availableSub = Subject.create(false);

    private readonly tuningModeSub = Subject.create<TuningMode>(TuningMode.Manual);

    private readonly stationDeclination = Subject.create(0);

    private readonly stationLatitude = Subject.create(0);

    private readonly trueRefActive = Subject.create(false);

    private readonly dmeVisible = MappedSubject.create(([available, hasDme, frequency]) => (available || hasDme) && frequency > 1, this.availableSub, this.hasDmeSub, this.frequencySub);

    private readonly dashedDme = MappedSubject.create(([hasDme, dmeDistance]) => !hasDme || dmeDistance <= 0, this.hasDmeSub, this.dmeDistanceSub);

    private readonly frequencyVisible = MappedSubject.create(([available, hasDme, frequency]) => !(available || hasDme) && frequency > 1, this.availableSub, this.hasDmeSub, this.frequencySub);

    private readonly stationTrueRef = MappedSubject.create(
        ([latitude, declination]) => Math.abs(latitude) > 75 && declination < Number.EPSILON,
        this.stationLatitude,
        this.stationDeclination,
    );

    private readonly stationCorrected = MappedSubject.create(
        ([trueRef, stationTrueRef, available, mode]) => trueRef !== stationTrueRef && available && mode !== EfisNdMode.ROSE_VOR && mode !== EfisNdMode.ROSE_ILS,
        this.trueRefActive,
        this.stationTrueRef,
        this.availableSub,
        this.props.mode,
    );

    private readonly magWarning = MappedSubject.create(
        ([trueRef, stationTrueRef, available, mode]) => trueRef && !stationTrueRef && available && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS),
        this.trueRefActive,
        this.stationTrueRef,
        this.availableSub,
        this.props.mode,
    );

    private readonly trueWarning = MappedSubject.create(
        ([trueRef, stationTrueRef, available, mode]) => !trueRef && stationTrueRef && available && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS),
        this.trueRefActive,
        this.stationTrueRef,
        this.availableSub,
        this.props.mode,
    );

    private readonly x = this.props.index === 1 ? 37 : 668

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<DmcEvents & VorSimVars>();

        sub.on(`nav${this.props.index}Ident`).whenChanged().handle((v) => this.identSub.set(v));
        sub.on(`nav${this.props.index}Frequency`).whenChanged().handle((v) => this.frequencySub.set(v));
        sub.on(`nav${this.props.index}HasDme`).whenChanged().handle((v) => this.hasDmeSub.set(!!v));
        sub.on(`nav${this.props.index}DmeDistance`).whenChanged().handle((v) => this.dmeDistanceSub.set(v));
        sub.on(`nav${this.props.index}Available`).whenChanged().handle((v) => this.availableSub.set(!!v));
        // FIXME this doesn't work
        sub.on(`nav${this.props.index}TuningMode`).whenChanged().handle((v) => this.tuningModeSub.set(v));
        sub.on(`nav${this.props.index}StationDeclination`).handle((v) => this.stationDeclination.set(v));
        sub.on(`nav${this.props.index}Location`).handle((v) => this.stationLatitude.set(v.lat));

        sub.on('trueRefActive').whenChanged().handle((v) => this.trueRefActive.set(!!v));
    }

    render(): VNode | null {
        return (
            <g visibility={this.props.visible.map((v) => (v ? 'inherit' : 'hidden'))}>
                <path
                    d={this.props.index === 1 ? this.VOR_1_NEEDLE : this.VOR_2_NEEDLE}
                    stroke-width={2}
                    class={this.stationCorrected.map((c) => (c ? 'Magenta' : 'White'))}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                <text x={this.x} y={692} font-size={24} class="White">
                    {`VOR${this.props.index}`}
                </text>

                <text x={this.x + (this.props.index === 1 ? 61 : -54)} y={692} class="FontTiny Magenta" visibility={this.stationCorrected.map((c) => (c ? 'inherit' : 'hidden'))}>CORR</text>
                <text x={this.x + (this.props.index === 1 ? 73 : -54)} y={692} class="FontTiny Amber" visibility={this.magWarning.map((c) => (c ? 'inherit' : 'hidden'))}>MAG</text>
                <text x={this.x + (this.props.index === 1 ? 61 : -54)} y={692} class="FontTiny Amber" visibility={this.trueWarning.map((c) => (c ? 'inherit' : 'hidden'))}>TRUE</text>

                <text
                    visibility={this.dmeVisible.map((v) => (v ? 'inherit' : 'hidden'))}
                    x={this.x}
                    y={722}
                    font-size={24}
                    class="White"
                >
                    {this.identSub}
                </text>

                <text
                    x={this.props.index === 2 ? this.x - 26 : this.x}
                    y={722}
                    font-size={24}
                    class="White"
                >
                    <BigLittle visible={this.frequencyVisible} value={this.frequencySub} digits={2} class="White" />
                </text>

                <g transform={`translate(${this.props.index === 1 ? -16 : 0})`}>
                    <text
                        x={this.dmeDistanceSub.map((v) => (v > 20 ? this.x + 46 : this.x + 58))}
                        y={759}
                        font-size={24}
                        text-anchor="end"
                    >
                        <tspan
                            visibility={MappedSubject.create(([visible, dashedDme]) => visible && dashedDme, this.props.visible, this.dashedDme).map((v) => (v ? 'inherit' : 'hidden'))}
                            class="Green"
                        >
                            ---
                        </tspan>
                        <BigLittle visible={this.dashedDme.map((v) => !v)} value={this.dmeDistanceSub} digits={1} roundedThreshold={20} class="Green" />
                    </text>

                    <text x={this.x + 66} y={759} font-size={20} class="Cyan">NM</text>
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
    class: string,
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
                <tspan visibility={this.props.visible.map((v) => (v ? 'visible' : 'hidden'))} class={this.props.class}>
                    {this.intPartText}
                </tspan>
                <tspan
                    font-size={20}
                    visibility={this.showDecimal.map((showDecimal) => (showDecimal ? 'visible' : 'hidden'))}
                    class={this.props.class}
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
                font-size={20}
                textDecoration="underline"
                fill="#ffffff"
            >
                {this.props.tuningMode.map((v) => (v === TuningMode.Manual ? 'M' : 'R'))}
            </text>
        );
    }
}

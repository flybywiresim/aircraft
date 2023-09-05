/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import './perf.scss';
import {
    AltitudeFormat,
    AltitudeOrFlightLevelFormat,
    CostIndexFormat,
    DescentRateFormat,
    FlightLevelFormat,
    LengthFormat,
    PercentageFormat,
    QnhFormat,
    SpeedKnotsFormat,
    SpeedMachFormat,
    TemperatureFormat,
    WindDirectionFormat,
    WindSpeedFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Mmo, Vmo, maxCertifiedAlt } from 'shared/PerformanceConstants';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { ConfirmationDialog } from 'instruments/src/MFD/pages/common/ConfirmationDialog';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FmgcFlightPhase } from '@shared/flightphase';
import { TakeoffDerated, TakeoffPowerSetting } from 'instruments/src/MFD/fmgc';

interface MfdFmsPerfProps extends AbstractMfdPageProps {
}

export class MfdFmsPerf extends FmsPage<MfdFmsPerfProps> {
    private activateApprButton = FSComponent.createRef<HTMLDivElement>();

    // Subjects
    private crzFl = Subject.create<number>(32_000);

    private activeFlightPhase = Subject.create<FmgcFlightPhase>(0);

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private costIndex = Subject.create<number>(69);

    private transAlt = Subject.create(5000);

    private transAltIsPilotEntered = Subject.create<boolean>(false);

    private thrRedAlt = Subject.create<number>(1080);

    private thrRedAltIsPilotEntered = Subject.create<boolean>(false);

    private accelAlt = Subject.create<number>(1080);

    private accelRedAltIsPilotEntered = Subject.create<boolean>(false);

    private noiseEndAlt = Subject.create<number>(800);

    private noiseN1 = Subject.create<number>(null);

    private noiseSpd = Subject.create<number>(null);

    private showNoiseFields(visible: boolean) {
        if (visible === true) {
            // TO page
            this.toNoiseButtonRef.instance.style.display = 'none';
            this.toNoiseEndLabelRef.instance.style.display = 'flex';
            this.toNoiseEndInputRef.instance.style.display = 'flex';
            this.toNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'visible';
            });

            // CLB page
            this.clbNoiseButtonRef.instance.style.display = 'none';
            this.clbNoiseEndLabelRef.instance.style.display = 'flex';
            this.clbSpdLimLabelRef.instance.style.display = 'none';
            this.clbNoiseEndInputRef.instance.style.display = 'flex';
            this.clbSpdLimValueRef.instance.style.display = 'none';
            this.clbNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'visible';
            });
        } else {
            // TO page
            this.toNoiseButtonRef.instance.style.display = 'flex';
            this.toNoiseEndLabelRef.instance.style.display = 'none';
            this.toNoiseEndInputRef.instance.style.display = 'none';
            this.toNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'hidden';
            });

            // CLB page
            this.clbNoiseButtonRef.instance.style.display = 'flex';
            this.clbNoiseEndLabelRef.instance.style.display = 'none';
            this.clbSpdLimLabelRef.instance.style.display = 'flex';
            this.clbNoiseEndInputRef.instance.style.display = 'none';
            this.clbSpdLimValueRef.instance.style.display = 'flex';
            this.clbNoiseFieldsRefs.forEach((el) => {
                el.instance.style.visibility = 'hidden';
            });
        }
    }

    // TO page subjects, refs and methods
    private originRunwayIdent = Subject.create<string>('');

    private toShift = Subject.create<number>(null);

    private toV1 = Subject.create<number>(null);

    private toVR = Subject.create<number>(null);

    private toV2 = Subject.create<number>(null);

    private toSelectedThrustSettingIndex = Subject.create<TakeoffPowerSetting>(0);

    private toFlexTemp = Subject.create<number>(null);

    private toSelectedDeratedIndex = Subject.create<TakeoffDerated>(0);

    private originRunwayLength = Subject.create<number>(4000);

    private toSelectedFlapsIndex = Subject.create(0);

    private toThsFor = Subject.create<number>(null);

    private toSelectedPacksIndex = Subject.create(1);

    private toSelectedAntiIceIndex = Subject.create(0);

    private eoAccelAlt = Subject.create(1_500);

    private eoAccelAltIsPilotEntered = Subject.create<boolean>(false);

    private toFlexInputRef = FSComponent.createRef<HTMLDivElement>();

    private toDeratedInputRef = FSComponent.createRef<HTMLDivElement>();

    private toDeratedThrustOptions = ArraySubject.create(['D01', 'D02', 'D03', 'D04', 'D05']);

    private toThrustSettingChanged(newIndex: TakeoffPowerSetting) {
        this.props.fmService.fmgc.data.takeoffPowerSetting.set(newIndex);
        this.showToThrustSettings(newIndex);

        if (newIndex === TakeoffPowerSetting.FLEX) {
            // FLEX
            SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', this.props.fmService.fmgc.data.takeoffFlexTemp.get() ?? 0.1);
        } else if (newIndex === TakeoffPowerSetting.DERATED) {
            // DERATED
            SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', 0); // 0 meaning no FLEX
        } else {
            // TOGA
            SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', 0); // 0 meaning no FLEX
        }
    }

    private showToThrustSettings(st: TakeoffPowerSetting) {
        if (st === TakeoffPowerSetting.TOGA) {
            this.toFlexInputRef.instance.style.visibility = 'hidden';
            this.toDeratedInputRef.instance.style.visibility = 'hidden';
        } else if (st === TakeoffPowerSetting.FLEX) {
            this.toFlexInputRef.instance.style.visibility = 'visible';
            this.toDeratedInputRef.instance.style.visibility = 'hidden';
        } else {
            this.toFlexInputRef.instance.style.visibility = 'hidden';
            this.toDeratedInputRef.instance.style.visibility = 'visible';
        }
    }

    private toDeratedDialogVisible = Subject.create(false);

    private toDeratedDialogTitle = Subject.create<string>('');

    private toDeratedThrustPrevious: number;

    private toDeratedThrustNext: number;

    private toDeratedThrustSelected() {
        this.toDeratedDialogVisible.set(true);
    }

    private toNoiseFieldsRefs = [FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private toNoiseButtonRef = FSComponent.createRef<HTMLDivElement>();

    private toNoiseEndLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private toNoiseEndInputRef = FSComponent.createRef<HTMLDivElement>();

    // CLB page subjects, refs and methods
    private clbDeratedClbSelectedIndex = Subject.create(0);

    private clbPredictionsReference = Subject.create<number>(null);

    private clbPreSelSpdTarget = Subject.create<number>(null);

    private clbNoiseFieldsRefs = [FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private clbNoiseButtonRef = FSComponent.createRef<HTMLDivElement>();

    private clbSpdLimLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private clbNoiseEndLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private clbSpdLimValueRef = FSComponent.createRef<HTMLDivElement>();

    private clbNoiseEndInputRef = FSComponent.createRef<HTMLDivElement>();

    // CRZ page subjects, refs and methods
    private destAirportIdent = Subject.create<string>('');

    private destEta = Subject.create<string>('--:--');

    private destEfob = Subject.create<string>(null);

    // DES page subjects, refs and methods
    private desCabinDesRate = Subject.create<number>(-850);

    private desManagedSpdTarget = Subject.create<number>(276);

    private desManagedMachTarget = Subject.create<number>(0.84);

    private desPredictionsReference = Subject.create<number>(null);

    private transFl = Subject.create<number>(5000);

    private transFlIsPilotEntered = Subject.create<boolean>(false);

    // APPR page subjects, refs and methods
    private apprIdent = Subject.create<string>('');

    private apprMag = Subject.create<number>(null);

    private apprWind = Subject.create<number>(null);

    private apprOat = Subject.create<number>(null);

    private apprQnh = Subject.create<number>(null);

    private apprMinimumBaro = Subject.create<number>(null);

    private apprMinimumRadio = Subject.create<number>(null);

    private apprSelectedFlapsIndex = Subject.create<number>(1);

    private apprVapp = Subject.create<number>(134);

    // GA page subjects, refs and methods

    protected onNewData(): void {
        console.time('PERF:onNewData');

        const pd = this.loadedFlightPlan.performanceData;
        const fm = this.props.fmService.fmgc.data;

        if (pd.cruiseFlightLevel) {
            this.crzFl.set(pd.cruiseFlightLevel.get());
        }

        if (pd.v1) {
            this.toV1.set(pd.v1.get());
        }

        if (pd.vr) {
            this.toVR.set(pd.vr.get());
        }

        if (pd.v2) {
            this.toV2.set(pd.v2.get());
        }

        if (fm.takeoffPowerSetting) {
            this.toSelectedThrustSettingIndex.set(fm.takeoffPowerSetting.get());
            this.showToThrustSettings(fm.takeoffPowerSetting.get());
        }

        if (fm.takeoffFlexTemp) {
            this.toFlexTemp.set(fm.takeoffFlexTemp.get());
        }

        if (fm.takeoffDeratedSetting) {
            this.toSelectedDeratedIndex.set(fm.takeoffDeratedSetting.get());
        }

        if (fm.takeoffFlapsSetting) {
            this.toSelectedFlapsIndex.set(fm.takeoffFlapsSetting.get() - 1);
        }

        if (fm.takeoffPacks) {
            this.toSelectedPacksIndex.set(fm.takeoffPacks.get());
        }

        if (fm.takeoffAntiIce) {
            this.toSelectedAntiIceIndex.set(fm.takeoffAntiIce.get());
        }

        if (pd.thrustReductionAltitudeIsPilotEntered) {
            this.thrRedAltIsPilotEntered.set(pd.thrustReductionAltitudeIsPilotEntered.get());
        }

        if (pd.thrustReductionAltitude) {
            this.thrRedAlt.set(pd.thrustReductionAltitude.get());
        }

        if (pd.accelerationAltitudeIsPilotEntered) {
            this.accelRedAltIsPilotEntered.set(pd.accelerationAltitudeIsPilotEntered.get());
        }

        if (pd.accelerationAltitude) {
            this.accelAlt.set(pd.accelerationAltitude.get());
        }

        if (fm.noiseEnabled) {
            this.showNoiseFields(fm.noiseEnabled.get());
        }

        if (pd.transitionAltitudeIsFromDatabase) {
            this.transAltIsPilotEntered.set(!pd.transitionAltitudeIsFromDatabase.get());
        }

        if (pd.transitionAltitude) {
            console.log(pd.transitionAltitude.get());
            console.log(pd.pilotTransitionAltitude.get());
            this.transAlt.set(pd.transitionAltitude.get());
        }

        if (pd.engineOutAccelerationAltitudeIsPilotEntered) {
            this.eoAccelAltIsPilotEntered.set(pd.engineOutAccelerationAltitudeIsPilotEntered.get());
        }

        if (pd.engineOutAccelerationAltitude) {
            this.eoAccelAlt.set(pd.engineOutAccelerationAltitude.get());
        }

        if (pd.thrustReductionAltitudeIsPilotEntered) {
            this.thrRedAltIsPilotEntered.set(pd.thrustReductionAltitudeIsPilotEntered.get());
        }

        if (pd.pilotThrustReductionAltitude) {
            this.thrRedAlt.set(pd.pilotThrustReductionAltitude.get());
        }

        this.activeFlightPhase.set(SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum'));

        if (this.loadedFlightPlan.originRunway) {
            this.originRunwayIdent.set(this.loadedFlightPlan.originRunway.ident.replace('RW', '').padEnd(4, ' '));
            this.originRunwayLength.set(this.loadedFlightPlan.originRunway.length ?? 4000);
        }

        if (this.loadedFlightPlan.destinationAirport) {
            this.destAirportIdent.set(this.loadedFlightPlan.destinationAirport.ident);
            this.destEta.set('00:00');
            this.destEfob.set(this.props.fmService.fmgc.getDestEFOB(true).toFixed(1));
        }

        if (this.loadedFlightPlan.approach) {
            this.apprIdent.set(this.loadedFlightPlan.approach.ident);
        }

        if (fm.approachFlapConfig) {
            this.apprSelectedFlapsIndex.set(fm.approachFlapConfig.get() - 3);
        }

        if (pd.transitionLevelIsFromDatabase) {
            this.transFlIsPilotEntered.set(!pd.transitionLevelIsFromDatabase.get());
        }

        if (pd.transitionLevel) {
            this.transFl.set(pd.transitionLevel.get());
        }

        console.timeEnd('PERF:onNewData');
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // If extra parameter for activeUri is given, navigate to flight phase sub-page
        switch (this.props.uiService.activeUri.get().extra) {
        case 'to':
            this.flightPhasesSelectedPageIndex.set(0);
            break;
        case 'clb':
            this.flightPhasesSelectedPageIndex.set(1);
            break;
        case 'crz':
            this.flightPhasesSelectedPageIndex.set(2);
            break;
        case 'des':
            this.flightPhasesSelectedPageIndex.set(3);
            break;
        case 'appr':
            this.flightPhasesSelectedPageIndex.set(4);
            break;
        case 'ga':
            this.flightPhasesSelectedPageIndex.set(5);
            break;

        default:
            break;
        }

        // Get flight phase
        const sub = this.props.bus.getSubscriber<MfdSimvars>();
        this.subs.push(sub.on('flightPhase').whenChanged().handle((val) => {
            console.log(`flight phase: ${val}`);
            this.activeFlightPhase.set(val);

            if (val === FmgcFlightPhase.Cruise || val === FmgcFlightPhase.Descent) {
                this.activateApprButton.instance.style.visibility = 'visible';
            } else {
                this.activateApprButton.instance.style.visibility = 'hidden';
            }
        }));

        this.subs.push(this.toSelectedFlapsIndex.sub((v) => {
            // Convert to FlapConf
            this.props.fmService.fmgc.data.takeoffFlapsSetting.set(v + 1);
        }));
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="mfd-page-container">
                    <div style="margin: 15px; display: flex; justify-content: space-between;">
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">CRZ</span>
                            <InputField<number>
                                dataEntryFormat={new FlightLevelFormat()}
                                dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.cruiseFlightLevel.set(v)}
                                mandatory={Subject.create(false)}
                                value={this.crzFl}
                            />
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">OPT</span>
                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                            <span class="mfd-value-green">---</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">REC MAX</span>
                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                            <span class="mfd-value-green">---</span>
                        </div>
                    </div>
                    <TopTabNavigator
                        pageTitles={Subject.create(['T.O', 'CLB', 'CRZ', 'DES', 'APPR', 'GA'])}
                        selectedPageIndex={this.flightPhasesSelectedPageIndex}
                        pageChangeCallback={(val) => this.flightPhasesSelectedPageIndex.set(val)}
                        selectedTabTextColor="white"
                        activeFlightPhase={this.activeFlightPhase}
                    >
                        <TopTabNavigatorPage>
                            {/* T.O */}
                            <div class="mfd-fms-perf-to-first">
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">RWY</span>
                                    <span class="mfd-value-green">{this.originRunwayIdent}</span>
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">T.O SHIFT</span>
                                    <InputField<number>
                                        dataEntryFormat={new LengthFormat(Subject.create(1), this.originRunwayLength)} // TODO replace 4000 with length of RWY
                                        mandatory={Subject.create(false)}
                                        value={this.toShift}
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-to-second">
                                <div class="mfd-fms-perf-to-v-speeds">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">V1</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.v1.set(v)}
                                            mandatory={Subject.create(true)}
                                            value={this.toV1}
                                            alignText="flex-end"
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">F</span>
                                        <span class="mfd-value-green">{this.props.fmService.fmgc.data.flapRetractionSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">VR</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.vr.set(v)}
                                            mandatory={Subject.create(true)}
                                            value={this.toVR}
                                            alignText="flex-end"
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">S</span>
                                        <span class="mfd-value-green">{this.props.fmService.fmgc.data.slatRetractionSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">V2</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.v2.set(v)}
                                            mandatory={Subject.create(true)}
                                            value={this.toV2}
                                            alignText="flex-end"
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span style="margin-right: 15px; justify-content: center;">
                                            <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                        </span>
                                        <span class="mfd-value-green">{this.props.fmService.fmgc.data.cleanSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <ConfirmationDialog
                                    visible={this.toDeratedDialogVisible}
                                    cancelAction={() => {
                                        this.toDeratedDialogVisible.set(false);
                                        this.props.fmService.fmgc.data.takeoffDeratedSetting.set(this.toDeratedThrustPrevious);
                                    }}
                                    confirmAction={() => {
                                        this.toDeratedDialogVisible.set(false);
                                        this.props.fmService.fmgc.data.takeoffDeratedSetting.set(this.toDeratedThrustNext);
                                    }}
                                    contentContainerStyle="width: 325px; height: 165px;"
                                >
                                    {this.toDeratedDialogTitle}
                                </ConfirmationDialog>
                                <div class="mfd-fms-perf-to-flex-toga" style="width: 200px;">
                                    <span style="width: 175px; display: inline; margin-left: 15px;">
                                        <RadioButtonGroup
                                            values={['TOGA', 'FLEX', 'DERATED']}
                                            onModified={(val) => this.toThrustSettingChanged(val)}
                                            selectedIndex={this.toSelectedThrustSettingIndex}
                                            idPrefix="toThrustSettingRadio"
                                            additionalVerticalSpacing={15}
                                        />
                                    </span>
                                </div>
                                <div class="mfd-fms-perf-to-flex-toga" style="width: 125px;">
                                    <div class="mfd-label-value-container" style="margin-top: 60px;" ref={this.toFlexInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new TemperatureFormat(Subject.create(0), Subject.create(99))}
                                            dataHandlerDuringValidation={async (v) => {
                                                // Special case: 0 means no FLEX, 0.1 means FLEX TEMP of 0
                                                await SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', v === 0 ? 0.1 : v);
                                                this.props.fmService.fmgc.data.takeoffFlexTemp.set(v);
                                            }}
                                            mandatory={Subject.create(false)}
                                            value={this.toFlexTemp}
                                        />
                                    </div>
                                    <div style="margin-top: 0px" ref={this.toDeratedInputRef}>
                                        <DropdownMenu
                                            values={this.toDeratedThrustOptions}
                                            selectedIndex={this.toSelectedDeratedIndex}
                                            onModified={(val) => {
                                                this.toDeratedThrustPrevious = this.toSelectedDeratedIndex.get();
                                                this.toDeratedThrustNext = val;
                                                this.toDeratedDialogTitle.set(`DERATED ${this.toDeratedThrustOptions.get(val)}`);
                                                this.toDeratedThrustSelected();
                                            }}
                                            idPrefix="deratedDropdown"
                                            freeTextAllowed={false}
                                            containerStyle="width: 100px;"
                                            numberOfDigitsForInputField={3}
                                            alignLabels="flex-start"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="mfd-fms-perf-to-flaps-packs-grid">
                                <div><span class="mfd-label">FLAPS</span></div>
                                <div><span class="mfd-label">THS FOR</span></div>
                                <div style="grid-row-start: span 2; border-left: 1px solid lightgrey; margin-right: 10px;" />
                                <div><span class="mfd-label">PACKS</span></div>
                                <div><span class="mfd-label">ANTI ICE</span></div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['1', '2', '3'])}
                                        selectedIndex={this.toSelectedFlapsIndex}
                                        idPrefix="flapDropdown"
                                        freeTextAllowed={false}
                                        containerStyle="width: 75px;"
                                        numberOfDigitsForInputField={1}
                                        alignLabels="center"
                                    />
                                </div>
                                <div style="margin-top: 15px; align-self: center;">
                                    <InputField<number>
                                        dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(99.9))}
                                        dataHandlerDuringValidation={async (v) => this.props.fmService.fmgc.data.takeoffThsFor.set(v)}
                                        mandatory={Subject.create(true)}
                                        value={this.props.fmService.fmgc.data.takeoffThsFor}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF/APU', 'ON'])}
                                        selectedIndex={this.props.fmService.fmgc.data.takeoffPacks}
                                        idPrefix="packsDropdown"
                                        freeTextAllowed={false}
                                        numberOfDigitsForInputField={8}
                                        alignLabels="center"
                                        containerStyle="width: 200px;"
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF', 'ENG ONLY', 'ENG + WING'])}
                                        selectedIndex={this.props.fmService.fmgc.data.takeoffAntiIce}
                                        idPrefix="antiIceDropdown"
                                        freeTextAllowed={false}
                                        numberOfDigitsForInputField={10}
                                        alignLabels="center"
                                        containerStyle="width: 225px;"
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-to-thrred-noise-grid">
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.performanceData.pilotThrustReductionAltitude.set(v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.thrRedAltIsPilotEntered}
                                        value={this.thrRedAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <div class="mfd-fms-perf-to-thrred-noise-grid-cell" ref={this.toNoiseFieldsRefs[0]} style="margin-bottom: 15px; margin-right: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="mfd-label" style="width: 40px; margin-left: 10px; text-align: right">N1</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.toNoiseFieldsRefs[1]} style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new PercentageFormat(Subject.create(40), Subject.create(110))}
                                            mandatory={Subject.create(false)}
                                            value={this.props.fmService.fmgc.data.noiseN1}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2;">
                                    <div ref={this.toNoiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
                                        <Button label="CANCEL<br />NOISE" onClick={() => this.showNoiseFields(false)} />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">ACCEL</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotAccelerationAltitude.set(v || undefined)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.accelRedAltIsPilotEntered}
                                        value={this.accelAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <div ref={this.toNoiseFieldsRefs[3]} class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="mfd-label" style="width: 40px; margin-left: 10px; text-align: right">SPD</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.toNoiseFieldsRefs[4]} style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            mandatory={Subject.create(false)}
                                            value={this.props.fmService.fmgc.data.noiseSpeed}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span ref={this.toNoiseEndLabelRef} class="mfd-label">NOISE END</span>
                                </div>
                                <div>
                                    <div ref={this.toNoiseButtonRef} style="display: flex;">
                                        <Button label="NOISE" onClick={() => this.showNoiseFields(true)}>
                                            NOISE
                                        </Button>
                                    </div>
                                    <div ref={this.toNoiseEndInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            mandatory={Subject.create(false)}
                                            value={this.noiseEndAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div />
                                <div />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-to-bottom">
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">TRANS</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeFormat(Subject.create(1), Subject.create(maxCertifiedAlt))}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotTransitionAltitude.set(v || undefined)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.transAltIsPilotEntered}
                                        value={this.transAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">EO ACCEL</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotEngineOutAccelerationAltitude.set(v || undefined)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.eoAccelAltIsPilotEntered}
                                        value={this.eoAccelAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <Button label="CPNY T.O<br />REQUEST" onClick={() => console.log('CPNY T.O REQUEST')} buttonStyle="padding-left: 30px; padding-right: 30px" />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* CLB */}
                            <div style="display: flex; justify-content: space-between;">
                                <div class="mfd-label-value-container" style="padding: 15px; margin-bottom: 15px;">
                                    <span class="mfd-label mfd-spacing-right">CI</span>
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                    />
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">DERATED CLB</span>
                                    <DropdownMenu
                                        values={ArraySubject.create(['NONE', '01', '02', '03', '04', '05'])}
                                        selectedIndex={this.props.fmService.fmgc.data.climbDerated}
                                        idPrefix="deratedClbDropdown"
                                        freeTextAllowed={false}
                                        containerStyle="width: 125px;"
                                        numberOfDigitsForInputField={4}
                                        alignLabels="center"
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-clb-grid">
                                <div class="mfd-fms-perf-speed-table-cell br">
                                    <div class="mfd-label">MODE</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">SPD</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">MACH</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">PRED TO </div>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(Subject.create(0), Subject.create(maxCertifiedAlt), this.transAlt)}
                                        mandatory={Subject.create(false)}
                                        value={this.clbPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class="mfd-label">PRESEL</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.climbPreSelSpeed}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class="mfd-label green">MANAGED</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.props.fmService.fmgc.data.climbManagedSpeedFromCostIndex.get().toFixed(0)}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">--:--   ----</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell br" style="justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label">ECON</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">---</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <span class="mfd-value-green">-.--</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;" />
                                <div style="border-right: 1px solid lightgrey; height: 40px;" />
                                <div />
                                <div />
                                <div />
                            </div>
                            <div class="mfd-fms-perf-to-thrred-noise-grid">
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.thrRedAltIsPilotEntered}
                                        value={this.thrRedAlt}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan?.performanceData.pilotThrustReductionAltitude.set(v || undefined)}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[0]} class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="mfd-label" style="width: 40px; margin-left: 10px; text-align: right">N1</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[1]} style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new PercentageFormat(Subject.create(40), Subject.create(110))}
                                            mandatory={Subject.create(false)}
                                            value={this.props.fmService.fmgc.data.noiseN1}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2; display: flex; justify-content: center; align-items: center;">
                                    <div ref={this.clbNoiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
                                        <Button label="CANCEL<br />NOISE" onClick={() => this.showNoiseFields(false)} />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">ACCEL</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.accelRedAltIsPilotEntered}
                                        value={this.accelAlt}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan?.performanceData.pilotAccelerationAltitude.set(v || undefined)}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[3]} class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px;">
                                        <svg fill="#ffffff" height="35px" width="35px" viewBox="0 0 60 60">
                                            <polygon points="0,28 50,28 50,20 60,30 50,40 50,32 0,32" />
                                        </svg>
                                        <span class="mfd-label" style="width: 40px; margin-left: 10px; text-align: right">SPD</span>
                                    </div>
                                </div>
                                <div>
                                    <div ref={this.clbNoiseFieldsRefs[4]} style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            mandatory={Subject.create(false)}
                                            value={this.props.fmService.fmgc.data.noiseSpeed}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 150px;">
                                    <span ref={this.clbSpdLimLabelRef} class="mfd-label">CLB SPD LIM</span>
                                    <span ref={this.clbNoiseEndLabelRef} class="mfd-label">NOISE END</span>
                                </div>
                                <div style="grid-column-start: span 4; width: 300px;">
                                    <div ref={this.clbSpdLimValueRef} style="grid-row-start: span 3; display: flex; justify-content: flex-start; align-items: center;">
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.climbSpeedLimit.get().speed.toFixed(0)}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <span class="mfd-value-green">/</span>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                                            <span class="mfd-value-green">{(this.props.fmService.fmgc.data.climbSpeedLimit.get().underAltitude / 100).toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div ref={this.clbNoiseEndInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            mandatory={Subject.create(false)}
                                            value={this.noiseEndAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin: 5px 2px 3px 2px;">
                                <div ref={this.clbNoiseButtonRef} style="display: flex;">
                                    <Button label="NOISE" onClick={() => this.showNoiseFields(true)} />
                                </div>
                                <div class="mfd-label-value-container" style="margin-left: 50px;">
                                    <span class="mfd-label mfd-spacing-right">TRANS</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeFormat(Subject.create(1), Subject.create(maxCertifiedAlt))}
                                        mandatory={Subject.create(false)}
                                        value={this.transAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div>
                                    <Button disabled={Subject.create(true)} label="SPD CSTR" onClick={() => this.props.uiService.navigateTo('fms/active/f-pln-vert-rev')}>
                                        SPD CSTR
                                    </Button>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* CRZ */}
                            <div style="display: flex; justify-content: space-between;">
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">CI</span>
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-crz-grid">
                                <div class="mfd-fms-perf-speed-table-cell br">
                                    <div class="mfd-label">MODE</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">MACH</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">SPD</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="flex-direction: column;">
                                    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                        <div class="mfd-label mfd-spacing-right">AT</div>
                                        <div class="mfd-value-green bigger">TOKMA</div>
                                    </div>
                                    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                        <div class="mfd-label mfd-spacing-right">STEP TO</div>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                                            <span class="mfd-value-green bigger">360</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class="mfd-label">PRESEL</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.cruisePreSelMach}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.cruisePreSelSpeed}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class="mfd-label green">MANAGED</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">.82</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">---</span>
                                        <span class="mfd-label-unit mfd-unit-trailing"> </span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">00:45   298</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell br" style="justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label">ECON</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <span class="mfd-value-green">.82</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">314</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;" />
                                <div class="mfd-fms-perf-speed-table-cell br" style="border-bottom: none; justify-content: flex-end; padding: 5px;">
                                    <div class="mfd-label">LRC</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;">
                                    <span class="mfd-value-green">.84</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">---</span>
                                        <span class="mfd-label-unit mfd-unit-trailing"> </span>
                                    </div>
                                </div>
                                <div />
                                <div class="mfd-fms-perf-speed-table-cell br" style="border-bottom: none; justify-content: flex-end; padding: 5px;">
                                    <div class="mfd-label">MAX TURB</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;">
                                    <span class="mfd-value-green">.85</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">---</span>
                                        <span class="mfd-label-unit mfd-unit-trailing"> </span>
                                    </div>
                                </div>
                                <div />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-crz-dest">
                                <span class="mfd-label bigger">DEST</span>
                                <span class="mfd-label green bigger">{this.destAirportIdent}</span>
                                <span class="mfd-label green bigger">{this.destEta}</span>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-value-green">{this.destEfob}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                                <div style="display: flex; flex-direction: row;">
                                    <Button disabled={Subject.create(true)} label="CMS" onClick={() => console.log('CMS')} buttonStyle="margin-right: 10px;" />
                                    <Button disabled={Subject.create(true)} label="STEP ALTs" onClick={() => this.props.uiService.navigateTo('fms/active/f-pln-vert-rev')} />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* DES */}
                            <div style="display: flex; justify-content: space-between;">
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">CI</span>
                                    <InputField<number>
                                        dataEntryFormat={new CostIndexFormat()}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                    />
                                </div>
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">DES CABIN RATE</span>
                                    <InputField<number>
                                        dataEntryFormat={new DescentRateFormat(Subject.create(-999), Subject.create(-100))}
                                        mandatory={Subject.create(false)}
                                        value={this.props.fmService.fmgc.data.descentCabinRate}
                                        containerStyle="width: 175px;"
                                        alignText="flex-end"
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-crz-grid">
                                <div class="mfd-fms-perf-speed-table-cell br">
                                    <div class="mfd-label">MODE</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">MACH</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">SPD</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label">PRED TO </div>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(Subject.create(0), Subject.create(maxCertifiedAlt), this.transFl)}
                                        mandatory={Subject.create(false)}
                                        value={this.desPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class="mfd-label green biggest">MANAGED</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <InputField<number>
                                        disabled={Subject.create(true)}
                                        dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                        mandatory={Subject.create(false)}
                                        value={this.desManagedMachTarget}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <InputField<number>
                                        disabled={Subject.create(true)}
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        mandatory={Subject.create(false)}
                                        value={this.desManagedSpdTarget}
                                        alignText="flex-end"
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">--:--   ----</span>
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell" style="height: 100px;" />
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-table-cell br" style="border-bottom: none; justify-content: flex-end; height: 75px;" />
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;" />
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;" />
                                <div class="mfd-fms-perf-speed-table-cell" style="border-bottom: none; padding: 5px;" />
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-crz-dest">
                                <span class="mfd-label bigger">DEST</span>
                                <span class="mfd-label green bigger">{this.destAirportIdent}</span>
                                <span class="mfd-label green bigger">{this.destEta}</span>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-value-green">{this.destEfob}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                                <div style="display: flex; flex-direction: row;">
                                    <Button disabled={Subject.create(true)} label="SPD CSTR" onClick={() => this.props.uiService.navigateTo('fms/active/f-pln-vert-rev')} />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* APPR */}
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid lightgrey;">
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">APPR</span>
                                    <span class="mfd-value-green">{this.apprIdent}</span>
                                </div>
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-value-green">{this.destAirportIdent}</span>
                                </div>
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">LW</span>
                                    <span class="mfd-value-green">---.-</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: row;">
                                {/* left column */}
                                <div style="flex: 5; display: flex; flex-direction: column;">
                                    <div style="border: 1px solid lightgrey; display: flex; flex-direction: column; margin: 20px 40px 20px 0px; padding: 15px;">
                                        <div style="display: flex; flex-direction: row;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">MAG WIND</span>
                                            <div style="border: 1px solid lightgrey; display: flex; flex-direction: row; padding: 2px;">
                                                <InputField<number>
                                                    dataEntryFormat={new WindDirectionFormat()}
                                                    mandatory={Subject.create(false)}
                                                    value={this.props.fmService.fmgc.data.approachWind.map((it) => it.direction)}
                                                    onModified={(v) => this.props.fmService.fmgc.data.approachWind.set(
                                                        { direction: v, speed: this.props.fmService.fmgc.data.approachWind.get().speed },
                                                    )}
                                                    alignText="center"
                                                />
                                                <InputField<number>
                                                    dataEntryFormat={new WindSpeedFormat()}
                                                    mandatory={Subject.create(false)}
                                                    value={this.props.fmService.fmgc.data.approachWind.map((it) => it.speed)}
                                                    onModified={(v) => this.props.fmService.fmgc.data.approachWind.set(
                                                        { direction: this.props.fmService.fmgc.data.approachWind.get().direction, speed: v },
                                                    )}
                                                    containerStyle="margin-left: 10px;"
                                                    alignText="center"
                                                />
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <div class="mfd-label-value-container" style="padding: 15px;">
                                                <span class="mfd-label mfd-spacing-right">HD</span>
                                                <span class="mfd-value-green">---</span>
                                            </div>
                                            <div class="mfd-label-value-container" style="padding: 15px;">
                                                <span class="mfd-label mfd-spacing-right">CROSS</span>
                                                <span class="mfd-value-green">---</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 20px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">OAT</span>
                                            <InputField<number>
                                                dataEntryFormat={new TemperatureFormat(Subject.create(-99), Subject.create(99))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmService.fmgc.data.approachTemperature}
                                                containerStyle="width: 125px;"
                                                alignText="flex-end"
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">QNH</span>
                                            <InputField<number>
                                                dataEntryFormat={new QnhFormat()}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmService.fmgc.data.approachQnh}
                                                containerStyle="width: 125px;"
                                                alignText="flex-end"
                                            />
                                        </div>
                                    </div>
                                    <div class="mfd-fms-perf-appr-min-container">
                                        <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-min-label">
                                            MINIMUM
                                        </span>
                                        <div style="display: flex; flex-direction: row;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">BARO</span>
                                            <InputField<number>
                                                dataEntryFormat={new AltitudeFormat(Subject.create(0), Subject.create(maxCertifiedAlt))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmService.fmgc.data.approachBaroMinimum}
                                                containerStyle="width: 150px;"
                                                alignText="flex-end"
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">RADIO</span>
                                            <InputField<number>
                                                dataEntryFormat={new AltitudeFormat(Subject.create(0), Subject.create(maxCertifiedAlt))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmService.fmgc.data.approachRadioMinimum}
                                                containerStyle="width: 150px;"
                                                alignText="flex-end"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* right column */}
                                <div style="flex: 4; display: flex; flex-direction: column;">
                                    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 30px;">
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-fms-perf-appr-flap-speeds">
                                                <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                            </span>
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.cleanSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">S</span>
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.slatRetractionSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">F</span>
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.flapRetractionSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container" style="padding-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">VREF</span>
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.approachVref}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div class="mfd-fms-perf-appr-conf-box">
                                        <RadioButtonGroup
                                            values={['CONF 3', 'FULL']}
                                            selectedIndex={this.apprSelectedFlapsIndex}
                                            onModified={(v) => this.props.fmService.fmgc.data.approachFlapConfig.set(v + 3)}
                                            idPrefix="apprFlapsSettingsRadio"
                                            additionalVerticalSpacing={15}
                                        />
                                        <div class="mfd-label-value-container" style="margin-top: 10px;">
                                            <span class="mfd-label mfd-spacing-right">VLS</span>
                                            <span class="mfd-value-green">{this.props.fmService.fmgc.data.approachVls}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div class="mfd-fms-perf-appr-vapp-box">
                                        <div style="display: flex; flex-direction: row; justify-content: center; justify-self; center;">
                                            <span class="mfd-label mfd-spacing-right" style="text-align: right; align-self: center;">VAPP</span>
                                            <InputField<number>
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmService.fmgc.data.approachSpeed}
                                                alignText="flex-end"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-appr-trans-vertdev">
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right" style="width: 125px; text-align: right; align-self: center; padding-left: 20px;">TRANS</span>
                                    <InputField<number>
                                        dataEntryFormat={new FlightLevelFormat()}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotTransitionLevel.set(v)}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.transFlIsPilotEntered}
                                        value={this.transFl}
                                        containerStyle="width: 110px;"
                                        alignText="flex-start"
                                    />
                                </div>
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">VERT DEV</span>
                                    <span class="mfd-value-green">+-----</span>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* GA */}
                            <div style="margin: 60px 0px 100px 200px; display: flex; flex-direction: column;">
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">F</span>
                                    <span class="mfd-value-green">{this.props.fmService.fmgc.data.flapRetractionSpeed}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">S</span>
                                    <span class="mfd-value-green">{this.props.fmService.fmgc.data.slatRetractionSpeed}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                </div>
                                <div class="mfd-label-value-container">
                                    <span style="margin-right: 15px; text-align: right;">
                                        <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                    </span>
                                    <span class="mfd-value-green">{this.props.fmService.fmgc.data.cleanSpeed}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; flex-direction: row;">
                                    <div class="mfd-fms-perf-appr-thrred-accel">
                                        <span class="mfd-label">THR RED</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.loadedFlightPlan.performanceData.pilotThrustReductionAltitude.set(v || undefined);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.thrRedAltIsPilotEntered}
                                            value={this.thrRedAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: row;">
                                    <div class="mfd-fms-perf-appr-thrred-accel">
                                        <span class="mfd-label">ACCEL</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotAccelerationAltitude.set(v || undefined)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.accelRedAltIsPilotEntered}
                                            value={this.accelAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                    <div class="mfd-fms-perf-appr-eo-accel">
                                        <span class="mfd-label">EO ACCEL</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            dataHandlerDuringValidation={async (v) => this.loadedFlightPlan.performanceData.pilotEngineOutAccelerationAltitude.set(v || undefined)}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.eoAccelAltIsPilotEntered}
                                            value={this.eoAccelAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-label-value-container">
                                <span class="mfd-label mfd-spacing-right" style="width: 150px; text-align: right;">TRANS</span>
                                <span class="mfd-value-green">{this.transAlt}</span>
                                <span class="mfd-label-unit mfd-unit-trailing">FT</span>
                            </div>
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                    <div class="mfd-fms-perf-appr-footer">
                        <div>
                            <Button label="RETURN" onClick={() => this.props.uiService.navigateTo('back')} buttonStyle="margin-right: 5px;" />
                        </div>
                        <div ref={this.activateApprButton} style="margin-right: 5px;">
                            <Button
                                label={Subject.create(
                                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                                        <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                            ACTIVATE
                                            <br />
                                            APPR
                                        </span>
                                        <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                    </div>,
                                )}
                                onClick={() => console.log('ACTIVATE APPR')}
                                buttonStyle="color: #e68000; padding-right: 2px;"
                            />
                        </div>
                        <div>
                            <Button label="POS MONITOR" onClick={() => console.log('POS MONITOR')} />
                        </div>
                        <div style="flex: 1" />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

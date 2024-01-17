/* eslint-disable jsx-a11y/label-has-associated-control */

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { ArraySubject, ClockEvents, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import './MfdFmsPerf.scss';
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
    TimeHHMMFormat,
    WindDirectionFormat,
    WindSpeedFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Mmo, Vmo, maxCertifiedAlt } from '@shared/PerformanceConstants';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { ConfirmationDialog } from 'instruments/src/MFD/pages/common/ConfirmationDialog';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FmgcFlightPhase } from '@shared/flightphase';
import { TakeoffDerated, TakeoffPowerSetting } from 'instruments/src/MFD/fmgc';
import { ConditionalComponent } from 'instruments/src/MFD/pages/common/ConditionalComponent';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Feet } from 'msfs-geo';
import { A380SpeedsUtils } from '@shared/OperatingSpeeds';

interface MfdFmsPerfProps extends AbstractMfdPageProps {
}

export class MfdFmsPerf extends FmsPage<MfdFmsPerfProps> {
    private activateApprButton = FSComponent.createRef<HTMLDivElement>();

    private managedSpeedActive = Subject.create<boolean>(false);

    // Subjects
    private crzFl = Subject.create<number>(null);

    private recMaxFl = Subject.create<string>('---');

    private optFl = Subject.create<string>('---');

    private flightPhasesSelectedPageIndex = Subject.create(0);

    private costIndex = Subject.create<number>(null);

    private transAlt = Subject.create(5000);

    private transAltIsPilotEntered = Subject.create<boolean>(false);

    private thrRedAlt = Subject.create<number>(AirlineModifiableInformation.EK.thrRedAlt);

    private thrRedAltIsPilotEntered = Subject.create<boolean>(false);

    private accelAlt = Subject.create<number>(AirlineModifiableInformation.EK.accAlt);

    private accelRedAltIsPilotEntered = Subject.create<boolean>(false);

    private noiseEndAlt = Subject.create<number>(800);

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

    private vSpeedsConfirmationRef = [
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private flapSpeedsRef = [
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>(),
        FSComponent.createRef<HTMLDivElement>()];

    private shouldShowConfirmVSpeeds() {
        const pd = this.loadedFlightPlan.performanceData;
        const fm = this.props.fmcService.master.fmgc.data;
        const vSpeedSet = pd.v1 !== undefined || pd.vr !== undefined || pd.v2 !== undefined;
        const tbc = fm.v1ToBeConfirmed.get() !== undefined || fm.vrToBeConfirmed.get() !== undefined || fm.v2ToBeConfirmed.get() !== undefined;
        this.showConfirmVSpeeds(!vSpeedSet && tbc);
    }

    private showConfirmVSpeeds(visible: boolean) {
        if (visible === true) {
            this.flapSpeedsRef.forEach((ref) => ref.instance.style.display = 'none');
            this.vSpeedsConfirmationRef.forEach((ref) => ref.instance.style.display = 'flex');
        } else {
            this.flapSpeedsRef.forEach((ref) => ref.instance.style.display = 'flex');
            this.vSpeedsConfirmationRef.forEach((ref) => ref.instance.style.display = 'none');
        }
    }

    private toSelectedThrustSettingIndex = Subject.create<TakeoffPowerSetting>(0);

    private toFlexTemp = Subject.create<number>(null);

    private toSelectedDeratedIndex = Subject.create<TakeoffDerated>(0);

    private originRunwayLength = Subject.create<number>(4000);

    private toSelectedFlapsIndex = Subject.create(0);

    private toSelectedPacksIndex = Subject.create(1);

    private toSelectedAntiIceIndex = Subject.create(0);

    private eoAccelAlt = Subject.create(AirlineModifiableInformation.EK.eoAccAlt);

    private eoAccelAltIsPilotEntered = Subject.create<boolean>(false);

    private toFlexInputRef = FSComponent.createRef<HTMLDivElement>();

    private toDeratedInputRef = FSComponent.createRef<HTMLDivElement>();

    private toDeratedThrustOptions = ArraySubject.create(['D01', 'D02', 'D03', 'D04', 'D05']);

    private toThrustSettingChanged(newIndex: TakeoffPowerSetting) {
        this.props.fmcService.master.fmgc.data.takeoffPowerSetting.set(newIndex);
        this.showToThrustSettings(newIndex);

        if (newIndex === TakeoffPowerSetting.FLEX) {
            // FLEX
            SimVar.SetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'Number', this.props.fmcService.master.fmgc.data.takeoffFlexTemp.get() ?? 0.1);
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

    private clbTableModeLine1 = Subject.create<string>('PRESEL');

    private clbTableSpdLine1 = Subject.create<string>(undefined);

    private clbTableMachLine1 = Subject.create<string>(undefined);

    private clbTablePredLine1 = Subject.create<string>('--:--   ----');

    private clbTableModeLine2 = Subject.create<string>('MANAGED');

    private clbTableSpdLine2 = Subject.create<string>('250');

    private clbTableMachLine2 = Subject.create<string>(undefined);

    private clbTablePredLine2 = Subject.create<string>(undefined);

    private clbTableModeLine3 = Subject.create<string>('ECON');

    private clbTableSpdLine3 = Subject.create<string>('314');

    private clbTableMachLine3 = Subject.create<string>('.82');

    private clbTablePredLine3 = Subject.create<string>(undefined);

    private clbNoiseTableRef = FSComponent.createRef<HTMLDivElement>();

    // CRZ page subjects, refs and methods
    private crzPredStepRef = FSComponent.createRef<HTMLDivElement>();

    private crzPredTdRef = FSComponent.createRef<HTMLDivElement>();

    private crzPredStepAheadRef = FSComponent.createRef<HTMLDivElement>();

    private crzPredDriftDownRef = FSComponent.createRef<HTMLDivElement>();

    private crzPredWaypoint = Subject.create<string>('');

    private crzPredAltitudeTarget = Subject.create<Feet>(null);

    private crzTableModeLine1 = Subject.create<string>('PRESEL');

    private crzTableSpdLine1 = Subject.create<string>(undefined);

    private crzTableMachLine1 = Subject.create<string>(undefined);

    private crzTablePredLine1 = Subject.create<string>(undefined);

    private crzTableModeLine2 = Subject.create<string>('MANAGED');

    private crzTableSpdLine2 = Subject.create<string>('---');

    private crzTableMachLine2 = Subject.create<string>('.82');

    private crzTablePredLine2 = Subject.create<string>('--:--   ----');

    private crzTableModeLine3 = Subject.create<string>(undefined);

    private crzTableSpdLine3 = Subject.create<string>(undefined);

    private crzTableMachLine3 = Subject.create<string>(undefined);

    private crzTablePredLine3 = Subject.create<string>(undefined);

    private destAirportIdent = Subject.create<string>('');

    private destEta = Subject.create<string>('--:--');

    private destEfob = Subject.create<string>('--.-');

    // DES page subjects, refs and methods
    private desManagedSpdTarget = Subject.create<number>(276);

    private desManagedMachTarget = Subject.create<number>(0.84);

    private desPredictionsReference = Subject.create<number>(null);

    private desTableModeLine1 = Subject.create<string>('PRESEL');

    private desTableSpdLine1 = Subject.create<string>(undefined);

    private desTableMachLine1 = Subject.create<string>(undefined);

    private desTablePredLine1 = Subject.create<string>('--:--   ----');

    private desTableModeLine2 = Subject.create<string>('MANAGED');

    private desTableSpdLine2 = Subject.create<string>('250');

    private desTableMachLine2 = Subject.create<string>(undefined);

    private desTablePredLine2 = Subject.create<string>(undefined);

    private transFl = Subject.create<number>(5000);

    private transFlIsPilotEntered = Subject.create<boolean>(false);

    // APPR page subjects, refs and methods
    private apprIdent = Subject.create<string>('');

    private apprHeadwind = Subject.create<string>('');

    private apprCrosswind = Subject.create<string>('');

    private apprSelectedFlapsIndex = Subject.create<number>(1);

    private apprLandingWeight = Subject.create<number>(undefined);

    private ldgRwyThresholdLocation = Subject.create<Feet>(undefined);

    // GA page subjects, refs and methods

    protected onNewData(): void {
        console.time('PERF:onNewData');

        const pd = this.loadedFlightPlan.performanceData;
        const fm = this.props.fmcService.master.fmgc.data;

        if (pd.cruiseFlightLevel) {
            this.crzFl.set(pd.cruiseFlightLevel);
        }

        if (pd.costIndex) {
            this.costIndex.set(pd.costIndex);
        }

        if (fm.takeoffShift) {
            this.toShift.set(fm.takeoffShift.get());
        }

        if (pd.v1) {
            this.toV1.set(pd.v1);
        }

        if (pd.vr) {
            this.toVR.set(pd.vr);
        }

        if (pd.v2) {
            this.toV2.set(pd.v2);
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
            this.thrRedAltIsPilotEntered.set(pd.thrustReductionAltitudeIsPilotEntered);
        }

        if (pd.thrustReductionAltitude) {
            this.thrRedAlt.set(pd.thrustReductionAltitude);
        }

        if (pd.accelerationAltitudeIsPilotEntered) {
            this.accelRedAltIsPilotEntered.set(pd.accelerationAltitudeIsPilotEntered);
        }

        if (pd.accelerationAltitude) {
            this.accelAlt.set(pd.accelerationAltitude);
        }

        if (fm.noiseEnabled) {
            this.showNoiseFields(fm.noiseEnabled.get());
        }

        if (fm.noiseEndAltitude) {
            this.noiseEndAlt.set(fm.noiseEndAltitude.get());
        }

        if (pd.transitionAltitudeIsFromDatabase) {
            this.transAltIsPilotEntered.set(!pd.transitionAltitudeIsFromDatabase);
        }

        if (pd.transitionAltitude) {
            this.transAlt.set(pd.transitionAltitude);
        }

        if (pd.engineOutAccelerationAltitudeIsPilotEntered) {
            this.eoAccelAltIsPilotEntered.set(pd.engineOutAccelerationAltitudeIsPilotEntered);
        }

        if (pd.engineOutAccelerationAltitude) {
            this.eoAccelAlt.set(pd.engineOutAccelerationAltitude);
        }

        if (pd.thrustReductionAltitudeIsPilotEntered) {
            this.thrRedAltIsPilotEntered.set(pd.thrustReductionAltitudeIsPilotEntered);
        }

        if (pd.pilotThrustReductionAltitude) {
            this.thrRedAlt.set(pd.pilotThrustReductionAltitude);
        }

        this.activeFlightPhase.set(SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum'));

        if (this.loadedFlightPlan.originRunway) {
            this.originRunwayIdent.set(this.loadedFlightPlan.originRunway.ident.replace('RW', '').padEnd(4, ' '));
            this.originRunwayLength.set(this.loadedFlightPlan.originRunway.length ?? 4000);
        }

        // V-speeds to be confirmed due to rwy change?
        this.shouldShowConfirmVSpeeds();

        if (this.loadedFlightPlan.destinationAirport) {
            this.destAirportIdent.set(this.loadedFlightPlan.destinationAirport.ident);
        }

        if (this.loadedFlightPlan.approach) {
            this.apprIdent.set(this.loadedFlightPlan.approach.ident);
        }

        if (fm.approachFlapConfig) {
            this.apprSelectedFlapsIndex.set(fm.approachFlapConfig.get() - 3);
        }

        if (pd.transitionLevelIsFromDatabase) {
            this.transFlIsPilotEntered.set(!pd.transitionLevelIsFromDatabase);
        }

        if (pd.transitionLevel) {
            this.transFl.set(pd.transitionLevel);
        }

        console.timeEnd('PERF:onNewData');
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

        // If extra parameter for activeUri is given, navigate to flight phase sub-page
        switch (this.props.mfd.uiService.activeUri.get().extra) {
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
        this.subs.push(this.activeFlightPhase.sub((val) => {
            if (val === FmgcFlightPhase.Climb || val === FmgcFlightPhase.Cruise || val === FmgcFlightPhase.Descent) {
                this.activateApprButton.instance.style.visibility = 'visible';
            } else {
                this.activateApprButton.instance.style.visibility = 'hidden';
            }
        }, true));

        this.subs.push(this.toSelectedFlapsIndex.sub((v) => {
            // Convert to FlapConf
            const flapConf = v + 1;
            this.props.fmcService.master.fmgc.data.takeoffFlapsSetting.set(flapConf);
            this.props.fmcService.master.acInterface.setTakeoffFlaps(flapConf);
        }));

        this.subs.push(sub.on('realTime').atFrequency(1).handle((_t) => {
            // Update REC MAX FL, OPT FL
            const recMaxFl = this.props.fmcService.master.getRecMaxFlightLevel();
            this.recMaxFl.set(Number.isFinite(recMaxFl) ? recMaxFl.toFixed(0) : '---');
            const optFl = this.props.fmcService.master.getOptFlightLevel();
            this.optFl.set(Number.isFinite(optFl) ? optFl.toFixed(0) : '---');

            const obs = this.props.fmcService.master.guidanceController.verticalProfileComputationParametersObserver.get();

            // CLB PRED TO automatic update
            if (this.activeFlightPhase.get() === FmgcFlightPhase.Climb) {
                this.props.fmcService.master.fmgc.data.climbPredictionsReferenceAutomatic
                    .set(this.props.fmcService.master.guidanceController.verticalProfileComputationParametersObserver.get().fcuAltitude);
            } else {
                this.props.fmcService.master.fmgc.data.climbPredictionsReferenceAutomatic.set(null);
            }

            this.managedSpeedActive.set((obs.fcuSpeedManaged as unknown) === 1); // Should be boolean, but is number

            // Update CLB speed table
            const clbSpeedLimit = this.props.fmcService.master.fmgc.getClimbSpeedLimit();
            if (this.activeFlightPhase.get() < FmgcFlightPhase.Climb) {
                this.clbTableModeLine1.set('PRESEL');
                this.clbTableSpdLine1.set(undefined);
                this.clbTableMachLine1.set(undefined);
                this.clbTablePredLine1.set(undefined);
                this.clbTableModeLine2.set('MANAGED');
                this.clbTableSpdLine2.set(clbSpeedLimit.speed.toFixed(0));
                this.clbTableMachLine2.set(undefined);
                this.clbTablePredLine2.set('--:--   ----');
                this.clbTableModeLine3.set('ECON');
                this.clbTableSpdLine3.set(this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                this.clbTableMachLine3.set(`.${this.props.fmcService.master.fmgc.getManagedClimbSpeedMach().toFixed(2).split('.')[1]}`);
                this.clbTablePredLine3.set(undefined);
            } else if (this.managedSpeedActive.get() === true) {
                this.clbTableModeLine1.set('MANAGED');
                // TODO add speed restriction (ECON, SPD LIM, ...) in smaller font
                if (clbSpeedLimit && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < clbSpeedLimit.underAltitude) {
                    this.clbTableSpdLine1.set(clbSpeedLimit.speed.toFixed(0));
                    this.clbTableMachLine1.set(`.${(SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', clbSpeedLimit.speed) as number).toFixed(2).split('.')[1]}`);
                    this.clbTableModeLine3.set('ECON');
                    this.clbTableSpdLine3.set(this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                    this.clbTableMachLine3.set(`.${this.props.fmcService.master.fmgc.getManagedClimbSpeedMach().toFixed(2).split('.')[1]}`);
                    this.clbTablePredLine3.set(undefined);
                } else {
                    this.clbTableSpdLine1.set(this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                    this.clbTableMachLine1.set(`.${this.props.fmcService.master.fmgc.getManagedClimbSpeedMach().toFixed(2).split('.')[1]}`);
                    this.clbTableModeLine3.set(undefined);
                    this.clbTableSpdLine3.set(undefined);
                    this.clbTableMachLine3.set(undefined);
                    this.clbTablePredLine3.set(undefined);
                }
                // TODO add predictions
                this.clbTablePredLine1.set(undefined);
                this.clbTableModeLine2.set(undefined);
                this.clbTableSpdLine2.set(undefined);
                this.clbTableMachLine2.set(undefined);
                this.clbTablePredLine2.set(undefined);
            } else {
                this.clbTableModeLine1.set('SELECTED');
                this.clbTableSpdLine1.set((obs.fcuSpeed < 1) ? undefined : obs.fcuSpeed.toFixed(0));
                this.clbTableMachLine1.set((obs.fcuSpeed < 1) ? `.${obs.fcuSpeed.toFixed(2).split('.')[1]}` : undefined);
                this.clbTablePredLine1.set(undefined);

                this.clbTableModeLine2.set('MANAGED');
                // TODO add speed restriction (ECON, SPD LIM, ...) in smaller font
                if (clbSpeedLimit && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < clbSpeedLimit.underAltitude) {
                    this.clbTableSpdLine2.set(clbSpeedLimit.speed.toFixed(0));
                    this.clbTableMachLine2.set(`.${(SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', clbSpeedLimit.speed) as number).toFixed(2).split('.')[1]}`);
                } else {
                    this.clbTableSpdLine2.set(this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                    this.clbTableMachLine2.set(`.${this.props.fmcService.master.fmgc.getManagedClimbSpeedMach().toFixed(2).split('.')[1]}`);
                }
                this.clbTablePredLine2.set(undefined);
                this.clbTableModeLine3.set('ECON');
                this.clbTableSpdLine3.set(this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                this.clbTableMachLine3.set(`.${this.props.fmcService.master.fmgc.getManagedClimbSpeedMach().toFixed(2).split('.')[1]}`);
                this.clbTablePredLine3.set(undefined);
            }
            this.clbNoiseTableRef.instance.style.visibility = this.activeFlightPhase.get() >= FmgcFlightPhase.Climb ? 'hidden' : 'visible';

            // Update CRZ prediction
            const crzPred = this.props.fmcService.master?.guidanceController?.vnavDriver?.getPerfCrzToPrediction();
            if (crzPred?.reason !== undefined && crzPred.reason === VerticalCheckpointReason.TopOfDescent) {
                this.crzPredStepRef.getOrDefault().style.display = 'none';
                this.crzPredDriftDownRef.getOrDefault().style.display = 'none';
                this.crzPredTdRef.getOrDefault().style.display = 'block';
                this.crzPredStepAheadRef.getOrDefault().style.display = 'none';
            } else {
                this.crzPredTdRef.getOrDefault().style.display = 'none';
                this.crzPredDriftDownRef.getOrDefault().style.display = 'none';
                if (crzPred?.distanceFromPresentPosition !== undefined && crzPred.distanceFromPresentPosition < 20) {
                    this.crzPredStepRef.getOrDefault().style.display = 'none';
                    this.crzPredStepAheadRef.getOrDefault().style.display = 'block';
                } else {
                    this.crzPredStepRef.getOrDefault().style.display = 'block';
                    this.crzPredStepAheadRef.getOrDefault().style.display = 'none';
                    this.crzPredWaypoint.set('N/A'); // Where to get this from?
                    this.crzPredAltitudeTarget.set(0); // Where to get this from?
                }
            }

            if (crzPred?.secondsFromPresent !== undefined && crzPred?.distanceFromPresentPosition !== undefined) {
                if (this.activeFlightPhase.get() < FmgcFlightPhase.Cruise) {
                    if (this.props.fmcService.master.fmgc.data.cruisePreSelSpeed.get() || this.props.fmcService.master.fmgc.data.cruisePreSelMach.get()) {
                        this.crzTablePredLine1.set(`${(new TimeHHMMFormat()).format(crzPred.secondsFromPresent / 60)}${crzPred.distanceFromPresentPosition.toFixed(0).padStart(6, ' ')}`);
                        this.crzTablePredLine2.set('');
                    } else {
                        // Managed
                        this.crzTablePredLine1.set('');
                        this.crzTablePredLine2.set(`${(new TimeHHMMFormat()).format(crzPred.secondsFromPresent / 60)}${crzPred.distanceFromPresentPosition.toFixed(0).padStart(6, ' ')}`);
                    }
                } else {
                    this.crzTablePredLine1.set(`${(new TimeHHMMFormat()).format(crzPred.secondsFromPresent / 60)}${crzPred.distanceFromPresentPosition.toFixed(0).padStart(6, ' ')}`);
                    this.crzTablePredLine2.set('');
                }
            }

            // Update CRZ speed table
            this.crzTableModeLine3.set(undefined);
            this.crzTableSpdLine3.set(undefined);
            this.crzTableMachLine3.set(undefined);
            this.crzTablePredLine3.set(undefined);

            if (this.activeFlightPhase.get() < FmgcFlightPhase.Cruise) {
                this.crzTableModeLine1.set('PRESEL');
                this.crzTableSpdLine1.set(undefined);
                this.crzTableMachLine1.set(undefined);
                this.crzTablePredLine1.set(undefined);
                this.crzTableModeLine2.set('MANAGED');
                this.crzTableSpdLine2.set('---');
                this.crzTableMachLine2.set(`.${this.props.fmcService.master.fmgc.getManagedCruiseSpeedMach().toFixed(2).split('.')[1]}`);
                this.crzTablePredLine2.set('--:--   ----');
            } else if (this.managedSpeedActive.get() === true) {
                this.crzTableModeLine1.set('MANAGED');
                // TODO add speed restriction (ECON, SPD LIM, ...) in smaller font
                this.crzTableSpdLine1.set(obs.fcuSpeed < 1 ? '---' : this.props.fmcService.master.fmgc.getManagedClimbSpeed().toFixed(0));
                this.crzTableMachLine1.set(obs.fcuSpeed < 1 ? `.${this.props.fmcService.master.fmgc.getManagedCruiseSpeedMach().toFixed(2).split('.')[1]}` : '.--');

                // TODO add predictions
                this.crzTablePredLine1.set('--:--   ----');
                this.crzTableModeLine2.set(undefined);
                this.crzTableSpdLine2.set(undefined);
                this.crzTableMachLine2.set(undefined);
                this.crzTablePredLine2.set(undefined);
            } else {
                this.crzTableModeLine1.set('SELECTED');
                this.crzTableSpdLine1.set((obs.fcuSpeed < 1) ? '---' : obs.fcuSpeed.toFixed(0));
                this.crzTableMachLine1.set((obs.fcuSpeed < 1) ? `.${obs.fcuSpeed.toFixed(2).split('.')[1]}` : undefined);
                this.crzTablePredLine1.set(undefined);

                this.crzTableModeLine2.set('MANAGED');
                // TODO add speed restriction (ECON, SPD LIM, ...) in smaller font
                this.crzTableSpdLine2.set(obs.fcuSpeed < 1 ? '---' : this.props.fmcService.master.fmgc.getManagedCruiseSpeed().toFixed(0));
                this.crzTableMachLine2.set(obs.fcuSpeed < 1 ? `.${this.props.fmcService.master.fmgc.getManagedCruiseSpeedMach().toFixed(2).split('.')[1]}` : '.--');
                this.crzTablePredLine2.set(undefined);
            }

            // Update CRZ DEST predictions
            const destPred = this.props.fmcService.master?.guidanceController?.vnavDriver?.getDestinationPrediction();
            if (destPred?.secondsFromPresent !== undefined) {
                this.destEta.set((new TimeHHMMFormat()).format(destPred.secondsFromPresent / 60)[0]);
                this.destEfob.set(this.props.fmcService.master.fmgc.getDestEFOB(true).toFixed(1));
            }

            // Update DES speed table
            if (this.activeFlightPhase.get() < FmgcFlightPhase.Descent) {
                this.desTableModeLine1.set('MANAGED');
                this.desTableSpdLine1.set(undefined);
                this.desTableMachLine1.set(undefined);
                this.desTablePredLine1.set('--:--  ----');
                this.desTableModeLine2.set(undefined);
                this.desTableSpdLine2.set(undefined);
                this.desTableMachLine2.set(undefined);
                this.desTablePredLine2.set(undefined);
            } else if (this.managedSpeedActive.get() === true) {
                this.desTableModeLine1.set('MANAGED');
                this.desTableSpdLine1.set(this.props.fmcService.master.fmgc.getManagedDescentSpeed().toFixed(0));
                this.desTableMachLine1.set(`.${this.props.fmcService.master.fmgc.getManagedDescentSpeedMach().toFixed(2).split('.')[1]}`);
                this.desTablePredLine1.set('--:--  ----');
                this.desTableModeLine2.set(undefined);
                this.desTableSpdLine2.set(undefined);
                this.desTableMachLine2.set(undefined);
                this.desTablePredLine2.set(undefined);
            } else {
                this.desTableModeLine1.set('SELECTED');
                this.desTableSpdLine1.set((obs.fcuSpeed < 1) ? undefined : obs.fcuSpeed.toFixed(0));
                this.desTableMachLine1.set((obs.fcuSpeed < 1) ? `.${obs.fcuSpeed.toFixed(2).split('.')[1]}` : undefined);
                this.desTablePredLine1.set('--:--  ----');
                this.desTableModeLine2.set('MANAGED');
                this.desTableSpdLine2.set(this.props.fmcService.master.fmgc.getManagedDescentSpeed().toFixed(0));
                this.desTableMachLine2.set(`.${this.props.fmcService.master.fmgc.getManagedDescentSpeedMach().toFixed(2).split('.')[1]}`);
                this.desTablePredLine2.set(undefined);
            }

            // Update APPR page
            this.apprLandingWeight.set(this.props.fmcService.master.getLandingWeight());
            if (this.props.fmcService.master.fmgc.data.approachWind.get()?.direction
            && this.props.fmcService.master.fmgc.data.approachWind.get()?.speed
            && this.loadedFlightPlan.destinationRunway) {
                const towerHeadwind = A380SpeedsUtils.getHeadwind(
                    this.props.fmcService.master.fmgc.data.approachWind.get().speed,
                    this.props.fmcService.master.fmgc.data.approachWind.get().direction,
                    this.loadedFlightPlan.destinationRunway.magneticBearing,
                );
                if (towerHeadwind < 0) {
                    this.apprHeadwind.set(`-${Math.abs(towerHeadwind).toFixed(0).padStart(2, '0')}`);
                } else {
                    this.apprHeadwind.set(towerHeadwind.toFixed(0).padStart(3, '0'));
                }
                const towerCrosswind = A380SpeedsUtils.getHeadwind(
                    this.props.fmcService.master.fmgc.data.approachWind.get().speed,
                    this.props.fmcService.master.fmgc.data.approachWind.get().direction,
                    this.loadedFlightPlan.destinationRunway.magneticBearing + 90,
                );
                this.apprCrosswind.set(Math.abs(towerCrosswind).toFixed(0).padStart(3, '0'));
            } else {
                this.apprHeadwind.set('---');
                this.apprCrosswind.set('---');
            }
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
                                dataHandlerDuringValidation={async (v) => this.props.fmcService.master.acInterface.setCruiseFl(v)}
                                mandatory={Subject.create(false)}
                                value={this.crzFl}
                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                            />
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">OPT</span>
                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                            <span class="mfd-value-green">{this.optFl}</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">REC MAX</span>
                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                            <span class="mfd-value-green">{this.recMaxFl}</span>
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
                                        dataEntryFormat={new LengthFormat(Subject.create(1), this.originRunwayLength)}
                                        dataHandlerDuringValidation={async (v) => this.props.fmcService.master.fmgc.data.takeoffShift.set(v)}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        value={this.toShift}
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-perf-to-second">
                                <div class="mfd-fms-perf-to-v-speeds">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">V1</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.loadedFlightPlan.setPerformanceData('v1', v);
                                                SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', v);
                                            }}
                                            mandatory={Subject.create(true)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.toV1}
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <div ref={this.vSpeedsConfirmationRef[0]}>
                                            <span class="mfd-value-tmpy">{this.props.fmcService.master.fmgc.data.v1ToBeConfirmed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div ref={this.vSpeedsConfirmationRef[3]} style="grid-row-start: span 3; display: flex; justify-content: flex-end; align-items: flex-end;">
                                        <Button
                                            label={Subject.create(
                                                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                                                    <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                                        CONFIRM
                                                        <br />
                                                        T.O SPDs
                                                    </span>
                                                    <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                                </div>,
                                            )}
                                            onClick={() => {
                                                const fm = this.props.fmcService.master.fmgc.data;
                                                SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', fm.v1ToBeConfirmed.get());
                                                this.loadedFlightPlan.setPerformanceData('v1', fm.v1ToBeConfirmed.get());
                                                fm.v1ToBeConfirmed.set(undefined);
                                                SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', fm.vrToBeConfirmed.get());
                                                this.loadedFlightPlan.setPerformanceData('vr', fm.vrToBeConfirmed.get());
                                                fm.vrToBeConfirmed.set(undefined);
                                                SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', fm.v2ToBeConfirmed.get());
                                                this.loadedFlightPlan.setPerformanceData('v2', fm.v2ToBeConfirmed.get());
                                                fm.v2ToBeConfirmed.set(undefined);
                                            }}
                                            buttonStyle="color: yellow; padding-right: 2px;"
                                        />
                                    </div>
                                    <div ref={this.flapSpeedsRef[0]} class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">F</span>
                                        <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.flapRetractionSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">VR</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => {
                                                SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', v);
                                                this.loadedFlightPlan.setPerformanceData('vr', v);
                                            }}
                                            mandatory={Subject.create(true)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.toVR}
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <div ref={this.vSpeedsConfirmationRef[1]}>
                                            <span class="mfd-value-tmpy">{this.props.fmcService.master.fmgc.data.vrToBeConfirmed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div ref={this.flapSpeedsRef[1]} class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">S</span>
                                        <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.slatRetractionSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-label mfd-spacing-right">V2</span>
                                        <InputField<number>
                                            dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                            dataHandlerDuringValidation={async (v) => {
                                                SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', v);
                                                this.loadedFlightPlan.setPerformanceData('v2', v);
                                            }}
                                            mandatory={Subject.create(true)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.toV2}
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-label-value-container">
                                        <div ref={this.vSpeedsConfirmationRef[2]}>
                                            <span class="mfd-value-tmpy">{this.props.fmcService.master.fmgc.data.v2ToBeConfirmed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div ref={this.flapSpeedsRef[2]} class="mfd-label-value-container">
                                        <span style="margin-right: 15px; justify-content: center;">
                                            <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                        </span>
                                        <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.greenDotSpeed}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <ConfirmationDialog
                                    visible={this.toDeratedDialogVisible}
                                    cancelAction={() => {
                                        this.toDeratedDialogVisible.set(false);
                                        this.props.fmcService.master.fmgc.data.takeoffDeratedSetting.set(this.toDeratedThrustPrevious);
                                    }}
                                    confirmAction={() => {
                                        this.toDeratedDialogVisible.set(false);
                                        this.props.fmcService.master.fmgc.data.takeoffDeratedSetting.set(this.toDeratedThrustNext);
                                    }}
                                    contentContainerStyle="width: 325px; height: 165px;"
                                >
                                    {this.toDeratedDialogTitle}
                                </ConfirmationDialog>
                                <div class="mfd-fms-perf-to-flex-toga" style="width: 200px;">
                                    <span style="width: 175px; display: inline; margin-left: 15px;">
                                        <RadioButtonGroup
                                            values={['TOGA', 'FLEX', 'DERATED']}
                                            valuesDisabled={this.activeFlightPhase.map((it) => Array(3).fill(it >= FmgcFlightPhase.Takeoff))}
                                            onModified={(val) => this.toThrustSettingChanged(val)}
                                            selectedIndex={this.toSelectedThrustSettingIndex}
                                            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_toThrustSettingRadio`}
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
                                                this.props.fmcService.master.fmgc.data.takeoffFlexTemp.set(v);
                                            }}
                                            mandatory={Subject.create(false)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.toFlexTemp}
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_deratedDropdown`}
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
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        selectedIndex={this.toSelectedFlapsIndex}
                                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_flapDropdown`}
                                        freeTextAllowed={false}
                                        containerStyle="width: 75px;"
                                        numberOfDigitsForInputField={1}
                                        alignLabels="center"
                                    />
                                </div>
                                <div style="margin-top: 15px; align-self: center;">
                                    <InputField<number>
                                        dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(99.9))}
                                        dataHandlerDuringValidation={async (v) => {
                                            this.props.fmcService.master.fmgc.data.takeoffThsFor.set(v);
                                            this.props.fmcService.master.acInterface.setTakeoffTrim(v);
                                        }}
                                        mandatory={Subject.create(true)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        value={this.props.fmcService.master.fmgc.data.takeoffThsFor}
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF/APU', 'ON'])}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        selectedIndex={this.props.fmcService.master.fmgc.data.takeoffPacks}
                                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_packsDropdown`}
                                        freeTextAllowed={false}
                                        numberOfDigitsForInputField={8}
                                        alignLabels="center"
                                        containerStyle="width: 200px;"
                                    />
                                </div>
                                <div style="margin-top: 15px;">
                                    <DropdownMenu
                                        values={ArraySubject.create(['OFF', 'ENG ONLY', 'ENG + WING'])}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        selectedIndex={this.props.fmcService.master.fmgc.data.takeoffAntiIce}
                                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_antiIceDropdown`}
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
                                            this.loadedFlightPlan.setPerformanceData('pilotThrustReductionAltitude', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        enteredByPilot={this.thrRedAltIsPilotEntered}
                                        value={this.thrRedAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.props.fmcService.master.fmgc.data.noiseN1}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2;">
                                    <div ref={this.toNoiseFieldsRefs[2]} style="display: flex; justify-content: center; align-items: center;">
                                        <ConditionalComponent
                                            width={112}
                                            height={62}
                                            condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            componentIfFalse={(
                                                <Button
                                                    label="CANCEL<br />NOISE"
                                                    onClick={() => {
                                                        this.props.fmcService.master.fmgc.data.noiseEnabled.set(false);
                                                        this.showNoiseFields(false);
                                                    }}
                                                >
                                                    NOISE
                                                </Button>
                                            )}
                                            componentIfTrue={<></>}
                                        />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">ACCEL</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('pilotAccelerationAltitude', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        enteredByPilot={this.accelRedAltIsPilotEntered}
                                        value={this.accelAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.props.fmcService.master.fmgc.data.noiseSpeed}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span ref={this.toNoiseEndLabelRef} class="mfd-label">NOISE END</span>
                                </div>
                                <div>
                                    <div ref={this.toNoiseButtonRef} style="display: flex;">
                                        <ConditionalComponent
                                            width={98}
                                            height={40}
                                            condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            componentIfFalse={(
                                                <Button
                                                    label="NOISE"
                                                    onClick={() => {
                                                        this.props.fmcService.master.fmgc.data.noiseEnabled.set(true);
                                                        this.showNoiseFields(true);
                                                    }}
                                                >
                                                    NOISE
                                                </Button>
                                            )}
                                            componentIfTrue={<></>}
                                        />
                                    </div>
                                    <div ref={this.toNoiseEndInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            dataHandlerDuringValidation={async (v) => this.props.fmcService.master.fmgc.data.noiseEndAltitude.set(v)}
                                            mandatory={Subject.create(false)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            value={this.noiseEndAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('pilotTransitionAltitude', v || undefined);
                                            this.props.fmcService.master.acInterface.updateTransitionAltitudeLevel();
                                        }}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.transAltIsPilotEntered}
                                        value={this.transAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">EO ACCEL</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('pilotEngineOutAccelerationAltitude', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        enteredByPilot={this.eoAccelAltIsPilotEntered}
                                        value={this.eoAccelAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div>
                                    <ConditionalComponent
                                        width={176}
                                        height={62}
                                        condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        componentIfFalse={(
                                            <Button
                                                label="CPNY T.O<br />REQUEST"
                                                disabled={Subject.create(true)}
                                                onClick={() => console.log('CPNY T.O REQUEST')}
                                                buttonStyle="padding-left: 30px; padding-right: 30px"
                                            />
                                        )}
                                        componentIfTrue={<></>}
                                    />
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
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('costIndex', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">DERATED CLB</span>
                                    <DropdownMenu
                                        values={ArraySubject.create(['NONE', '01', '02', '03', '04', '05'])}
                                        inactive={Subject.create(true)} // was: this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)
                                        selectedIndex={this.props.fmcService.master.fmgc.data.climbDerated}
                                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_deratedClbDropdown`}
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
                                        dataHandlerDuringValidation={async (v) => this.props.fmcService.master.fmgc.data.climbPredictionsReferencePilotEntry.set(v)}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                        enteredByPilot={this.props.fmcService.master.fmgc.data.climbPredictionsReferenceIsPilotEntered}
                                        value={this.props.fmcService.master.fmgc.data.climbPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        // eslint-disable-next-line max-len
                                        'green': MappedSubject.create(([fp, pSpeed]) => (fp >= FmgcFlightPhase.Climb && fp <= FmgcFlightPhase.Descent) || (fp < FmgcFlightPhase.Climb && (Number.isFinite(pSpeed))),
                                            this.activeFlightPhase,
                                            this.props.fmcService.master.fmgc.data.climbPreSelSpeed),
                                        'biggest': this.activeFlightPhase.map((it) => (it >= FmgcFlightPhase.Climb && it <= FmgcFlightPhase.Descent)),
                                    }}
                                    >
                                        {this.clbTableModeLine1}
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <ConditionalComponent
                                        condition={this.activeFlightPhase.map((it) => it < FmgcFlightPhase.Climb)}
                                        componentIfTrue={(
                                            <InputField<number>
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                mandatory={Subject.create(false)}
                                                inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                                value={this.props.fmcService.master.fmgc.data.climbPreSelSpeed}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        )}
                                        componentIfFalse={(
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green">{this.clbTableSpdLine1}</span>
                                                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.clbTableMachLine1}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.clbTablePredLine1}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        'green': MappedSubject.create(([fp, managed, pSpeed]) => (fp < FmgcFlightPhase.Climb && managed && !Number.isFinite(pSpeed)),
                                            this.activeFlightPhase,
                                            this.managedSpeedActive,
                                            this.props.fmcService.master.fmgc.data.climbPreSelSpeed),
                                    }}
                                    >
                                        {this.clbTableModeLine2}
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.clbTableSpdLine2}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.clbTableMachLine2}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.clbTablePredLine2}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell br" style="justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label">{this.clbTableModeLine3}</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.clbTableSpdLine3}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">{this.clbTableSpdLine3.map((it) => (it ? 'KT' : ''))}</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <span class="mfd-value-green">{this.clbTableMachLine3}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;" />
                                <div style="border-right: 1px solid lightgrey; height: 40px;" />
                                <div />
                                <div />
                                <div />
                            </div>
                            <div ref={this.clbNoiseTableRef} class="mfd-fms-perf-to-thrred-noise-grid">
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">THR RED</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                        enteredByPilot={this.thrRedAltIsPilotEntered}
                                        value={this.thrRedAlt}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan?.setPerformanceData('pilotThrustReductionAltitude', v || undefined)}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                            value={this.props.fmcService.master.fmgc.data.noiseN1}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                </div>
                                <div style="grid-row-start: span 2; display: flex; justify-content: center; align-items: center;">
                                    <div ref={this.clbNoiseFieldsRefs[2]} style=" display: flex; justify-content: center; align-items: center;">
                                        <ConditionalComponent
                                            width={98}
                                            height={40}
                                            condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                            componentIfFalse={(
                                                <Button
                                                    label="CANCEL<br />NOISE"
                                                    onClick={() => {
                                                        this.props.fmcService.master.fmgc.data.noiseEnabled.set(false);
                                                        this.showNoiseFields(false);
                                                    }}
                                                />
                                            )}
                                            componentIfTrue={<></>}
                                        />
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin-right: 15px; margin-bottom: 15px; width: 125px;">
                                    <span class="mfd-label">ACCEL</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                        enteredByPilot={this.accelRedAltIsPilotEntered}
                                        value={this.accelAlt}
                                        dataHandlerDuringValidation={async (v) => this.loadedFlightPlan?.setPerformanceData('pilotAccelerationAltitude', v || undefined)}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                            value={this.props.fmcService.master.fmgc.data.noiseSpeed}
                                            containerStyle="width: 110px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.climbSpeedLimit.get().speed.toFixed(0)}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <span class="mfd-value-green">/</span>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label-unit mfd-unit-leading">FL</span>
                                            <span class="mfd-value-green">{(this.props.fmcService.master.fmgc.data.climbSpeedLimit.get().underAltitude / 100).toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div ref={this.clbNoiseEndInputRef}>
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            mandatory={Subject.create(false)}
                                            inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                            value={this.noiseEndAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="flex-grow: 1;" />
                            {/* fill space vertically */}
                            <div class="mfd-fms-perf-to-thrred-noise-grid-cell" style="margin: 5px 2px 3px 2px;">
                                <div ref={this.clbNoiseButtonRef} style="display: flex;">
                                    <ConditionalComponent
                                        width={98}
                                        height={40}
                                        condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        componentIfFalse={(
                                            <Button
                                                label="NOISE"
                                                onClick={() => {
                                                    this.props.fmcService.master.fmgc.data.noiseEnabled.set(true);
                                                    this.showNoiseFields(true);
                                                }}
                                            >
                                                NOISE
                                            </Button>
                                        )}
                                        componentIfTrue={<></>}
                                    />
                                </div>
                                <div class="mfd-label-value-container" style="margin-left: 50px;">
                                    <span class="mfd-label mfd-spacing-right">TRANS</span>
                                    <InputField<number>
                                        dataEntryFormat={new AltitudeFormat(Subject.create(1), Subject.create(maxCertifiedAlt))}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Climb)}
                                        value={this.transAlt}
                                        containerStyle="width: 150px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div>
                                    <ConditionalComponent
                                        width={140}
                                        height={40}
                                        condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
                                        componentIfFalse={(
                                            <Button label="SPD CSTR" onClick={() => this.props.mfd.uiService.navigateTo('fms/active/f-pln-vert-rev')}>
                                                SPD CSTR
                                            </Button>
                                        )}
                                        componentIfTrue={<></>}
                                    />

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
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('costIndex', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                    <div ref={this.crzPredStepRef}>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right">AT</div>
                                            <div class="mfd-value-green bigger">{this.crzPredWaypoint}</div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right">STEP TO</div>
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-label-unit mfd-unit-leading">FL</span>
                                                <span class="mfd-value-green bigger">{this.crzPredAltitudeTarget}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div ref={this.crzPredTdRef}>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right">PRED TO</div>
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green bigger">T/D</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div ref={this.crzPredStepAheadRef}>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right green">STEP AHEAD</div>
                                        </div>
                                    </div>
                                    <div ref={this.crzPredDriftDownRef}>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right">DRIFT DOWN</div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                            <div class="mfd-label mfd-spacing-right">TO</div>
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-label-unit mfd-unit-leading">FL</span>
                                                <span class="mfd-value-green bigger">{this.crzPredAltitudeTarget}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        // eslint-disable-next-line max-len
                                        'green': MappedSubject.create(([fp, pSpeed, pMach]) => (fp >= FmgcFlightPhase.Climb && fp <= FmgcFlightPhase.Descent) || (fp < FmgcFlightPhase.Climb && (Number.isFinite(pSpeed) || Number.isFinite(pMach))),
                                            this.activeFlightPhase,
                                            this.props.fmcService.master.fmgc.data.cruisePreSelSpeed,
                                            this.props.fmcService.master.fmgc.data.cruisePreSelMach),
                                        'biggest': this.activeFlightPhase.map((it) => (it >= FmgcFlightPhase.Climb && it <= FmgcFlightPhase.Descent)),
                                    }}
                                    >
                                        {this.crzTableModeLine1}

                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <ConditionalComponent
                                        condition={this.activeFlightPhase.map((it) => it < FmgcFlightPhase.Cruise)}
                                        componentIfTrue={(
                                            <InputField<number>
                                                dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                                mandatory={Subject.create(false)}
                                                inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Cruise)}
                                                value={this.props.fmcService.master.fmgc.data.cruisePreSelMach}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        )}
                                        componentIfFalse={(
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green">{this.crzTableMachLine1}</span>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <ConditionalComponent
                                        condition={this.activeFlightPhase.map((it) => it < FmgcFlightPhase.Cruise)}
                                        componentIfTrue={(
                                            <InputField<number>
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                mandatory={Subject.create(false)}
                                                inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Cruise)}
                                                value={this.props.fmcService.master.fmgc.data.cruisePreSelSpeed}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        )}
                                        componentIfFalse={(
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green">{this.crzTableSpdLine1}</span>
                                                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" />
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        // eslint-disable-next-line max-len
                                        'green': MappedSubject.create(([fp, managed, pSpeed, pMach]) => (fp < FmgcFlightPhase.Climb && managed && !Number.isFinite(pSpeed) && !Number.isFinite(pMach)),
                                            this.activeFlightPhase,
                                            this.managedSpeedActive,
                                            this.props.fmcService.master.fmgc.data.cruisePreSelSpeed,
                                            this.props.fmcService.master.fmgc.data.cruisePreSelMach),
                                    }}
                                    >
                                        {this.crzTableModeLine2}

                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.crzTableMachLine2}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.crzTableSpdLine2}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">{this.crzTableSpdLine2.map((it) => (it ? 'KT' : ''))}</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.crzTablePredLine2}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">{this.crzTablePredLine2.map((it) => (it ? 'NM' : ''))}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell br" style="justify-content: flex-end; padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label">{this.crzTableModeLine3}</div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <span class="mfd-value-green">{this.crzTableMachLine3}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell" style="padding: 5px 15px 5px 15px;">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.crzTableSpdLine3}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">{this.crzTableSpdLine3.map((it) => (it ? 'KT' : ''))}</span>
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
                                    <Button
                                        disabled={Subject.create(true)}
                                        label="CMS"
                                        onClick={() => this.props.mfd.uiService.navigateTo('fms/active/f-pln-vert-rev/cms')}
                                        buttonStyle="margin-right: 10px;"
                                    />
                                    <Button
                                        disabled={Subject.create(true)}
                                        label="STEP ALTs"
                                        onClick={() => this.props.mfd.uiService.navigateTo('fms/active/f-pln-vert-rev/step-alts')}
                                    />
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
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('costIndex', v || undefined);
                                        }}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Cruise)}
                                        value={this.costIndex}
                                        containerStyle="width: 75px;"
                                        alignText="center"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div class="mfd-label-value-container" style="padding: 15px;">
                                    <span class="mfd-label mfd-spacing-right">DES CABIN RATE</span>
                                    <InputField<number>
                                        dataEntryFormat={new DescentRateFormat(Subject.create(-999), Subject.create(-100))}
                                        mandatory={Subject.create(false)}
                                        inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Cruise)}
                                        value={this.props.fmcService.master.fmgc.data.descentCabinRate}
                                        containerStyle="width: 175px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                        disabled={this.activeFlightPhase.map((it) => it !== FmgcFlightPhase.Descent)}
                                        value={this.desPredictionsReference}
                                        containerStyle="width: 150px; margin-left: 15px;"
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        // eslint-disable-next-line max-len
                                        'green': MappedSubject.create(([fp]) => (fp >= FmgcFlightPhase.Climb && fp <= FmgcFlightPhase.Descent) || fp < FmgcFlightPhase.Climb,
                                            this.activeFlightPhase),
                                        'biggest': this.activeFlightPhase.map((it) => (it >= FmgcFlightPhase.Climb && it <= FmgcFlightPhase.Descent)),
                                    }}
                                    >
                                        {this.desTableModeLine1}

                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <ConditionalComponent
                                        condition={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Descent)}
                                        componentIfFalse={(
                                            <InputField<number>
                                                disabled={Subject.create(true)}
                                                dataEntryFormat={new SpeedMachFormat(Subject.create(0.1), Subject.create(Mmo))}
                                                mandatory={Subject.create(false)}
                                                inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Descent)}
                                                value={this.desManagedMachTarget}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        )}
                                        componentIfTrue={(
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green">{this.desTableMachLine1}</span>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <ConditionalComponent
                                        condition={this.activeFlightPhase.map((it) => it < FmgcFlightPhase.Descent)}
                                        componentIfTrue={(
                                            <InputField<number>
                                                disabled={Subject.create(true)}
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                mandatory={Subject.create(false)}
                                                inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Descent)}
                                                value={this.desManagedSpdTarget}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        )}
                                        componentIfFalse={(
                                            <div class="mfd-label-value-container">
                                                <span class="mfd-value-green">{this.desTableSpdLine1}</span>
                                                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">--:--   ----</span>
                                </div>
                                <div class="mfd-fms-perf-speed-presel-managed-table-cell">
                                    <div class={{
                                        'mfd-label': true,
                                        'green': MappedSubject.create(([fp, managed, pSpeed]) => (fp < FmgcFlightPhase.Climb && (managed || !Number.isFinite(pSpeed))),
                                            this.activeFlightPhase,
                                            this.managedSpeedActive,
                                            this.props.fmcService.master.fmgc.data.descentPreSelSpeed),
                                    }}
                                    >
                                        {this.desTableModeLine2}

                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.desTableMachLine2}</span>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <div class="mfd-label-value-container">
                                        <span class="mfd-value-green">{this.desTableSpdLine2}</span>
                                        <span class="mfd-label-unit mfd-unit-trailing">{this.desTableSpdLine2.map((it) => (it ? 'KT' : ''))}</span>
                                    </div>
                                </div>
                                <div class="mfd-fms-perf-speed-table-cell">
                                    <span class="mfd-value-green">{this.desTablePredLine2}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">{this.desTablePredLine2.map((it) => (it ? 'NM' : ''))}</span>
                                </div>
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
                                    <Button disabled={Subject.create(true)} label="SPD CSTR" onClick={() => this.props.mfd.uiService.navigateTo('fms/active/f-pln-vert-rev')} />
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
                                    <span class="mfd-value-green">{this.apprLandingWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}</span>
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
                                                    value={this.props.fmcService.master.fmgc.data.approachWind.map((it) => it.direction)}
                                                    onModified={(v) => this.props.fmcService.master.fmgc.data.approachWind.set(
                                                        { direction: v, speed: this.props.fmcService.master.fmgc.data.approachWind.get().speed },
                                                    )}
                                                    alignText="center"
                                                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                                />
                                                <InputField<number>
                                                    dataEntryFormat={new WindSpeedFormat()}
                                                    mandatory={Subject.create(false)}
                                                    value={this.props.fmcService.master.fmgc.data.approachWind.map((it) => it.speed)}
                                                    onModified={(v) => this.props.fmcService.master.fmgc.data.approachWind.set(
                                                        { direction: this.props.fmcService.master.fmgc.data.approachWind.get().direction, speed: v },
                                                    )}
                                                    containerStyle="margin-left: 10px;"
                                                    alignText="center"
                                                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                                />
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <div class="mfd-label-value-container" style="padding: 15px;">
                                                <span class="mfd-label mfd-spacing-right">HD</span>
                                                <span class="mfd-value-green">{this.apprHeadwind}</span>
                                                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                            </div>
                                            <div class="mfd-label-value-container" style="padding: 15px;">
                                                <span class="mfd-label mfd-spacing-right">CROSS</span>
                                                <span class="mfd-value-green">{this.apprCrosswind}</span>
                                                <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 20px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">OAT</span>
                                            <InputField<number>
                                                dataEntryFormat={new TemperatureFormat(Subject.create(-99), Subject.create(99))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmcService.master.fmgc.data.approachTemperature}
                                                containerStyle="width: 125px;"
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">QNH</span>
                                            <InputField<number>
                                                dataEntryFormat={new QnhFormat()}
                                                dataHandlerDuringValidation={async (v) => {
                                                    if (v >= 745 && v <= 1050) {
                                                        SimVar.SetSimVarValue('L:A32NX_DESTINATION_QNH', 'Millibar', v);
                                                    } else {
                                                        SimVar.SetSimVarValue('L:A32NX_DESTINATION_QNH', 'Millibar', v * 33.8639);
                                                    }
                                                }}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmcService.master.fmgc.data.approachQnh}
                                                containerStyle="width: 125px;"
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                                dataHandlerDuringValidation={async (v) => {
                                                    SimVar.SetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet', v);
                                                }}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmcService.master.fmgc.data.approachBaroMinimum}
                                                containerStyle="width: 150px;"
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: row; margin-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right perf-appr-weather">RADIO</span>
                                            <InputField<number>
                                                dataEntryFormat={new AltitudeFormat(Subject.create(0), Subject.create(maxCertifiedAlt))}
                                                dataHandlerDuringValidation={async (v) => {
                                                    if (v === undefined) {
                                                        SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -1);
                                                    } else if (v === null) {
                                                        SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', -2);
                                                    } else {
                                                        SimVar.SetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet', v);
                                                    }
                                                }}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmcService.master.fmgc.data.approachRadioMinimum}
                                                containerStyle="width: 150px;"
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.greenDotSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">S</span>
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.slatRetractionSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">F</span>
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.flapRetractionSpeed}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                        <div class="mfd-label-value-container" style="padding-top: 15px;">
                                            <span class="mfd-label mfd-spacing-right mfd-fms-perf-appr-flap-speeds">VREF</span>
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.approachVref}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div class="mfd-fms-perf-appr-conf-box">
                                        <RadioButtonGroup
                                            values={['CONF 3', 'FULL']}
                                            selectedIndex={this.apprSelectedFlapsIndex}
                                            onModified={(v) => {
                                                this.props.fmcService.master.fmgc.data.approachFlapConfig.set(v + 3);
                                                if (v === 0) {
                                                    SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'boolean', true);
                                                } else {
                                                    SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'boolean', false);
                                                }
                                            }}
                                            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_apprFlapsSettingsRadio`}
                                            additionalVerticalSpacing={15}
                                        />
                                        <div class="mfd-label-value-container" style="margin-top: 10px;">
                                            <span class="mfd-label mfd-spacing-right">VLS</span>
                                            <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.approachVls}</span>
                                            <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                        </div>
                                    </div>
                                    <div class="mfd-fms-perf-appr-vapp-box">
                                        <div style="display: flex; flex-direction: row; justify-content: center; justify-self; center;">
                                            <span class="mfd-label mfd-spacing-right" style="text-align: right; align-self: center;">VAPP</span>
                                            <InputField<number>
                                                dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                                mandatory={Subject.create(false)}
                                                value={this.props.fmcService.master.fmgc.data.approachSpeed}
                                                alignText="flex-end"
                                                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                        dataHandlerDuringValidation={async (v) => {
                                            this.loadedFlightPlan.setPerformanceData('pilotTransitionLevel', v);
                                            this.props.fmcService.master.acInterface.updateTransitionAltitudeLevel();
                                        }}
                                        mandatory={Subject.create(false)}
                                        enteredByPilot={this.transFlIsPilotEntered}
                                        value={this.transFl}
                                        containerStyle="width: 110px;"
                                        alignText="flex-start"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                    <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.flapRetractionSpeed}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                </div>
                                <div class="mfd-label-value-container">
                                    <span class="mfd-label mfd-spacing-right">S</span>
                                    <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.slatRetractionSpeed}</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">KT</span>
                                </div>
                                <div class="mfd-label-value-container">
                                    <span style="margin-right: 15px; text-align: right;">
                                        <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6" cy="6" r="5" stroke="#00ff00" stroke-width="2" /></svg>
                                    </span>
                                    <span class="mfd-value-green">{this.props.fmcService.master.fmgc.data.greenDotSpeed}</span>
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
                                                this.loadedFlightPlan.setPerformanceData('pilotThrustReductionAltitude', v || undefined);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.thrRedAltIsPilotEntered}
                                            value={this.thrRedAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            dataHandlerDuringValidation={async (v) => {
                                                this.loadedFlightPlan.setPerformanceData('pilotAccelerationAltitude', v || undefined);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.accelRedAltIsPilotEntered}
                                            value={this.accelAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                    <div class="mfd-fms-perf-appr-eo-accel">
                                        <span class="mfd-label">EO ACCEL</span>
                                    </div>
                                    <div style="margin-bottom: 15px;">
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transAlt)}
                                            dataHandlerDuringValidation={async (v) => {
                                                this.loadedFlightPlan.setPerformanceData('pilotEngineOutAccelerationAltitude', v || undefined);
                                            }}
                                            mandatory={Subject.create(false)}
                                            enteredByPilot={this.eoAccelAltIsPilotEntered}
                                            value={this.eoAccelAlt}
                                            containerStyle="width: 150px;"
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                            <Button label="RETURN" onClick={() => this.props.mfd.uiService.navigateTo('back')} buttonStyle="margin-right: 5px;" />
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
                                onClick={() => this.props.fmcService.master.tryGoInApproachPhase()}
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
                <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
            </>
        );
    }
}

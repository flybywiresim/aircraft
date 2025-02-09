import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';

import {
  ArraySubject,
  ClockEvents,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import './MfdFmsFplnVertRev.scss';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  AltitudeOrFlightLevelFormat,
  FlightLevelFormat,
  SpeedKnotsFormat,
  TimeHHMMSSFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { maxCertifiedAlt, Vmo } from '@shared/PerformanceConstants';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { RadioButtonColor, RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { AltitudeDescriptor } from '@flybywiresim/fbw-sdk';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { FmgcData } from 'instruments/src/MFD/FMC/fmgc';
import { CruiseStepEntry } from '@fmgc/flightplanning/CruiseStep';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { getEtaFromUtcOrPresent } from 'instruments/src/MFD/shared/utils';
import { FmgcFlightPhase } from '@shared/flightphase';
import { DefaultPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

interface MfdFmsFplnVertRevProps extends AbstractMfdPageProps {}

export class MfdFmsFplnVertRev extends FmsPage<MfdFmsFplnVertRevProps> {
  private readonly selectedPageIndex = Subject.create(0);

  private readonly availableWaypoints = ArraySubject.create<string>([]);

  private availableWaypointsToLegIndex: number[] = [];

  /** Don't modify this directly, use selectedLegIndex for conversion to/from leg indices */
  private readonly dropdownMenuSelectedWaypointIndex = Subject.create<number | null>(null);

  get selectedLegIndex() {
    const dropdownIndex = this.dropdownMenuSelectedWaypointIndex.get();
    return dropdownIndex !== null && dropdownIndex in this.availableWaypointsToLegIndex
      ? this.availableWaypointsToLegIndex[dropdownIndex]
      : null;
  }

  set selectedLegIndex(legIndex: number | null) {
    if (legIndex === null) {
      this.dropdownMenuSelectedWaypointIndex.set(null);
      return;
    }

    const dropdownIndex = this.availableWaypointsToLegIndex.indexOf(legIndex);
    this.dropdownMenuSelectedWaypointIndex.set(dropdownIndex !== -1 ? dropdownIndex : null);
  }

  private readonly returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyColor = this.tmpyActive.map((it) => (it ? RadioButtonColor.Yellow : RadioButtonColor.Cyan));

  /** in feet */
  private readonly transitionAltitude = Subject.create<number | null>(null);
  /** in feet */
  private readonly transitionLevel = Subject.create<number | null>(null);

  private readonly constraintType = Subject.create<'CLB' | 'DES' | ''>('');

  private readonly spdConstraintTypeRadioSelected = Subject.create<number | null>(null);
  private readonly altConstraintTypeRadioSelected = Subject.create<number | null>(null);

  // RTA page

  // SPD page
  private readonly speedMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

  /** in knots */
  private readonly speedConstraintInput = Subject.create<number | null>(null);

  private readonly spdConstraintDisabled = Subject.create(true);

  private readonly cannotDeleteSpeedConstraint = Subject.create(false);

  private readonly climbSpeedLimit = Subject.create(true);

  private readonly speedLimitPilotEntered = Subject.create(false);

  private readonly speedLimitAltitudePilotEntered = Subject.create(false);

  private readonly speedLimit = Subject.create<number | null>(null);

  private readonly speedLimitAltitude = Subject.create<number | null>(null);

  private readonly speedLimitTransition = Subject.create<number | null>(null);

  private readonly showSpeedLimitVisibility = MappedSubject.create(
    ([knotSpeedLimit, altitudeSpeedLimit]) =>
      knotSpeedLimit !== null && altitudeSpeedLimit !== null ? 'visible' : 'hidden',
    this.speedLimit,
    this.speedLimitAltitude,
  );

  private readonly speedLimitText = this.climbSpeedLimit.map((v) => `${v ? 'CLB' : 'DES'} SPD LIMIT`);

  // CMS page

  // ALT page
  private readonly altitudeMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

  /** in feet */
  private readonly altitudeConstraintInput = Subject.create<number | null>(null);

  private readonly altConstraintDisabled = Subject.create(true);

  private readonly cannotDeleteAltConstraint = Subject.create(false);

  private readonly altitudeClbDesConstraintVisibility = Subject.create('hidden');

  /** 0: CLB, 1: DES */
  private readonly selectedAltitudeConstraintOption = Subject.create<number | null>(null);

  private readonly selectedAltitudeConstraintDisabled = this.altConstraintDisabled.map((it) => Array(3).fill(it));

  private readonly selectedAltitudeConstraintInvisible = this.selectedAltitudeConstraintOption.map((v) => v === null);

  private readonly altWindowLabelRef = FSComponent.createRef<HTMLDivElement>();

  private readonly altWindowValueRef = FSComponent.createRef<HTMLDivElement>();

  private readonly altWindowUnitLeading = Subject.create<string>('');

  private readonly altWindowUnitValue = Subject.create<string>('EMPTY');

  private readonly altWindowUnitTrailing = Subject.create<string>('');

  // STEP ALTs page
  private readonly crzFl = Subject.create<number | null>(null);
  private readonly crzFlFormatted = FmgcData.fmcFormatValue(this.crzFl);

  private readonly stepAltsTimeHeader = this.activeFlightPhase.map((fp) =>
    fp === FmgcFlightPhase.Preflight ? 'TIME' : 'UTC',
  );

  /** If set to true, a re-layouting of the lines is forced, e.g. if an entry in the middle was deleted. */
  private forceRebuildList = false;

  private readonly stepAltsLineVisibility = Array.from(Array(5), () => Subject.create<'visible' | 'hidden'>('hidden'));
  private readonly stepAltsWptIndices = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsFlightLevel = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsDistances = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsDistancesFormatted = Array.from(Array(5), (_, x) =>
    FmgcData.fmcFormatValue(this.stepAltsDistances[x]),
  );
  private readonly stepAltsTimes = Array.from(Array(5), () => Subject.create<string>('--:--'));
  private readonly stepAltsIgnored = Array.from(Array(5), () => Subject.create<boolean>(false));
  private readonly stepAltsAboveMaxFl = Array.from(Array(5), () => Subject.create<boolean>(false));
  private readonly stepAltsMessage = Array.from(Array(5), () => Subject.create<string>(''));
  private readonly stepAltsMessageDisplay = Array.from(Array(5), (_, x) =>
    MappedSubject.create(SubscribableMapFunctions.or(), this.stepAltsIgnored[x], this.stepAltsAboveMaxFl[x]).map((i) =>
      i ? 'flex' : 'none',
    ),
  );
  private readonly stepAltsNoMessageDisplay = Array.from(Array(5), (_, x) =>
    MappedSubject.create(SubscribableMapFunctions.or(), this.stepAltsIgnored[x], this.stepAltsAboveMaxFl[x]).map((i) =>
      i ? 'none' : 'flex',
    ),
  );

  private readonly stepNotAllowedAt = Subject.create<string | null>(null);
  private readonly stepNotAllowedAtVisibility = this.stepNotAllowedAt.map((s) => (!s ? 'hidden' : 'visible'));

  private readonly stepAltsStartAtStepIndex = Subject.create<number>(0);
  private readonly stepAltsNumberOfCruiseSteps = Subject.create<number>(0);

  private readonly stepAltsScrollDownDisabled = Subject.create(true);
  private readonly stepAltsScrollUpDisabled = Subject.create(true);

  protected onNewData(): void {
    const pd = this.loadedFlightPlan?.performanceData;

    if (pd?.transitionAltitude) {
      this.transitionAltitude.set(pd.transitionAltitude);
    } else {
      this.transitionAltitude.set(null);
    }
    if (pd?.transitionLevel) {
      this.transitionLevel.set(pd.transitionLevel * 100);
    } else {
      this.transitionLevel.set(null);
    }

    const activeLegIndex = this.props.fmcService.master?.flightPlanService.get(
      this.loadedFlightPlanIndex.get(),
    ).activeLegIndex;
    if (activeLegIndex) {
      const selectedLegIndexBeforeUpdate = this.selectedLegIndex;
      this.availableWaypointsToLegIndex = [];
      const wpt = this.loadedFlightPlan?.allLegs
        .slice(activeLegIndex)
        .map((el, idx) => {
          if (el instanceof FlightPlanLeg && el.isXF()) {
            this.availableWaypointsToLegIndex.push(idx + activeLegIndex);
            return el.ident;
          }
          return null;
        })
        .filter((el) => el !== null) as string[] | undefined;
      if (wpt) {
        this.availableWaypoints.set(wpt);
        this.selectedLegIndex = selectedLegIndexBeforeUpdate;
      }

      const revWptIdx = this.props.fmcService.master?.revisedLegIndex.get();
      this.selectedLegIndex = revWptIdx ?? null;
    }

    this.crzFl.set(pd?.cruiseFlightLevel ?? null);

    this.updateConstraints();
    this.updateCruiseSteps();
  }

  public static isEligibleForVerticalRevision(legIndex: number, leg: FlightPlanLeg, flightPlan: FlightPlan): boolean {
    // Check conditions: No constraints for airports, FROM waypoint, GA legs, pseudo waypoints
    return (
      !leg.isRunway() && legIndex >= flightPlan.activeLegIndex && legIndex < flightPlan.firstMissedApproachLegIndex
    );
  }

  private updateConstraints() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan || this.selectedLegIndex === null) {
      return;
    }

    const leg = this.loadedFlightPlan.legElementAt(this.selectedLegIndex);
    const previousElement = this.loadedFlightPlan.maybeElementAt(this.selectedLegIndex - 1);
    const isPartOfTooSteepPathSegment =
      leg.calculated?.endsInTooSteepPath ||
      (previousElement?.isDiscontinuity === false && previousElement.calculated?.endsInTooSteepPath);

    if (!MfdFmsFplnVertRev.isEligibleForVerticalRevision(this.selectedLegIndex, leg, this.loadedFlightPlan)) {
      this.speedMessageArea.set(`SPD CSTR NOT ALLOWED AT ${leg.ident}`);
      this.spdConstraintDisabled.set(true);
      this.altitudeMessageArea.set(`ALT CSTR NOT ALLOWED AT ${leg.ident}`);
      this.altConstraintDisabled.set(true);
      return;
    }
    this.speedMessageArea.set('');
    this.spdConstraintDisabled.set(false);
    this.altitudeMessageArea.set(isPartOfTooSteepPathSegment ? 'TOO STEEP PATH AHEAD' : '');
    this.altConstraintDisabled.set(false);

    // Load speed constraints

    this.climbSpeedLimit.set(
      leg.constraintType === WaypointConstraintType.CLB || this.activeFlightPhase.get() <= FmgcFlightPhase.Cruise,
    );

    const climbSpeedLimit = this.climbSpeedLimit.get();
    const speedLimit = climbSpeedLimit
      ? this.props.fmcService.master.fmgc.getClimbSpeedLimit()
      : this.props.fmcService.master.fmgc.getDescentSpeedLimit();
    if (speedLimit && speedLimit.speed && speedLimit.underAltitude) {
      this.speedLimitPilotEntered.set(
        climbSpeedLimit
          ? this.loadedFlightPlan.performanceData.isClimbSpeedLimitPilotEntered
          : this.loadedFlightPlan.performanceData.isDescentSpeedLimitPilotEntered,
      );
      this.speedLimitAltitudePilotEntered.set(
        climbSpeedLimit
          ? (this.loadedFlightPlan.performanceData.isClimbSpeedLimitAltitudePilotEntered ??= false)
          : (this.loadedFlightPlan.performanceData.isDescentSpeedLimitAltitudePilotEntered ??= false),
      );
      this.speedLimit.set(speedLimit.speed);
      this.speedLimitAltitude.set(speedLimit.underAltitude);
      this.speedLimitTransition.set(
        climbSpeedLimit
          ? this.loadedFlightPlan.performanceData.transitionAltitude
          : this.loadedFlightPlan.performanceData.transitionLevel,
      );
    }

    this.speedConstraintInput.set(leg.speedConstraint?.speed ?? null);
    this.constraintType.set(
      leg.constraintType === WaypointConstraintType.CLB
        ? 'CLB'
        : leg.constraintType === WaypointConstraintType.DES
          ? 'DES'
          : '',
    );
    this.spdConstraintTypeRadioSelected.set(
      leg.constraintType === WaypointConstraintType.CLB
        ? 0
        : leg.constraintType === WaypointConstraintType.DES
          ? 1
          : null,
    );
    this.altConstraintTypeRadioSelected.set(
      leg.constraintType === WaypointConstraintType.CLB
        ? 0
        : leg.constraintType === WaypointConstraintType.DES
          ? 1
          : null,
    );
    this.altitudeClbDesConstraintVisibility.set(
      leg.constraintType === WaypointConstraintType.Unknown ? 'visible' : 'hidden',
    );

    this.cannotDeleteAltConstraint.set(
      !leg.altitudeConstraint || leg.altitudeConstraint?.altitudeDescriptor === AltitudeDescriptor.None,
    );
    this.cannotDeleteSpeedConstraint.set(!leg.speedConstraint || !leg.speedConstraint?.speed);

    // Load altitude constraints
    // FIXME missing a lot of cases here
    switch (leg.altitudeConstraint?.altitudeDescriptor) {
      case AltitudeDescriptor.AtAlt1:
        this.selectedAltitudeConstraintOption.set(0);
        break;
      case AltitudeDescriptor.AtOrAboveAlt1:
        this.selectedAltitudeConstraintOption.set(1);
        break;
      case AltitudeDescriptor.AtOrBelowAlt1:
        this.selectedAltitudeConstraintOption.set(2);
        break;
      default:
        this.selectedAltitudeConstraintOption.set(null);
        break;
    }
    this.altitudeConstraintInput.set(leg.altitudeConstraint?.altitude1 ?? null);

    const ac = leg.altitudeConstraint;
    if (
      ac &&
      ac.altitudeDescriptor === AltitudeDescriptor.BetweenAlt1Alt2 &&
      ac.altitude1 !== undefined &&
      ac.altitude2 !== undefined
    ) {
      // ALT window, alt 1 is the higher altitude, displayed 2nd in the box
      const transAlt =
        leg.constraintType === WaypointConstraintType.DES ? this.transitionLevel.get() : this.transitionAltitude.get();

      // FIXME check format when only the higher altitude is above TA/TL
      const alt1IsFl = transAlt !== null && ac.altitude1 > transAlt;
      const alt2IsFl = transAlt !== null && ac.altitude2 > transAlt;
      this.altWindowUnitLeading.set(alt1IsFl && !alt2IsFl ? 'FT' : '');
      this.altWindowUnitTrailing.set(alt1IsFl ? 'FL' : 'FT');
      this.altWindowUnitValue.set(
        `${(alt2IsFl ? ac.altitude2 / 100 : ac.altitude2).toFixed(0).padStart(3, '0')}-${(alt1IsFl ? ac.altitude1 / 100 : ac.altitude1).toFixed(0).padStart(3, '0')}`,
      );

      this.altWindowLabelRef.instance.style.visibility = 'visible';
      this.altWindowValueRef.instance.style.visibility = 'visible';
    } else {
      if (ac?.altitudeDescriptor === AltitudeDescriptor.BetweenAlt1Alt2) {
        console.error(
          'BetweenAlt1Alt2 constraint with either altitude1 or altitude2 undefined!',
          leg.ident,
          leg.definition.procedureIdent,
          ac?.altitude1,
          ac?.altitude2,
        );
      }
      this.altWindowLabelRef.instance.style.visibility = 'hidden';
      this.altWindowValueRef.instance.style.visibility = 'hidden';
    }
  }

  private updateCruiseSteps() {
    if (this.loadedFlightPlan) {
      const activeLegIndex = this.loadedFlightPlan.activeLegIndex;
      const cruiseSteps = this.loadedFlightPlan.allLegs
        .map((l, index) =>
          l.isDiscontinuity === false && index >= activeLegIndex && l.cruiseStep ? l.cruiseStep : null,
        )
        .filter((it) => it !== null);
      const cruiseStepLegIndices = this.loadedFlightPlan.allLegs
        .map((l, index) => (l.isDiscontinuity === false && index >= activeLegIndex && l.cruiseStep ? index : null))
        .filter((it) => it !== null);

      for (let i = 0; i < 5; i++) {
        this.stepAltsLineVisibility[i].set('hidden');
      }

      if (this.stepAltsNumberOfCruiseSteps.get() !== cruiseSteps.length) {
        this.forceRebuildList = true;
      }

      this.stepAltsNumberOfCruiseSteps.set(cruiseSteps.length);
      this.stepAltsScrollUpDisabled.set(this.stepAltsStartAtStepIndex.get() === 0);
      this.stepAltsScrollDownDisabled.set(cruiseSteps.length - this.stepAltsStartAtStepIndex.get() <= 4);

      for (let i = this.stepAltsStartAtStepIndex.get(); i < this.stepAltsStartAtStepIndex.get() + 5; i++) {
        const line = i - this.stepAltsStartAtStepIndex.get();

        if (!(i in cruiseSteps)) {
          if (this.forceRebuildList) {
            this.stepAltsWptIndices[line].set(null);
            this.stepAltsWptIndices[line].notify();
            this.stepAltsFlightLevel[line].set(null);
            this.forceRebuildList = false;
          }

          this.stepAltsLineVisibility[line].set('visible');
          this.stepAltsDistances[line].set(null);
          this.stepAltsTimes[line].set('--:--');
          this.stepAltsIgnored[line].set(false);
          this.stepAltsAboveMaxFl[line].set(false);

          break;
        }

        const pred =
          this.props.fmcService?.master?.guidanceController?.vnavDriver?.mcduProfile?.waypointPredictions?.get(
            cruiseStepLegIndices[i],
          );
        const wptEta = getEtaFromUtcOrPresent(
          pred?.secondsFromPresent,
          this.activeFlightPhase.get() == FmgcFlightPhase.Preflight,
        );
        const wptIndex = this.availableWaypointsToLegIndex.indexOf(cruiseStepLegIndices[i]);

        this.stepAltsLineVisibility[line].set('visible');
        this.stepAltsWptIndices[line].set(wptIndex !== -1 ? wptIndex : null);
        this.stepAltsFlightLevel[line].set(cruiseSteps[i].toAltitude / 100);

        if (pred) {
          this.stepAltsDistances[line].set(pred.distanceFromAircraft - cruiseSteps[i].distanceBeforeTermination);
          this.stepAltsTimes[line].set(wptEta);
        } else {
          this.stepAltsDistances[line].set(null);
          this.stepAltsTimes[line].set('--:--');
        }
        this.stepAltsIgnored[line].set(cruiseSteps[i].isIgnored);
        this.stepAltsAboveMaxFl[line].set(
          cruiseSteps[i].toAltitude / 100 >
            (this.props.fmcService.master?.getRecMaxFlightLevel() ?? maxCertifiedAlt / 100),
        );

        if (this.stepAltsIgnored[line].get()) {
          this.stepAltsMessage[line].set('IGNORED');
        } else if (this.stepAltsAboveMaxFl[line].get()) {
          this.stepAltsMessage[line].set('ABOVE MAX FL');
        } else {
          this.stepAltsMessage[line].set('');
        }
      }
    }
  }

  static nextCruiseStep(flightPlan: FlightPlan): [CruiseStepEntry | undefined, number | undefined] {
    const cruiseStepLegIndex = flightPlan.allLegs.findIndex(
      (l, index) => l.isDiscontinuity === false && index >= flightPlan.activeLegIndex && l.cruiseStep,
    );

    if (cruiseStepLegIndex < 0) {
      return [undefined, undefined];
    }

    const cruiseStep = flightPlan.legElementAt(cruiseStepLegIndex).cruiseStep;
    return cruiseStep
      ? [
          {
            distanceBeforeTermination: cruiseStep.distanceBeforeTermination,
            isIgnored: cruiseStep.isIgnored,
            toAltitude: cruiseStep.toAltitude,
            waypointIndex: cruiseStepLegIndex, // Fix waypointIndex
          },
          cruiseStepLegIndex,
        ]
      : [undefined, undefined];
  }

  private checkLegModificationAllowed(): boolean {
    return this.props.fmcService.master !== null && this.selectedLegIndex !== null && this.loadedFlightPlan !== null;
  }

  private async onWptDropdownModified(idx: number | null): Promise<void> {
    if (idx !== null) {
      const legIndex = this.availableWaypointsToLegIndex[idx];
      this.selectedLegIndex = legIndex;
      this.props.fmcService.master?.revisedLegIndex.set(legIndex);
      this.updateConstraints();
    } else {
      this.selectedLegIndex = null;
      this.props.fmcService.master?.resetRevisedWaypoint();
    }
  }

  private async tryUpdateSpeedConstraint(newSpeed?: number) {
    if (this.checkLegModificationAllowed() && this.spdConstraintTypeRadioSelected.get() !== null) {
      this.props.fmcService.master!.flightPlanService.setPilotEnteredSpeedConstraintAt(
        this.selectedLegIndex!,
        this.spdConstraintTypeRadioSelected.get() === 1,
        newSpeed,
        this.loadedFlightPlanIndex.get(),
        false,
      );
    }
  }

  private async tryUpdateAltitudeConstraint(newAlt?: number) {
    if (!this.checkLegModificationAllowed() && this.altConstraintTypeRadioSelected.get() === null) {
      return;
    }

    const alt = Number.isFinite(newAlt) ? newAlt : this.altitudeConstraintInput.get();
    if (alt && this.selectedAltitudeConstraintOption.get() !== null) {
      let option: AltitudeDescriptor;

      switch (this.selectedAltitudeConstraintOption.get()) {
        case 0:
          option = AltitudeDescriptor.AtAlt1;
          break;
        case 1:
          option = AltitudeDescriptor.AtOrAboveAlt1;
          break;
        case 2:
          option = AltitudeDescriptor.AtOrBelowAlt1;
          break;

        default:
          option = AltitudeDescriptor.AtAlt1;
          break;
      }

      this.props.fmcService.master!.flightPlanService.setPilotEnteredAltitudeConstraintAt(
        this.selectedLegIndex!,
        this.altConstraintTypeRadioSelected.get() === 1,
        { altitude1: alt, altitudeDescriptor: option },
        this.loadedFlightPlanIndex.get(),
        false,
      );
    }
  }

  private deleteAltitudeConstraint() {
    if (this.checkLegModificationAllowed()) {
      this.props.fmcService.master!.flightPlanService.setPilotEnteredAltitudeConstraintAt(
        this.selectedLegIndex!,
        false,
        undefined,
        this.loadedFlightPlanIndex.get(),
        false,
      );
    }
  }

  private async tryUpdateSpeedLimitValue(value: number | null) {
    if (this.checkLegModificationAllowed() && this.loadedFlightPlan?.performanceData) {
      const clbSpdLimit = this.climbSpeedLimit.get();
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'climbSpeedLimitSpeed' : 'descentSpeedLimitSpeed',
        value ??
          (clbSpdLimit ? DefaultPerformanceData.ClimbSpeedLimitSpeed : DefaultPerformanceData.DescentSpeedLimitSpeed),
      );
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'isClimbSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
        value !== null,
      );
    }
  }

  private async tryUpdateSpeedLimitAltitude(value: number | null) {
    if (this.checkLegModificationAllowed() && this.loadedFlightPlan?.performanceData) {
      const clbSpdLimit = this.climbSpeedLimit.get();
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'climbSpeedLimitAltitude' : 'descentSpeedLimitAltitude',
        value ??
          (clbSpdLimit
            ? DefaultPerformanceData.ClimbSpeedLimitAltitude
            : DefaultPerformanceData.DescentSpeedLimitAltitude),
      );
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'isClimbSpeedLimitAltitudePilotEntered' : 'isDescentSpeedLimitAltitudePilotEntered',
        value !== null,
      );
    }
  }

  private async deleteSpeedLimit() {
    if (this.checkLegModificationAllowed() && this.loadedFlightPlan?.performanceData) {
      const clbSpdLimit = this.climbSpeedLimit.get();

      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'climbSpeedLimitAltitude' : 'descentSpeedLimitAltitude',
        null,
      );
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'isClimbSpeedLimitAltitudePilotEntered' : 'isDescentSpeedLimitAltitudePilotEntered',
        null,
      );

      this.loadedFlightPlan.setPerformanceData(clbSpdLimit ? 'climbSpeedLimitSpeed' : 'descentSpeedLimitSpeed', null);
      this.loadedFlightPlan.setPerformanceData(
        clbSpdLimit ? 'isClimbSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
        null,
      );
    }
  }

  /**
   * Copied from A32NX
   * Check a couple of rules about insertion of step:
   * - Minimum step size is 1000ft
   * - S/C follows step descent
   * TODO: It's possible that the insertion of a step in between already inserted steps causes a step descent after step climb
   * I don't know how the plane handles this.
   * @param crzFl cruise FL in hundreds of feet
   * @param stepLegs Existing steps
   * @param insertAtIndex Index of waypoint to insert step at
   * @param toAltitude Altitude of step
   */
  static checkStepInsertionRules(
    crzFl: number,
    cruiseSteps: CruiseStepEntry[],
    insertAtIndex: number,
    toAltitude: number,
  ) {
    let altitude = crzFl * 100;
    let doesHaveStepDescent = false;

    let i = 0;
    for (; i < cruiseSteps.length; i++) {
      const step = cruiseSteps[i];
      if (step.waypointIndex > insertAtIndex) {
        break;
      }

      const stepAltitude = step.toAltitude;
      if (stepAltitude < altitude) {
        doesHaveStepDescent = true;
      }

      altitude = stepAltitude;
    }

    const isStepSizeValid = Math.abs(toAltitude - altitude) >= 1000;
    if (!isStepSizeValid) {
      return false;
    }

    const isClimbVsDescent = toAltitude > altitude;
    if (!isClimbVsDescent) {
      doesHaveStepDescent = true;
    } else if (doesHaveStepDescent) {
      return false;
    }

    if (i < cruiseSteps.length) {
      const stepAfter = cruiseSteps[i];
      const isStepSizeValid = Math.abs(stepAfter.toAltitude - toAltitude) >= 1000;
      const isClimbVsDescent = stepAfter.toAltitude > toAltitude;

      const isClimbAfterDescent = isClimbVsDescent && doesHaveStepDescent;

      return isStepSizeValid && !isClimbAfterDescent;
    }

    return true;
  }

  private tryAddCruiseStep(dropdownIndex: number | null, flightLevel: number | null) {
    const crzFl = this.crzFl.get();
    if (
      crzFl &&
      dropdownIndex !== null &&
      dropdownIndex in this.availableWaypointsToLegIndex &&
      flightLevel !== null &&
      this.loadedFlightPlan !== null
    ) {
      const legIndex = this.availableWaypointsToLegIndex[dropdownIndex];
      const cruiseSteps = this.loadedFlightPlan.allLegs
        .map((l) => (l.isDiscontinuity === false && l.cruiseStep ? l.cruiseStep : null))
        .filter((it) => it !== null);
      const isValid = MfdFmsFplnVertRev.checkStepInsertionRules(crzFl, cruiseSteps, legIndex, flightLevel * 100);

      if (flightLevel > (this.props.fmcService.master?.getRecMaxFlightLevel() ?? maxCertifiedAlt / 100)) {
        this.props.fmcService.master?.addMessageToQueue(NXSystemMessages.stepAboveMaxFl, undefined, undefined);
      }

      if (isValid) {
        this.loadedFlightPlan?.addOrUpdateCruiseStep(legIndex, flightLevel * 100);
      } else {
        if (this.selectedLegIndex !== null) {
          const leg = this.loadedFlightPlan?.maybeElementAt(this.selectedLegIndex);
          this.stepNotAllowedAt.set(leg?.isDiscontinuity === false ? `STEP NOT ALLOWED AT ${leg.ident}` : '');
        }
      }
    }
  }

  private tryDeleteCruiseStep(lineIndex: number, previousDropdownIndex: number) {
    const legIndex = this.availableWaypointsToLegIndex[previousDropdownIndex];
    this.loadedFlightPlan?.removeCruiseStep(legIndex);
    this.stepAltsWptIndices[lineIndex].set(null);
    this.stepAltsFlightLevel[lineIndex].set(null);
    this.forceRebuildList = true;
  }

  private handleCruiseStepWaypointModified(newWptIndex: number | null, lineIndex: number) {
    const oldWptIndex = this.stepAltsWptIndices[lineIndex].get();
    const flightLevel = this.stepAltsFlightLevel[lineIndex].get();

    if (newWptIndex === null && oldWptIndex !== null) {
      // Remove step
      this.tryDeleteCruiseStep(lineIndex, oldWptIndex);
    } else if (oldWptIndex === null && newWptIndex !== null && flightLevel !== null) {
      // Add new step
      this.tryAddCruiseStep(newWptIndex, flightLevel);
    } else if (oldWptIndex !== null && newWptIndex !== null && flightLevel !== null) {
      // Change step's waypoint
      this.tryDeleteCruiseStep(lineIndex, oldWptIndex);
      this.tryAddCruiseStep(newWptIndex, flightLevel);
    }
    this.stepAltsWptIndices[lineIndex].set(newWptIndex);
    this.updateCruiseSteps();
  }

  private handleCruiseStepFlightLevelModified(newFlightLevel: number | null, lineIndex: number) {
    const wptIndex = this.stepAltsWptIndices[lineIndex].get();
    const oldFlightLevel = this.stepAltsFlightLevel[lineIndex].get();

    if (newFlightLevel === null && wptIndex !== null) {
      // Remove step
      this.tryDeleteCruiseStep(lineIndex, wptIndex);
    } else if (oldFlightLevel === null && newFlightLevel !== null && wptIndex !== null) {
      // Add new step
      this.tryAddCruiseStep(wptIndex, newFlightLevel);
    } else if (oldFlightLevel !== null && newFlightLevel !== null && wptIndex !== null) {
      // Change step's flight level
      this.tryDeleteCruiseStep(lineIndex, wptIndex);
      this.tryAddCruiseStep(wptIndex, newFlightLevel);
    }
    this.stepAltsFlightLevel[lineIndex].set(newFlightLevel);
    this.updateCruiseSteps();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    // If extra parameter for activeUri is given, navigate to flight phase sub-page
    switch (this.props.mfd.uiService.activeUri.get().extra) {
      case 'rta':
        this.selectedPageIndex.set(0);
        break;
      case 'spd':
        this.selectedPageIndex.set(1);
        break;
      case 'cms':
        this.selectedPageIndex.set(2);
        break;
      case 'alt':
        this.selectedPageIndex.set(3);
        break;
      case 'step-alts':
        this.selectedPageIndex.set(4);
        break;

      default:
        break;
    }

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (this.returnButtonDiv.getOrDefault() && this.tmpyInsertButtonDiv.getOrDefault()) {
          this.returnButtonDiv.instance.style.visibility = v ? 'hidden' : 'visible';
          this.tmpyInsertButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
    );

    this.subs.push(this.crzFlFormatted);

    for (const i of [0, 1, 2, 3, 4]) {
      this.subs.push(
        this.stepAltsMessageDisplay[i],
        this.stepAltsNoMessageDisplay[i],
        this.stepAltsDistancesFormatted[i],
      );
    }

    this.subs.push(
      this.stepAltsStartAtStepIndex.sub(() => {
        this.forceRebuildList = true;
        this.updateCruiseSteps();
      }),
    );

    this.subs.push(
      this.props.bus
        .getSubscriber<ClockEvents>()
        .on('realTime')
        .atFrequency(0.5)
        .handle(() => this.updateCruiseSteps()),
    );

    this.subs.push(
      this.tmpyColor,
      this.selectedAltitudeConstraintDisabled,
      this.selectedAltitudeConstraintInvisible,
      this.stepNotAllowedAtVisibility,
      this.showSpeedLimitVisibility,
      this.speedLimitText,
    );

    this.subs.push(
      this.spdConstraintTypeRadioSelected.sub(() => this.tryUpdateSpeedConstraint()),
      this.altConstraintTypeRadioSelected.sub(() => this.tryUpdateAltitudeConstraint()),
    );
  }

  render(): VNode {
    return (
      this.props.fmcService.master && (
        <>
          {super.render()}
          {/* begin page content */}
          <div class="mfd-page-container">
            <div style="height: 15px;" />
            <TopTabNavigator
              pageTitles={Subject.create(['RTA', 'SPD', 'CMS', 'ALT', 'STEP ALTs'])}
              selectedPageIndex={this.selectedPageIndex}
              pageChangeCallback={(val) => this.selectedPageIndex.set(val)}
              selectedTabTextColor="white"
            >
              <TopTabNavigatorPage>
                {/* RTA */}
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <span class="mfd-label">NOT IMPLEMENTED</span>
                  <div style="display: flex; flex-direction: row; margin-top: 20px; justify-content: center; align-items: center;">
                    <div class="mfd-label mfd-spacing-right">ETT</div>
                    <div>
                      <InputField<number>
                        dataEntryFormat={new TimeHHMMSSFormat()}
                        value={this.props.fmcService.master.fmgc.data.estimatedTakeoffTime}
                        alignText="center"
                        containerStyle="width: 175px;"
                        tmpyActive={this.tmpyActive}
                        errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                        hEventConsumer={this.props.mfd.hEventConsumer}
                        interactionMode={this.props.mfd.interactionMode}
                      />
                    </div>
                  </div>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage>
                {/* SPD */}
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 15px;">
                  <div>
                    <span class="mfd-label biggest amber">{this.speedMessageArea}</span>
                  </div>
                  <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin-top: 25px;">
                    <span class="mfd-label biggest green mfd-spacing-right">{this.constraintType}</span>
                    <span class="mfd-label bigger mfd-spacing-right">SPD CSTR AT </span>
                    <DropdownMenu
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_clbConstraintWptDropdown`}
                      selectedIndex={this.dropdownMenuSelectedWaypointIndex}
                      values={this.availableWaypoints}
                      freeTextAllowed={false}
                      containerStyle="width: 175px;"
                      alignLabels="flex-start"
                      onModified={(i) => this.onWptDropdownModified(i)}
                      numberOfDigitsForInputField={7}
                      tmpyActive={this.tmpyActive}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-vert-rev-spd-cstr-line">
                    <InputField<number>
                      dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                      dataHandlerDuringValidation={(val) => this.tryUpdateSpeedConstraint(val ?? undefined)}
                      mandatory={Subject.create(false)}
                      disabled={this.spdConstraintDisabled}
                      value={this.speedConstraintInput}
                      alignText="flex-end"
                      tmpyActive={this.tmpyActive}
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                    <div class="mfd-vert-rev-clbdes" style={{ visibility: this.altitudeClbDesConstraintVisibility }}>
                      <RadioButtonGroup
                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_spdCstrClbDesRadioButtons`}
                        selectedIndex={this.spdConstraintTypeRadioSelected}
                        values={['CLB CSTR', 'DES CSTR']}
                        color={Subject.create(RadioButtonColor.Amber)}
                      />
                    </div>
                    <Button
                      label={Subject.create(
                        <div style="display: flex; flex-direction: row; justify-content: space-between;">
                          <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                            DELETE
                            <br />
                            SPD CSTR
                          </span>
                          <span style="display: flex; align-items: center; justify-content: center;">*</span>
                        </div>,
                      )}
                      onClick={() => {
                        this.tryUpdateSpeedConstraint(undefined);
                      }}
                      disabled={this.cannotDeleteSpeedConstraint}
                      buttonStyle="adding-right: 2px;"
                    />
                  </div>
                  <div tyle={{ visibility: this.showSpeedLimitVisibility }}>
                    <span class="mfd-label bigger mfd-spacing-right">{this.speedLimitText}</span>
                    <div class="fr">
                      <InputField<number>
                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                        dataHandlerDuringValidation={(val) => this.tryUpdateSpeedLimitValue(val)}
                        mandatory={Subject.create(false)}
                        value={this.speedLimit}
                        alignText="flex-end"
                        tmpyActive={this.tmpyActive}
                        enteredByPilot={this.speedLimitPilotEntered}
                        errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                        hEventConsumer={this.props.mfd.hEventConsumer}
                        interactionMode={this.props.mfd.interactionMode}
                      />
                      <span class="mfd-label bigger">AT OR BELOW</span>
                      <InputField<number>
                        dataEntryFormat={new AltitudeOrFlightLevelFormat(this.speedLimitTransition)}
                        dataHandlerDuringValidation={(val) => this.tryUpdateSpeedLimitAltitude(val)}
                        mandatory={Subject.create(false)}
                        value={this.speedLimitAltitude}
                        enteredByPilot={this.speedLimitAltitudePilotEntered}
                        alignText="flex-end"
                        tmpyActive={this.tmpyActive}
                        errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                        hEventConsumer={this.props.mfd.hEventConsumer}
                        interactionMode={this.props.mfd.interactionMode}
                      />
                      <Button
                        label={Subject.create(
                          <div style="display: flex; flex-direction: row; justify-content: space-between;">
                            <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                              DELETE
                              <br />
                              SPD LIM
                            </span>
                            <span style="display: flex; align-items: center; justify-content: center;">*</span>
                          </div>,
                        )}
                        onClick={() => {
                          this.deleteSpeedLimit();
                        }}
                        buttonStyle="adding-right: 2px;"
                      />
                    </div>
                  </div>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage>
                {/* CMS */}
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <span class="mfd-label">NOT IMPLEMENTED</span>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage>
                {/* ALT */}
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 15px;">
                  <div>
                    <span class="mfd-label biggest amber">{this.altitudeMessageArea}</span>
                  </div>
                  <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin-top: 25px;">
                    <span class="mfd-label biggest green mfd-spacing-right">{this.constraintType}</span>
                    <span class="mfd-label bigger mfd-spacing-right">ALT CSTR AT </span>
                    <DropdownMenu
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_altConstraintWptDropdown`}
                      selectedIndex={this.dropdownMenuSelectedWaypointIndex}
                      values={this.availableWaypoints}
                      freeTextAllowed={false}
                      containerStyle="width: 175px;"
                      alignLabels="flex-start"
                      onModified={(i) => this.onWptDropdownModified(i)}
                      numberOfDigitsForInputField={7}
                      tmpyActive={this.tmpyActive}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-vert-rev-alt-cstr-line">
                    <div class="mfd-vert-rev-alt-cstr-rb">
                      <RadioButtonGroup
                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_altCstrRadioButtons`}
                        selectedIndex={this.selectedAltitudeConstraintOption}
                        values={['AT', 'AT OR ABOVE', 'AT OR BELOW']}
                        color={this.tmpyColor}
                        valuesDisabled={this.selectedAltitudeConstraintDisabled}
                        onModified={(newIdx) => {
                          this.selectedAltitudeConstraintOption.set(newIdx);
                          this.tryUpdateAltitudeConstraint();
                        }}
                      />
                      <div ref={this.altWindowLabelRef} class="mfd-label bigger mfd-vert-rev-alt-window-label">
                        WINDOW
                      </div>
                    </div>
                    <div class="mfd-vert-rev-alt-cstr-sel">
                      <div class={{ invisible: this.selectedAltitudeConstraintInvisible }}>
                        <InputField<number>
                          dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transitionAltitude)}
                          dataHandlerDuringValidation={(val) => this.tryUpdateAltitudeConstraint(val ?? undefined)}
                          mandatory={Subject.create(false)}
                          disabled={this.altConstraintDisabled}
                          value={this.altitudeConstraintInput}
                          alignText="flex-end"
                          tmpyActive={this.tmpyActive}
                          errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                        />
                      </div>
                      <div ref={this.altWindowValueRef} class="mfd-vert-rev-alt-window-value">
                        <span class="mfd-label-unit bigger mfd-unit-leading">{this.altWindowUnitLeading}</span>
                        <span class="mfd-label green bigger">{this.altWindowUnitValue}</span>
                        <span class="mfd-label-unit bigger mfd-unit-trailing">{this.altWindowUnitTrailing}</span>
                      </div>
                    </div>
                    <div class="mfd-vert-rev-alt-right-container">
                      <Button
                        label={Subject.create(
                          <div class="fr" style="justify-content: space-between;">
                            <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                              DELETE
                              <br />
                              ALT CSTR
                            </span>
                            <span style="display: flex; align-items: center; justify-content: center;">*</span>
                          </div>,
                        )}
                        onClick={() => {
                          this.deleteAltitudeConstraint();
                        }}
                        disabled={this.cannotDeleteAltConstraint}
                        buttonStyle="adding-right: 2px;"
                      />

                      <div class="mfd-vert-rev-clbdes" style={{ visibility: this.altitudeClbDesConstraintVisibility }}>
                        <RadioButtonGroup
                          idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_altCstrClbDesRadioButtons`}
                          selectedIndex={this.altConstraintTypeRadioSelected}
                          values={['CLB CSTR', 'DES CSTR']}
                          color={Subject.create(RadioButtonColor.Amber)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage>
                {/* STEP ALTs */}
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <div class="mfd-fms-fpln-labeled-box-container" style="width: 100%;">
                    <div class="mfd-fms-fpln-labeled-box-label" style="margin-left: 15px;">
                      <span class="mfd-label mfd-spacing-right">STEP ALTS FROM CRZ</span>
                      <span class="mfd-label-unit mfd-unit-leading">FL</span>
                      <span class="mfd-value">{this.crzFlFormatted}</span>
                    </div>
                    <div style="width: 100%">
                      <div style="display: grid; grid-template-columns: 35% 25% 20% 20%; grid-auto-rows: 60px;">
                        <div
                          class="mfd-label"
                          style="align-self: flex-end; padding-left: 60px; padding-bottom: 10px; border-bottom: 1px solid #777777;"
                        >
                          WPT
                        </div>
                        <div
                          class="mfd-label"
                          style="align-self: flex-end; padding-left: 25px; padding-bottom: 10px; border-bottom: 1px solid #777777; border-right: 1px solid #777777;"
                        >
                          ALT
                        </div>
                        <div
                          class="mfd-label"
                          style="align-self: flex-end; padding-left: 30px; padding-bottom: 10px; border-bottom: 1px solid #777777;"
                        >
                          <span style="margin-right: 70px;">DIST</span>
                        </div>
                        <div
                          class="mfd-label"
                          style="align-self: flex-end; padding-left: 30px; padding-bottom: 10px; border-bottom: 1px solid #777777;"
                        >
                          <span>{this.stepAltsTimeHeader}</span>
                        </div>

                        {[0, 1, 2, 3, 4].map((li) => (
                          <>
                            <div class="fc aic jcc">
                              <div style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                <DropdownMenu
                                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_stepAltWpt${li}`}
                                  selectedIndex={this.stepAltsWptIndices[li]}
                                  values={this.availableWaypoints}
                                  freeTextAllowed={false}
                                  containerStyle="width: 175px;"
                                  alignLabels="flex-start"
                                  numberOfDigitsForInputField={7}
                                  tmpyActive={this.tmpyActive}
                                  onModified={(newWptIndex) => this.handleCruiseStepWaypointModified(newWptIndex, li)}
                                  hEventConsumer={this.props.mfd.hEventConsumer}
                                  interactionMode={this.props.mfd.interactionMode}
                                />
                              </div>
                            </div>
                            <div class="fc aic jcc" style="border-right: 1px solid #777777;">
                              <div style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                <InputField<number>
                                  dataEntryFormat={new FlightLevelFormat()}
                                  value={this.stepAltsFlightLevel[li]}
                                  containerStyle="width: 150px;"
                                  alignText="center"
                                  tmpyActive={this.tmpyActive}
                                  onModified={(newFlightLevel) =>
                                    this.handleCruiseStepFlightLevelModified(newFlightLevel, li)
                                  }
                                  hEventConsumer={this.props.mfd.hEventConsumer}
                                  interactionMode={this.props.mfd.interactionMode}
                                />
                              </div>
                            </div>
                            <div
                              class="fr aic jcc"
                              style={{
                                display: this.stepAltsMessageDisplay[li],
                                'grid-column': 'span 2',
                              }}
                            >
                              <span class="mfd-label">{this.stepAltsMessage[li]}</span>
                            </div>
                            <div
                              class="fr aic jcc"
                              style={{
                                display: this.stepAltsNoMessageDisplay[li],
                                'justify-content': 'flex-end',
                              }}
                            >
                              <div style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                <span class="mfd-value">{this.stepAltsDistancesFormatted[li]}</span>
                                <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                              </div>
                            </div>
                            <div class="fr aic jcc" style={{ display: this.stepAltsNoMessageDisplay[li] }}>
                              <span class="mfd-value" style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                {this.stepAltsTimes[li]}
                              </span>
                            </div>
                          </>
                        ))}
                      </div>
                      <div style="flex-grow: 1" />
                      <div clasS="fr jcc" style="flex: 1;">
                        <span class="mfd-label biggest amber" style={{ visibility: this.stepNotAllowedAtVisibility }}>
                          {this.stepNotAllowedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                    <IconButton
                      icon={'double-down'}
                      containerStyle="padding: 10px; margin-right: 5px;"
                      disabled={this.stepAltsScrollDownDisabled}
                      onClick={() =>
                        this.stepAltsStartAtStepIndex.set(
                          Math.min(this.stepAltsNumberOfCruiseSteps.get(), this.stepAltsStartAtStepIndex.get() + 1),
                        )
                      }
                    />
                    <IconButton
                      icon={'double-up'}
                      containerStyle="padding: 10px"
                      disabled={this.stepAltsScrollUpDisabled}
                      onClick={() =>
                        this.stepAltsStartAtStepIndex.set(Math.max(0, this.stepAltsStartAtStepIndex.get() - 1))
                      }
                    />
                  </div>
                  <div class="fc" style="width: 100%; margin-top: 25px;">
                    <div
                      class="mfd-fms-fpln-labeled-box-container"
                      style="flex-direction: row; justify-content: flex-start; align-items: flex-start;"
                    >
                      <div class="mfd-fms-fpln-labeled-box-label">
                        <span class="mfd-label">OPTIMUM STEP POINT</span>
                      </div>
                      <div class="fr aic" style="margin: 25px 200px 0px 10px;">
                        <span class="mfd-label" style="margin-right: 10px;">
                          TO
                        </span>
                        <span class="mfd-label-unit mfd-unit-leading">FL</span>
                        <span class="mfd-value">---</span>
                      </div>
                      <div class="mfd-label" style="margin-top: 60px; margin-bottom: 30px;">
                        NO OPTIMUM STEP FOUND
                      </div>
                    </div>
                  </div>
                </div>
              </TopTabNavigatorPage>
            </TopTabNavigator>
            <div style="flex-grow: 1;" />
            <div style="display: flex; flex-direction: row; justify-content: space-between;">
              <div ref={this.returnButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                <Button
                  label="RETURN"
                  onClick={() => {
                    this.props.fmcService.master?.resetRevisedWaypoint();
                    this.props.mfd.uiService.navigateTo('back');
                  }}
                />
              </div>
              <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                <Button
                  label="TMPY F-PLN"
                  onClick={() => {
                    this.props.fmcService.master?.resetRevisedWaypoint();
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`,
                    );
                  }}
                  buttonStyle="color: yellow"
                />
              </div>
            </div>
          </div>
          {/* end page content */}
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </>
      )
    );
  }
}

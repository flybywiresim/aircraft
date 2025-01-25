import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';

import { ArraySubject, ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import './MfdFmsFplnVertRev.scss';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  AltitudeOrFlightLevelFormat,
  FlightLevelFormat,
  SpeedKnotsFormat,
  TimeHHMMSSFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { Vmo } from '@shared/PerformanceConstants';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { AltitudeDescriptor } from '@flybywiresim/fbw-sdk';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { FmgcData } from 'instruments/src/MFD/FMC/fmgc';

interface MfdFmsFplnVertRevProps extends AbstractMfdPageProps {}

export class MfdFmsFplnVertRev extends FmsPage<MfdFmsFplnVertRevProps> {
  private selectedPageIndex = Subject.create(0);

  private availableWaypoints = ArraySubject.create<string>([]);

  private availableWaypointsToLegIndex: number[] = [];

  private selectedWaypointIndex = Subject.create<number | null>(null);

  private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  /** in feet */
  private transitionAltitude = Subject.create<number | null>(null);
  /** in feet */
  private transitionLevel = Subject.create<number | null>(null);

  // RTA page

  // SPD page
  private speedMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

  /** in knots */
  private speedConstraintInput = Subject.create<number | null>(null);

  private speedConstraintType = Subject.create<'CLB' | 'DES' | null>(null);

  private spdConstraintDisabled = Subject.create(true);

  private cannotDeleteSpeedConstraint = Subject.create(false);

  // CMS page

  // ALT page
  private altitudeMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

  /** in feet */
  private altitudeConstraintInput = Subject.create<number | null>(null);

  private altitudeConstraintType = Subject.create<'CLB' | 'DES' | null>(null);

  private altConstraintDisabled = Subject.create(true);

  private cannotDeleteAltConstraint = Subject.create(false);

  private selectedAltitudeConstraintOption = Subject.create<number | null>(null);

  private altWindowLabelRef = FSComponent.createRef<HTMLDivElement>();

  private altWindowValueRef = FSComponent.createRef<HTMLDivElement>();

  private altWindowUnitLeading = Subject.create<string>('');

  private altWindowUnitValue = Subject.create<string>('EMPTY');

  private altWindowUnitTrailing = Subject.create<string>('');

  // STEP ALTs page
  private readonly crzFl = Subject.create<number | null>(null);

  private readonly stepAltsLineVisibility = Array.from(Array(5), () => Subject.create<'visible' | 'hidden'>('hidden'));
  private readonly stepAltsWptIndices = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsAltitudes = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsDistances = Array.from(Array(5), () => Subject.create<number | null>(null));
  private readonly stepAltsTimes = Array.from(Array(5), () => Subject.create<string>('--:--'));
  private readonly stepAltsIgnored = Array.from(Array(5), () => Subject.create<boolean>(false));

  private readonly stepNotAllowedAt = Subject.create<string | null>(null);

  private readonly stepAltsStartAtStepIndex = Subject.create<number>(0);
  private readonly stepAltsNumberOfCruiseSteps = Subject.create<number>(0);

  private readonly stepAltsScrollDownDisabled = Subject.create(true);
  private readonly stepAltsScrollUpDisabled = Subject.create(true);

  protected onNewData(): void {
    console.time('F-PLN/VERT REV:onNewData');

    const pd = this.loadedFlightPlan?.performanceData;
    // const fm = this.props.fmService.fmgc.data;

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
      }

      const revWptIdx = this.props.fmcService.master?.revisedWaypointIndex.get();
      if (revWptIdx && this.props.fmcService.master?.revisedWaypointIndex.get() !== undefined) {
        this.selectedWaypointIndex.set(revWptIdx - activeLegIndex - 1);
      }
    }

    if (pd?.cruiseFlightLevel) {
      this.crzFl.set(pd.cruiseFlightLevel);
    }

    if (this.loadedFlightPlan) {
      const cruiseSteps = this.loadedFlightPlan.allLegs
        .map((l) => (l.isDiscontinuity === false && l.cruiseStep ? l.cruiseStep : null))
        .filter((it) => it !== null);

      for (let i = 0; i < 5; i++) {
        this.stepAltsLineVisibility[i].set('hidden');
      }

      this.stepAltsNumberOfCruiseSteps.set(cruiseSteps.length);
      this.stepAltsScrollUpDisabled.set(this.stepAltsStartAtStepIndex.get() === 0);
      this.stepAltsScrollDownDisabled.set(cruiseSteps.length - this.stepAltsStartAtStepIndex.get() <= 5);

      for (let i = this.stepAltsStartAtStepIndex.get(); i < this.stepAltsStartAtStepIndex.get() + 5; i++) {
        const line = i - this.stepAltsStartAtStepIndex.get();

        if (!cruiseSteps[i]) {
          this.stepAltsLineVisibility[line].set('visible');
          this.stepAltsWptIndices[line].set(null);
          this.stepAltsAltitudes[line].set(null);
          this.stepAltsDistances[line].set(null);
          this.stepAltsTimes[line].set('--:--');
          this.stepAltsIgnored[line].set(false);
          break;
        }

        const leg = this.loadedFlightPlan.allLegs[cruiseSteps[i].waypointIndex];

        if (cruiseSteps[i] && leg.isDiscontinuity === false) {
          const pred =
            this.props.fmcService?.master?.guidanceController?.vnavDriver?.mcduProfile?.waypointPredictions?.get(i);
          const etaDate = new Date(
            (SimVar.GetGlobalVarValue('ZULU TIME', 'seconds') + (pred?.secondsFromPresent ?? 0)) * 1000,
          );
          const wptIndex = this.availableWaypointsToLegIndex.indexOf(cruiseSteps[i].waypointIndex);

          leg.isDiscontinuity === false && this.stepAltsLineVisibility[line].set('visible');
          this.stepAltsWptIndices[line].set(wptIndex !== -1 ? wptIndex : null);
          this.stepAltsAltitudes[line].set(cruiseSteps[i].toAltitude);
          this.stepAltsDistances[line].set(
            leg.calculated?.cumulativeDistance ?? 0 + cruiseSteps[i].distanceBeforeTermination,
          );
          this.stepAltsTimes[line].set(
            pred
              ? `${etaDate.getUTCHours().toString().padStart(2, '0')}:${etaDate.getUTCMinutes().toString().padStart(2, '0')}`
              : '--:--',
          );
          this.stepAltsIgnored[line].set(cruiseSteps[i].isIgnored);
        }
      }
    }

    this.updateConstraints();

    console.timeEnd('F-PLN/VERT REV:onNewData');
  }

  public static isEligibleForVerticalRevision(legIndex: number, leg: FlightPlanLeg, flightPlan: FlightPlan): boolean {
    // Check conditions: No constraints for airports, FROM waypoint, CRZ legs, GA legs, pseudo waypoints
    const enrouteLegsNoDisco = flightPlan.enrouteSegment.allLegs.filter((it) => it instanceof FlightPlanLeg);
    const firstEnrouteFix = enrouteLegsNoDisco[0] as FlightPlanLeg | undefined;
    const lastEnrouteFix = enrouteLegsNoDisco[enrouteLegsNoDisco.length - 1] as FlightPlanLeg | undefined;
    const firstEnrouteLegIndex = firstEnrouteFix?.definition?.waypoint
      ? flightPlan.findLegIndexByFixIdent(firstEnrouteFix.definition.waypoint.ident)
      : Infinity;
    const lastEnrouteLegIndex = lastEnrouteFix?.definition?.waypoint
      ? flightPlan.findLegIndexByFixIdent(lastEnrouteFix.definition.waypoint.ident)
      : 0;

    // FIXME enroute legs are eligible, but we need to implement the CLB/DES prompt for their constraints first
    if (
      leg.isRunway() ||
      legIndex <= flightPlan.activeLegIndex ||
      (legIndex >= firstEnrouteLegIndex && legIndex <= lastEnrouteLegIndex) ||
      legIndex >= flightPlan.firstMissedApproachLegIndex
    ) {
      return false;
    }
    return true;
  }

  private updateConstraints() {
    const selectedWaypointIndex = this.selectedWaypointIndex.get();
    if (!this.props.fmcService.master || !this.loadedFlightPlan || selectedWaypointIndex == null) {
      return;
    }

    const wptIdx =
      this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex +
      selectedWaypointIndex +
      1;
    if (wptIdx !== undefined) {
      const leg = this.loadedFlightPlan.legElementAt(wptIdx);

      if (!MfdFmsFplnVertRev.isEligibleForVerticalRevision(wptIdx, leg, this.loadedFlightPlan)) {
        this.speedMessageArea.set(`SPD CSTR NOT ALLOWED AT ${leg.ident}`);
        this.spdConstraintDisabled.set(true);
        this.altitudeMessageArea.set(`ALT CSTR NOT ALLOWED AT ${leg.ident}`);
        this.altConstraintDisabled.set(true);
        return;
      }
      this.speedMessageArea.set('');
      this.spdConstraintDisabled.set(false);
      this.altitudeMessageArea.set('');
      this.altConstraintDisabled.set(false);

      // Load speed constraints
      this.speedConstraintInput.set(leg.speedConstraint?.speed ?? null);
      this.speedConstraintType.set(leg.constraintType === WaypointConstraintType.CLB ? 'CLB' : 'DES');

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
      this.altitudeConstraintType.set(leg.constraintType === WaypointConstraintType.CLB ? 'CLB' : 'DES');

      const ac = leg.altitudeConstraint;
      if (
        ac &&
        ac.altitudeDescriptor === AltitudeDescriptor.BetweenAlt1Alt2 &&
        ac.altitude1 !== undefined &&
        ac.altitude2 !== undefined
      ) {
        // ALT window, alt 1 is the higher altitude, displayed 2nd in the box
        const transAlt =
          leg.constraintType === WaypointConstraintType.DES
            ? this.transitionLevel.get()
            : this.transitionAltitude.get();

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
  }

  private async onWptDropdownModified(idx: number | null): Promise<void> {
    this.selectedWaypointIndex.set(idx);

    if (idx !== null) {
      this.props.fmcService.master?.revisedWaypointIndex.set(
        this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + idx + 1,
      );
      this.updateConstraints();
    } else {
      this.props.fmcService.master?.resetRevisedWaypoint();
    }
  }

  private async tryUpdateAltitudeConstraint(newAlt?: number) {
    const selectedWaypointIndex = this.selectedWaypointIndex.get();
    if (!this.props.fmcService.master || !this.loadedFlightPlan || selectedWaypointIndex == null) {
      return;
    }

    const alt = Number.isFinite(newAlt) ? newAlt : this.altitudeConstraintInput.get();
    if (alt && this.selectedAltitudeConstraintOption.get() !== null) {
      const index =
        this.props.fmcService.master?.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex +
        selectedWaypointIndex +
        1;
      const fpln = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get());
      const leg = fpln.legElementAt(index);

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

      this.props.fmcService.master.flightPlanService.setPilotEnteredAltitudeConstraintAt(
        index,
        leg.segment.class === SegmentClass.Arrival,
        { altitude1: alt, altitudeDescriptor: option },
        this.loadedFlightPlanIndex.get(),
        false,
      );
    }
  }

  private tryAddCruiseStep(lineIndex: number) {
    const wptIndex = this.stepAltsWptIndices[lineIndex].get();
    const alt = this.stepAltsAltitudes[lineIndex].get();

    if (wptIndex !== null && alt !== null) {
      const legIndex = this.availableWaypointsToLegIndex[wptIndex];
      console.log('add cruise step', wptIndex, legIndex, this.loadedFlightPlan?.allLegs);
      this.loadedFlightPlan?.addOrUpdateCruiseStep(legIndex, alt);
    }
  }

  private tryDeleteCruiseStep(lineIndex: number, oldWptIndex: number) {
    console.log('delete cruise step');
    if (this.stepAltsWptIndices[lineIndex].get() === null || this.stepAltsAltitudes[lineIndex].get() === null) {
      this.loadedFlightPlan?.removeCruiseStep(oldWptIndex);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

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
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          // const obs = this.props.fmService.guidanceController.verticalProfileComputationParametersObserver.get();
        }),
    );

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (this.returnButtonDiv.getOrDefault() && this.tmpyInsertButtonDiv.getOrDefault()) {
          this.returnButtonDiv.instance.style.visibility = v ? 'hidden' : 'visible';
          this.tmpyInsertButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
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
                    <span class="mfd-label biggest green mfd-spacing-right">{this.speedConstraintType}</span>
                    <span class="mfd-label bigger mfd-spacing-right">SPD CSTR AT </span>
                    <DropdownMenu
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_clbConstraintWptDropdown`}
                      selectedIndex={this.selectedWaypointIndex}
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
                      dataHandlerDuringValidation={async (val) => {
                        const selectedWaypointIndex = this.selectedWaypointIndex.get();
                        if (this.props.fmcService.master && selectedWaypointIndex != null) {
                          const index =
                            this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get())
                              .activeLegIndex +
                            selectedWaypointIndex +
                            1;
                          const fpln = this.props.fmcService.master.flightPlanService.get(
                            this.loadedFlightPlanIndex.get(),
                          );
                          const leg = fpln.legElementAt(index);

                          this.props.fmcService.master.flightPlanService.setPilotEnteredSpeedConstraintAt(
                            index,
                            leg.segment.class === SegmentClass.Arrival,
                            val ?? 250,
                            this.loadedFlightPlanIndex.get(),
                            false,
                          );
                        }
                      }}
                      mandatory={Subject.create(false)}
                      disabled={this.spdConstraintDisabled}
                      value={this.speedConstraintInput}
                      alignText="flex-end"
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
                            SPEED CSTR
                          </span>
                          <span style="display: flex; align-items: center; justify-content: center;">*</span>
                        </div>,
                      )}
                      onClick={() => {
                        const selectedWaypointIndex = this.selectedWaypointIndex.get();
                        if (this.props.fmcService.master && selectedWaypointIndex != null) {
                          const index =
                            this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get())
                              .activeLegIndex +
                            selectedWaypointIndex +
                            1;
                          const fpln = this.props.fmcService.master.flightPlanService.get(
                            this.loadedFlightPlanIndex.get(),
                          );
                          const leg = fpln.legElementAt(index);
                          leg.clearSpeedConstraints();
                          this.updateConstraints();
                        }
                      }}
                      disabled={this.cannotDeleteSpeedConstraint}
                      buttonStyle="adding-right: 2px;"
                    />
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
                    <span class="mfd-label biggest green mfd-spacing-right">{this.altitudeConstraintType}</span>
                    <span class="mfd-label bigger mfd-spacing-right">ALT CSTR AT </span>
                    <DropdownMenu
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_altConstraintWptDropdown`}
                      selectedIndex={this.selectedWaypointIndex}
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
                        color={this.tmpyActive.map((it) => (it ? 'yellow' : 'cyan'))}
                        valuesDisabled={this.altConstraintDisabled.map((it) => Array(3).fill(it))}
                        onModified={(newIdx) => {
                          this.selectedAltitudeConstraintOption.set(newIdx);
                          this.tryUpdateAltitudeConstraint();
                        }}
                      />
                      <div ref={this.altWindowLabelRef} class="mfd-label bigger mfd-vert-rev-alt-window-label">
                        WINDOW
                      </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-self: flex-end; justify-content: center; align-items: center; padding-bottom: 20px;">
                      <div class={{ invisible: this.selectedAltitudeConstraintOption.map((v) => v === null) }}>
                        <InputField<number>
                          dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transitionAltitude)}
                          dataHandlerDuringValidation={(val) => this.tryUpdateAltitudeConstraint(val ?? undefined)}
                          mandatory={Subject.create(false)}
                          disabled={this.altConstraintDisabled}
                          value={this.altitudeConstraintInput}
                          alignText="flex-end"
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
                    <Button
                      label={Subject.create(
                        <div style="display: flex; flex-direction: row; justify-content: space-between;">
                          <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                            DELETE
                            <br />
                            ALT CSTR
                          </span>
                          <span style="display: flex; align-items: center; justify-content: center;">*</span>
                        </div>,
                      )}
                      onClick={() => {
                        const selectedWaypointIndex = this.selectedWaypointIndex.get();
                        if (this.props.fmcService.master && selectedWaypointIndex != null) {
                          const index =
                            this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get())
                              .activeLegIndex +
                            selectedWaypointIndex +
                            1;
                          const fpln = this.props.fmcService.master.flightPlanService.get(
                            this.loadedFlightPlanIndex.get(),
                          );

                          const leg = fpln.legElementAt(index);
                          leg.clearAltitudeConstraints();
                          this.updateConstraints();
                        }
                      }}
                      disabled={this.cannotDeleteAltConstraint}
                      buttonStyle="adding-right: 2px;"
                    />
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
                      <span class="mfd-value">{FmgcData.fmcFormatValue(this.crzFl)}</span>
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
                          <span>TIME</span>
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
                                  onModified={(newWptIndex) => {
                                    const wptIndex = this.stepAltsWptIndices[li].get();
                                    if (newWptIndex === null && wptIndex !== null) {
                                      this.tryDeleteCruiseStep(li, wptIndex);
                                    } else if (newWptIndex !== null) {
                                      this.stepAltsWptIndices[li].set(newWptIndex);
                                      this.tryAddCruiseStep(li);
                                    }
                                  }}
                                  hEventConsumer={this.props.mfd.hEventConsumer}
                                  interactionMode={this.props.mfd.interactionMode}
                                />
                              </div>
                            </div>
                            <div class="fc aic jcc" style="border-right: 1px solid #777777;">
                              <div style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                <InputField<number>
                                  dataEntryFormat={new FlightLevelFormat()}
                                  value={this.stepAltsAltitudes[li]}
                                  containerStyle="width: 150px;"
                                  alignText="center"
                                  onModified={(alt) => {
                                    const wptIndex = this.stepAltsWptIndices[li].get();
                                    if (alt === null && wptIndex !== null) {
                                      this.tryDeleteCruiseStep(li, wptIndex);
                                    } else if (alt !== null) {
                                      this.stepAltsAltitudes[li].set(alt);
                                      this.tryAddCruiseStep(li);
                                    }
                                  }}
                                  hEventConsumer={this.props.mfd.hEventConsumer}
                                  interactionMode={this.props.mfd.interactionMode}
                                />
                              </div>
                            </div>
                            <div
                              class="fr aic jcc"
                              style={{
                                display: this.stepAltsIgnored[li].map((i) => (i ? 'flex' : 'none')),
                                'grid-column': 'span 2',
                              }}
                            >
                              <span class="mfd-label">IGNORED</span>
                            </div>
                            <div
                              class="fr aic jcc"
                              style={{
                                display: this.stepAltsIgnored[li].map((i) => (i ? 'none' : 'flex')),
                                'justify-content': 'flex-end',
                              }}
                            >
                              <div style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                <span class="mfd-value">{FmgcData.fmcFormatValue(this.stepAltsDistances[li])}</span>
                                <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                              </div>
                            </div>
                            <div
                              class="fr aic jcc"
                              style={{ display: this.stepAltsIgnored[li].map((i) => (i ? 'none' : 'flex')) }}
                            >
                              <span class="mfd-value" style={{ visibility: this.stepAltsLineVisibility[li] }}>
                                {this.stepAltsTimes[li]}
                              </span>
                            </div>
                          </>
                        ))}
                      </div>
                      <div style="flex-grow: 1" />
                      <div clasS="fr jcc" style="flex: 1;">
                        <span
                          class="mfd-label biggest amber"
                          style={{ visibility: this.stepNotAllowedAt.map((s) => (s === null ? 'hidden' : 'visible')) }}
                        >
                          {this.stepNotAllowedAt.map((s) => `STEP NOT ALLOWED AT ${s}`)}
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

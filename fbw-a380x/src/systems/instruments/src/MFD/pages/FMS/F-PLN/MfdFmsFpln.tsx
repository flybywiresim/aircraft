import { ArraySubject, ClockEvents, ComponentProps, DisplayComponent, FSComponent, MappedSubject, NodeReference, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFpln.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { ContextMenu, ContextMenuElement } from 'instruments/src/MFD/pages/common/ContextMenu';
import { FplnRevisionsMenuType, getRevisionsMenu } from 'instruments/src/MFD/pages/FMS/F-PLN/FplnRevisionsMenu';
import { DestinationWindow } from 'instruments/src/MFD/pages/FMS/F-PLN/DestinationWindow';
import { InsertNextWptFromWindow, NextWptInfo } from 'instruments/src/MFD/pages/FMS/F-PLN/InsertNextWptFrom';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { WindVector } from '@fmgc/guidance/vnav/wind';
import { PseudoWaypoint } from '@fmgc/guidance/PseudoWaypoint';
import { Coordinates, bearingTo } from 'msfs-geo';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Units, LegType, TurnDirection } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex } from '@fmgc/index';
import { MfdFmsFplnVertRev } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnVertRev';

interface MfdFmsFplnProps extends AbstractMfdPageProps {
}

export interface DerivedFplnLegData {
    trackFromLastWpt: number,
    distanceFromLastWpt: number,
    windPrediction: WindVector,
}

export class MfdFmsFpln extends FmsPage<MfdFmsFplnProps> {
    private lineColor = Subject.create<FplnLineColor>(FplnLineColor.Active);

    private spdAltEfobWindRef = FSComponent.createRef<HTMLDivElement>();

    private displayEfobAndWind = Subject.create<boolean>(false);

    private efobAndWindButtonDynamicContent = Subject.create<VNode>(<span>HELLO</span>);

    private efobAndWindButtonMenuItems = Subject.create<ButtonMenuItem[]>([{ label: '', action: () => { } }]);

    private lineData: FplnLineDisplayData[];

    private renderedLineData = [
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
        Subject.create<FplnLineDisplayData>(null),
    ];

    private activeLegIndex: number = 1;

    private lastRenderedFpVersion: number = -1;

    private derivedFplnLegData: DerivedFplnLegData[] = [];

    private linesDivRef = FSComponent.createRef<HTMLDivElement>();

    private tmpyLineRef = FSComponent.createRef<HTMLDivElement>();

    private destButtonLabel = Subject.create<string>('');

    private destButtonDisabled = Subject.create<boolean>(true);

    private destTimeLabel = Subject.create<string>('--:--');

    private destDistanceLabel = Subject.create<string>('---');

    private displayFplnFromLineIndex = Subject.create<number>(0);

    private lastRenderedDisplayLineIndex: number = -1;

    private disabledScrollDown = Subject.create(true);

    private disabledScrollUp = Subject.create(false);

    private revisionsMenuRef = FSComponent.createRef<ContextMenu>();

    private revisionsMenuValues = Subject.create<ContextMenuElement[]>([]);

    private revisionsMenuOpened = Subject.create<boolean>(false);

    private newDestWindowOpened = Subject.create<boolean>(false);

    private insertNextWptWindowOpened = Subject.create<boolean>(false);

    private nextWptAvailableWaypoints = ArraySubject.create<NextWptInfo>([]);

    protected onNewData(): void {
        console.time('F-PLN:onNewData');

        // this.update is most costly function. First performance improvement: Don't render everything completely new every time, just update with refs
        // Delete and re-render FPLN lines only if:
        // a) activeLegIndex changes
        // b) flight plan version was increased
        // c) list was scrolled up or down
        const activeLegIndexChanged = this.activeLegIndex !== this.loadedFlightPlan.activeLegIndex;
        const fpVersionIncreased = this.lastRenderedFpVersion !== this.loadedFlightPlan.version;
        const listWasScrolled = this.lastRenderedDisplayLineIndex !== this.displayFplnFromLineIndex.get();
        const onlyUpdatePredictions = !(activeLegIndexChanged || fpVersionIncreased || listWasScrolled);

        this.activeLegIndex = this.loadedFlightPlan.activeLegIndex;
        this.update(this.displayFplnFromLineIndex.get(), onlyUpdatePredictions);
        this.lastRenderedFpVersion = this.loadedFlightPlan.version;
        this.lastRenderedDisplayLineIndex = this.displayFplnFromLineIndex.get();

        if (this.loadedFlightPlan.destinationAirport) {
            this.destButtonDisabled.set(false);
            if (this.loadedFlightPlan.destinationRunway) {
                this.destButtonLabel.set(`${this.loadedFlightPlan.destinationRunway.airportIdent}${this.loadedFlightPlan.destinationRunway.ident.replace('RW', '')}`);
            } else {
                this.destButtonLabel.set(this.loadedFlightPlan.destinationAirport.ident);
            }
        } else {
            this.destButtonDisabled.set(true);
            this.destButtonLabel.set('------');
        }

        const destPred = this.props.fmService.guidanceController.vnavDriver.getDestinationPrediction();
        if (destPred) {
            const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
            const eta = new Date((utcTime + destPred.secondsFromPresent) * 1000);
            this.destTimeLabel.set(`${eta.getHours().toString().padStart(2, '0')}:${eta.getMinutes().toString().padStart(2, '0')}`);
            this.destDistanceLabel.set(Number.isFinite(destPred.distanceFromAircraft) ? destPred.distanceFromAircraft.toFixed(0) : '---');
        }
        console.timeEnd('F-PLN:onNewData');
    }

    private updateEfisPlanCentre(planDisplayForPlan: number, planDisplayLegIndex: number, planDisplayInAltn: boolean) {
        // Update ND map center
        this.props.fmService.efisInterface.setPlanCentre(planDisplayForPlan, planDisplayLegIndex, planDisplayInAltn);
        this.props.fmService.efisInterface.setAlternateLegVisible(this.loadedFlightPlan.alternateFlightPlan.legCount > 0, planDisplayForPlan);
        this.props.fmService.efisInterface.setMissedLegVisible((planDisplayLegIndex + 8) >= this.loadedFlightPlan.firstMissedApproachLegIndex, planDisplayForPlan);
        this.props.fmService.efisInterface.setAlternateMissedLegVisible(
            this.loadedFlightPlan.alternateFlightPlan && (planDisplayLegIndex + 8) >= this.loadedFlightPlan.alternateFlightPlan.firstMissedApproachLegIndex,
            planDisplayForPlan,
        );
        this.props.fmService.efisInterface.setSecRelatedPageOpen(planDisplayForPlan >= FlightPlanIndex.FirstSecondary);
    }

    private update(startAtIndex: number, onlyUpdatePredictions = true): void {
        // Make sure that you can't scroll higher than the FROM wpt
        if (startAtIndex < this.loadedFlightPlan.activeLegIndex - 1) {
            this.displayFplnFromLineIndex.set(startAtIndex);
            return;
        }

        // Compute rest of required attributes
        this.derivedFplnLegData = [];
        let lastDistanceFromStart: number = 0;
        let lastLegLatLong: Coordinates = { lat: 0, long: 0 };
        this.loadedFlightPlan.allLegs.concat(this.loadedFlightPlan.alternateFlightPlan.allLegs).forEach((el, index) => {
            const newEl: DerivedFplnLegData = { distanceFromLastWpt: undefined, trackFromLastWpt: undefined, windPrediction: undefined };

            if (el instanceof FlightPlanLeg && index < this.loadedFlightPlan.legCount) {
                if (index === 0) {
                    newEl.distanceFromLastWpt = null;
                    newEl.trackFromLastWpt = null;
                    newEl.windPrediction = WindVector.default();
                } else {
                    newEl.distanceFromLastWpt = (this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(index)?.distanceFromStart !== undefined)
                        ? this.props.fmService.guidanceController.vnavDriver.mcduProfile.waypointPredictions.get(index).distanceFromStart - lastDistanceFromStart
                        : null;
                    newEl.trackFromLastWpt = (el.definition.waypoint) ? bearingTo(lastLegLatLong, el.definition.waypoint.location) : null;
                    newEl.windPrediction = WindVector.default();
                }

                if (this.props.fmService.guidanceController.vnavDriver?.mcduProfile?.waypointPredictions?.get(index)) {
                    lastDistanceFromStart = (this.props.fmService.guidanceController.vnavDriver.mcduProfile)
                        ? this.props.fmService.guidanceController.vnavDriver.mcduProfile.waypointPredictions.get(index).distanceFromStart
                        : 0;
                    lastLegLatLong = el.definition.waypoint?.location ?? lastLegLatLong;
                }
            } else {
                newEl.distanceFromLastWpt = null;
                newEl.trackFromLastWpt = null;
                newEl.windPrediction = WindVector.default();
            }

            this.derivedFplnLegData.push(newEl);
        });

        this.lineData = [];

        // Prepare sequencing of pseudo waypoints
        const pseudoWptMap = new Map<number, PseudoWaypoint>();
        // Insert pseudo waypoints from guidance controller
        this.props.fmService.guidanceController.pseudoWaypoints.pseudoWaypoints.forEach((wpt) => pseudoWptMap.set(wpt.alongLegIndex, wpt));

        // Construct leg data for all legs
        const jointFlightPlan: FlightPlanElement[] = this.loadedFlightPlan.allLegs.concat(this.loadedFlightPlan.alternateFlightPlan.allLegs);
        lastDistanceFromStart = 0;
        const fmgcFlightPhase = this.props.fmService.fmgc.getFlightPhase();

        const predictionTimestamp = (seconds: number) => {
            if (seconds === undefined) {
                return 0;
            }

            if (fmgcFlightPhase >= FmgcFlightPhase.Takeoff) {
                const eta = (SimVar.GetGlobalVarValue('ZULU TIME', 'seconds') + seconds) * 1000;
                return eta;
            } if (this.props.fmService.fmgc.data.estimatedTakeoffTime.get() !== undefined) {
                const eta = (this.props.fmService.fmgc.data.estimatedTakeoffTime.get() + seconds) * 1000;
                return eta;
            }
            return seconds * 1000;
        };

        for (let i = 0; i < jointFlightPlan.length; i++) {
            const leg = jointFlightPlan[i];
            const isAltn = i >= this.loadedFlightPlan.allLegs.length;
            let reduceDistanceBy = 0;

            if (pseudoWptMap.has(i) === true && pseudoWptMap.get(i).displayedOnMcdu) {
                const pwp = pseudoWptMap.get(i);
                reduceDistanceBy = pwp.flightPlanInfo.distanceFromStart - lastDistanceFromStart;
                lastDistanceFromStart = pwp.flightPlanInfo.distanceFromStart;
                const data: FplnLineWaypointDisplayData = {
                    type: FplnLineType.Waypoint,
                    originalLegIndex: undefined,
                    isPseudoWaypoint: true,
                    isAltnWaypoint: isAltn,
                    isMissedAppchWaypoint: isAltn ? i >= this.loadedFlightPlan.alternateFlightPlan.firstMissedApproachLegIndex : i >= this.loadedFlightPlan.firstMissedApproachLegIndex,
                    ident: pwp.mcduIdent ?? pwp.ident,
                    overfly: false,
                    annotation: pwp.mcduHeader ?? '',
                    etaOrSecondsFromPresent: predictionTimestamp(pwp.flightPlanInfo.secondsFromPresent),
                    transitionAltitude: (leg instanceof FlightPlanLeg) ? (leg.definition.transitionAltitude ?? 18000) : 18000,
                    altitudePrediction: pwp.flightPlanInfo.altitude,
                    hasAltitudeConstraint: false, // TODO
                    altitudeConstraintIsRespected: true,
                    speedPrediction: pwp.flightPlanInfo.speed,
                    hasSpeedConstraint: (pwp.mcduIdent ?? pwp.ident) === '(SPDLIM)',
                    speedConstraintIsRespected: true,
                    efobPrediction: Units.poundToKilogram(this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.estimatedFuelOnBoard) / 1000.0 ?? 0,
                    windPrediction: this.derivedFplnLegData[i].windPrediction,
                    trackFromLastWpt: this.derivedFplnLegData[i].trackFromLastWpt,
                    distFromLastWpt: pwp.flightPlanInfo.distanceFromStart - lastDistanceFromStart,
                    fpa: undefined,
                };
                this.lineData.push(data);
            }

            if (leg instanceof FlightPlanLeg) {
                const transAlt = this.loadedFlightPlan.performanceData.transitionAltitude ?? 18_000;
                const transLevel = this.loadedFlightPlan.performanceData.transitionLevel ?? 18_000;
                const useTransLevel = (i >= (
                    this.loadedFlightPlan.originSegment.legCount
                    + this.loadedFlightPlan.enrouteSegment.legCount
                    + this.loadedFlightPlan.departureSegment.legCount
                    + this.loadedFlightPlan.departureRunwayTransitionSegment.legCount
                    + this.loadedFlightPlan.departureEnrouteTransitionSegment.legCount));

                if (leg.type === LegType.HM) {
                    // Insert special HM line, TODO
                    const holdData: FplnLineHoldDisplayData = {
                        type: FplnLineType.Hold,
                        originalLegIndex: i,
                        isPseudoWaypoint: false,
                        isAltnWaypoint: isAltn,
                        isMissedAppchWaypoint: isAltn ? i >= this.loadedFlightPlan.alternateFlightPlan.firstMissedApproachLegIndex : i >= this.loadedFlightPlan.firstMissedApproachLegIndex,
                        ident: leg.definition.turnDirection === TurnDirection.Left ? 'HOLD L' : 'HOLD R',
                        distFromLastWpt: leg.definition.length,
                        holdSpeed: 123,
                    };
                    this.lineData.push(holdData);
                }

                const annotation = (leg.type === LegType.HF || leg.type === LegType.HA) ? 'HOLD L' : leg.annotation;

                const data: FplnLineWaypointDisplayData = {
                    type: FplnLineType.Waypoint,
                    originalLegIndex: isAltn ? i - this.loadedFlightPlan.legCount : i,
                    isPseudoWaypoint: false,
                    isAltnWaypoint: isAltn,
                    isMissedAppchWaypoint: isAltn ? i >= this.loadedFlightPlan.alternateFlightPlan.firstMissedApproachLegIndex : i >= this.loadedFlightPlan.firstMissedApproachLegIndex,
                    ident: leg.ident,
                    overfly: leg.definition.overfly,
                    annotation,
                    etaOrSecondsFromPresent: predictionTimestamp(this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.secondsFromPresent),
                    transitionAltitude: useTransLevel ? transLevel : transAlt,
                    altitudePrediction: this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.altitude ?? 0,
                    hasAltitudeConstraint: !!this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.altitudeConstraint ?? false,
                    altitudeConstraintIsRespected: this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.isAltitudeConstraintMet ?? true,
                    speedPrediction: this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.speed ?? 0,
                    hasSpeedConstraint: !!this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.speedConstraint ?? false,
                    speedConstraintIsRespected: this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions?.get(i)?.isSpeedConstraintMet ?? true,
                    efobPrediction: Units.poundToKilogram(this.props.fmService.guidanceController.vnavDriver.mcduProfile?.waypointPredictions.get(i)?.estimatedFuelOnBoard) / 1000.0 ?? 0,
                    windPrediction: this.derivedFplnLegData[i].windPrediction,
                    trackFromLastWpt: this.derivedFplnLegData[i].trackFromLastWpt,
                    distFromLastWpt: this.derivedFplnLegData[i].distanceFromLastWpt - reduceDistanceBy,
                    fpa: leg.definition.verticalAngle,
                };
                this.lineData.push(data);
            } else {
                const data: FplnLineSpecialDisplayData = {
                    type: FplnLineType.Special,
                    originalLegIndex: isAltn ? i - this.loadedFlightPlan.legCount : i,
                    label: 'DISCONTINUITY',
                };
                this.lineData.push(data);
            }

            // Identify end of F-PLN
            if (i === this.loadedFlightPlan.allLegs.length - 1) {
                this.lineData.push({
                    type: FplnLineType.Special,
                    originalLegIndex: null,
                    label: 'END OF F-PLN',
                });

                if (this.loadedFlightPlan.alternateFlightPlan.allLegs.length === 0) {
                    this.lineData.push({
                        type: FplnLineType.Special,
                        originalLegIndex: null,
                        label: 'NO ALTN F-PLN',
                    });
                }
            }

            // Identify end of ALTN F-PLN
            if (this.loadedFlightPlan.alternateFlightPlan.allLegs.length > 0 && i === (jointFlightPlan.length - 1)) {
                this.lineData.push({
                    type: FplnLineType.Special,
                    originalLegIndex: null,
                    label: 'END OF ALTN F-PLN',
                });
            }
        }

        // Delete all lines only if re-render is neccessary.
        if (onlyUpdatePredictions === false) {
            while (this.linesDivRef.instance.firstChild) {
                this.linesDivRef.instance.removeChild(this.linesDivRef.instance.firstChild);
            }
        }

        const untilLegIndex = Math.min(this.lineData.length, startAtIndex + (this.tmpyActive.get() ? 8 : 9));
        for (let drawIndex = startAtIndex; drawIndex < untilLegIndex; drawIndex++) {
            if (drawIndex > this.lineData.length - 1) {
                // Insert empty line
                if (onlyUpdatePredictions === false) {
                    FSComponent.render(<div />, this.linesDivRef.instance);
                }
            } else {
                const lineIndex = drawIndex - startAtIndex;

                const previousRow = (drawIndex > 0) ? this.lineData[drawIndex - 1] : null;
                const previousIsSpecial = previousRow ? previousRow.type === FplnLineType.Special : false;
                const nextRow = (drawIndex < this.lineData.length - 1) ? this.lineData[drawIndex + 1] : null;
                const nextIsSpecial = nextRow ? nextRow.type === FplnLineType.Special : false;

                let flags = FplnLineFlags.None;
                if (lineIndex === 0) {
                    flags |= FplnLineFlags.FirstLine;
                }
                if (previousIsSpecial === true) {
                    flags |= FplnLineFlags.AfterSpecial;
                }
                if (lineIndex === (this.tmpyActive.get() ? 7 : 8)) {
                    flags |= FplnLineFlags.LastLine;
                }
                if (nextIsSpecial) {
                    flags |= FplnLineFlags.BeforeSpecial;
                }
                if (drawIndex === this.activeLegIndex) {
                    flags |= FplnLineFlags.IsActiveLeg;
                }
                if (drawIndex === this.activeLegIndex - 1) {
                    flags |= FplnLineFlags.BeforeActiveLeg;
                }

                this.renderedLineData[lineIndex].set(this.lineData[drawIndex]);

                if (onlyUpdatePredictions === false) {
                    const node = (
                        <FplnLegLine
                            data={this.renderedLineData[lineIndex]}
                            previousRow={Subject.create(previousRow)}
                            openRevisionsMenuCallback={() => {
                                const line = this.lineData[drawIndex];
                                this.openRevisionsMenu(line.originalLegIndex, isWaypoint(line) ? line.isAltnWaypoint : false);
                            }}
                            flags={Subject.create(flags)}
                            displayEfobAndWind={this.displayEfobAndWind}
                            globalLineColor={MappedSubject.create(([tmpy, sec]) => {
                                if (sec === true) {
                                    return FplnLineColor.Secondary;
                                }
                                if (tmpy === true) {
                                    return FplnLineColor.Temporary;
                                }
                                return FplnLineColor.Active;
                            }, this.tmpyActive, this.secActive)}
                            revisionsMenuIsOpened={this.revisionsMenuOpened}
                            callbacks={{
                                speed: () => this.goToSpeedConstraint(drawIndex),
                                altitude: () => this.goToAltitudeConstraint(drawIndex),
                                rta: () => this.goToTimeConstraint(drawIndex),
                                wind: () => { },
                            }}
                        />
                    );
                    FSComponent.render(node, this.linesDivRef.instance);
                }
            }
        }

        // If pseudo-waypoint, find last actual waypoint
        let planCentreLineDataIndex = startAtIndex;
        const isNoPseudoWpt = (data: FplnLineDisplayData) => {
            if (isWaypoint(data) && data.isPseudoWaypoint === false) {
                return true;
            }
            return false;
        };
        while (isNoPseudoWpt(this.lineData[planCentreLineDataIndex]) === false) {
            planCentreLineDataIndex--;
        }

        const planCentreWpt = this.lineData[planCentreLineDataIndex];
        if (isWaypoint(planCentreWpt)) {
            this.updateEfisPlanCentre(this.loadedFlightPlanIndex.get(), planCentreWpt.originalLegIndex, planCentreWpt.isAltnWaypoint);
        }
    }

    private openRevisionsMenu(legIndex: number, altnFlightPlan: boolean) {
        if (this.revisionsMenuOpened.get() === false) {
            const flightPlan = altnFlightPlan ? this.loadedFlightPlan.alternateFlightPlan : this.loadedFlightPlan;
            const leg = flightPlan.elementAt(legIndex);
            this.props.fmService.setRevisedWaypoint(legIndex, this.loadedFlightPlanIndex.get(), altnFlightPlan);

            if (leg instanceof FlightPlanLeg) {
                let type: FplnRevisionsMenuType = FplnRevisionsMenuType.Waypoint;
                if (leg.segment.class === SegmentClass.Departure) {
                    type = FplnRevisionsMenuType.Departure;
                } else if (leg.segment.class === SegmentClass.Arrival) {
                    type = FplnRevisionsMenuType.Arrival;
                }

                this.revisionsMenuValues.set(getRevisionsMenu(this, type));
                this.revisionsMenuRef.instance.display(195, 183);
            } else {
                this.revisionsMenuValues.set(getRevisionsMenu(this, FplnRevisionsMenuType.Discontinuity));
                this.revisionsMenuRef.instance.display(195, 183);
            }
        }
    }

    public openNewDestWindow() {
        this.newDestWindowOpened.set(true);
    }

    public openInsertNextWptFromWindow() {
        const flightPlan = this.props.fmService.revisedWaypointIsAltn.get() ? this.loadedFlightPlan.alternateFlightPlan : this.loadedFlightPlan;
        const wpt = flightPlan.allLegs.map((el, idx) => {
            if (el instanceof FlightPlanLeg && el.isXF() === true && idx >= this.props.fmService.revisedWaypointIndex.get() + 1) {
                return { ident: el.ident, originalLegIndex: idx };
            }
            return null;
        }).filter((el) => el !== null);
        this.nextWptAvailableWaypoints.set(wpt);
        this.insertNextWptWindowOpened.set(true);
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        if (this.props.uiService.activeUri.get().extra === 'dest') {
            // Scroll to end of FPLN (destination on last line)
            this.scrollToDest();
        }

        this.subs.push(this.displayEfobAndWind.sub((val) => {
            this.efobAndWindButtonDynamicContent.set(val === true ? this.efobWindButton() : this.spdAltButton());
            this.efobAndWindButtonMenuItems.set([{
                action: () => this.displayEfobAndWind.set(!this.displayEfobAndWind.get()),
                label: this.displayEfobAndWind.get() === true ? 'SPD&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ALT' : 'EFOB&nbsp;&nbsp;&nbsp;&nbsp;T.WIND',
            }]);
        }, true));

        this.subs.push(this.displayFplnFromLineIndex.sub((val) => {
            this.update(val, false);
            this.lastRenderedDisplayLineIndex = this.displayFplnFromLineIndex.get();

            this.disabledScrollUp.set(!this.lineData || val <= 0);
            this.disabledScrollDown.set(!this.lineData || val >= this.lineData.length - 1);
        }, true));

        this.subs.push(this.tmpyActive.sub((val) => {
            if (val === true) {
                this.lineColor.set(FplnLineColor.Temporary);
                this.tmpyLineRef.instance.style.display = 'flex';
            } else {
                this.lineColor.set(FplnLineColor.Active);
                this.tmpyLineRef.instance.style.display = 'none';
            }
            this.update(this.displayFplnFromLineIndex.get(), false);
            this.lastRenderedDisplayLineIndex = this.displayFplnFromLineIndex.get();
        }, true));

        const sub = this.props.bus.getSubscriber<ClockEvents>();
        this.subs.push(sub.on('realTime').atFrequency(0.5).handle((_t) => {
            this.onNewData();
        }));
    }

    private spdAltButton(): VNode {
        return (
            <div class="mfd-fms-fpln-button-speed-alt">
                <span style="padding-left: 10px;">
                    SPD
                </span>
                <span style="margin-right: 55px;">
                    ALT
                </span>
            </div>
        );
    }

    private goToTimeConstraint(lineDataIndex: number) {
        const data = this.lineData[lineDataIndex];
        if (isWaypoint(data) && MfdFmsFplnVertRev.isEligibleForVerticalRevision(data.originalLegIndex, this.loadedFlightPlan.legElementAt(data.originalLegIndex), this.loadedFlightPlan)) {
            this.props.fmService.setRevisedWaypoint(data.originalLegIndex, this.loadedFlightPlanIndex.get(), data.isAltnWaypoint);
            this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-vert-rev/rta`);
        }
    }

    private goToSpeedConstraint(lineDataIndex: number) {
        const data = this.lineData[lineDataIndex];
        if (isWaypoint(data) && MfdFmsFplnVertRev.isEligibleForVerticalRevision(data.originalLegIndex, this.loadedFlightPlan.legElementAt(data.originalLegIndex), this.loadedFlightPlan)) {
            this.props.fmService.setRevisedWaypoint(data.originalLegIndex, this.loadedFlightPlanIndex.get(), data.isAltnWaypoint);
            this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-vert-rev/spd`);
        }
    }

    private goToAltitudeConstraint(lineDataIndex: number) {
        const data = this.lineData[lineDataIndex];
        if (isWaypoint(data) && MfdFmsFplnVertRev.isEligibleForVerticalRevision(data.originalLegIndex, this.loadedFlightPlan.legElementAt(data.originalLegIndex), this.loadedFlightPlan)) {
            this.props.fmService.setRevisedWaypoint(data.originalLegIndex, this.loadedFlightPlanIndex.get(), data.isAltnWaypoint);
            this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-vert-rev/alt`);
        }
    }

    private efobWindButton(): VNode {
        return (
            <div class="mfd-fms-fpln-button-speed-alt">
                <span>
                    EFOB
                </span>
                <span style="margin-left: 30px;">
                    T.WIND
                </span>
            </div>
        );
    }

    private scrollToDest() {
        this.displayFplnFromLineIndex.set(
            this.loadedFlightPlan.destinationLegIndex
            // eslint-disable-next-line max-len
            + this.props.fmService.guidanceController.pseudoWaypoints.pseudoWaypoints.filter((it) => it.alongLegIndex < this.loadedFlightPlan.destinationLegIndex).length
            - (this.tmpyActive.get() ? 7 : 8),
        );
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="mfd-page-container">
                    <ContextMenu
                        ref={this.revisionsMenuRef}
                        idPrefix="revisionsMenu"
                        values={this.revisionsMenuValues}
                        opened={this.revisionsMenuOpened}
                    />
                    <DestinationWindow
                        fmService={this.props.fmService}
                        visible={this.newDestWindowOpened}
                    />
                    <InsertNextWptFromWindow
                        fmService={this.props.fmService}
                        availableWaypoints={this.nextWptAvailableWaypoints}
                        visible={this.insertNextWptWindowOpened}
                    />
                    <div class="mfd-fms-fpln-header">
                        <div class="mfd-fms-fpln-header-from">
                            <span class="mfd-label">FROM</span>
                        </div>
                        <div class="mfd-fms-fpln-header-time">
                            <span class="mfd-label">TIME</span>
                        </div>
                        <div ref={this.spdAltEfobWindRef} class="mfd-fms-fpln-header-speed-alt">
                            <Button
                                label={this.efobAndWindButtonDynamicContent}
                                onClick={() => { }}
                                buttonStyle="margin-right: 5px; width: 260px; height: 43px;"
                                idPrefix="efobtwindbtn"
                                menuItems={this.efobAndWindButtonMenuItems}
                            />
                        </div>
                        <div class="mfd-fms-fpln-header-trk">
                            <span class="mfd-label">TRK</span>
                        </div>
                        <div class="mfd-fms-fpln-header-dist">
                            <span class="mfd-label">DIST</span>
                        </div>
                        <div class="mfd-fms-fpln-header-fpa">
                            <span class="mfd-label">FPA</span>
                        </div>
                    </div>
                    <div ref={this.linesDivRef} />
                    <div style="flex-grow: 1" />
                    <div ref={this.tmpyLineRef} class="mfd-fms-fpln-line-erase-temporary">
                        <Button
                            label={Subject.create(
                                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                                    <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                        ERASE
                                        <br />
                                        TMPY
                                    </span>
                                    <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                </div>,
                            )}
                            onClick={() => this.props.fmService.flightPlanService.temporaryDelete()}
                            buttonStyle="color: #e68000; padding-right: 2px;"
                        />
                        <Button
                            label={Subject.create(
                                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                                    <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                        INSERT
                                        <br />
                                        TMPY
                                    </span>
                                    <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                </div>,
                            )}
                            onClick={() => this.props.fmService.flightPlanService.temporaryInsert()}
                            buttonStyle="color: #e68000; padding-right: 2px;"
                        />
                    </div>
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div class="mfd-fms-fpln-line-destination">
                        <Button
                            label={this.destButtonLabel.map((it) => <span>{it}</span>)}
                            onClick={() => {
                                this.props.fmService.resetRevisedWaypoint();
                                this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-arrival`);
                            }}
                            buttonStyle="font-size: 30px; width: 150px; margin-right: 5px;"
                        />
                        <span class={{
                            'mfd-label': true,
                            'mfd-fms-yellow-text': this.lineColor.map((it) => it === FplnLineColor.Temporary),
                        }}
                        >
                            {this.destTimeLabel}

                        </span>
                        <div class="mfd-label-value-container">
                            <span class={{
                                'mfd-label': true,
                                'mfd-fms-yellow-text': this.lineColor.map((it) => it === FplnLineColor.Temporary),
                            }}
                            >
                                {(this.props.fmService.fmgc.getDestEFOB(true)).toFixed(1)}

                            </span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class={{
                                'mfd-label': true,
                                'mfd-fms-yellow-text': this.lineColor.map((it) => it === FplnLineColor.Temporary),
                            }}
                            >
                                {this.destDistanceLabel}

                            </span>
                            <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                        </div>
                        <div style="display: flex; flex-direction: row; margin-top: 5px; margin-bottom: 5px;">
                            <IconButton
                                icon="double-down"
                                onClick={() => this.displayFplnFromLineIndex.set(this.displayFplnFromLineIndex.get() + 1)}
                                disabled={this.disabledScrollDown}
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <IconButton
                                icon="double-up"
                                onClick={() => this.displayFplnFromLineIndex.set(this.displayFplnFromLineIndex.get() - 1)}
                                disabled={this.disabledScrollUp}
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <Button
                                label="DEST"
                                disabled={this.destButtonDisabled}
                                onClick={() => this.scrollToDest()}
                                buttonStyle="height: 60px; margin-right: 5px; padding: auto 15px auto 15px;"
                            />
                        </div>
                    </div>
                    <div class="mfd-fms-fpln-footer">
                        <Button label="INIT" onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/init`)} buttonStyle="width: 125px;" />
                        <Button
                            disabled={Subject.create(true)}
                            label="F-PLN INFO"
                            onClick={() => { }}
                            idPrefix="f-pln-infoBtn"
                            menuItems={Subject.create([{
                                label: 'ALTERNATE',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-alternate`),
                            },
                            {
                                label: 'CLOSEST AIRPORTS',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-closest-airports`),
                            },
                            {
                                label: 'EQUI-TIME POINT',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-equi-time-point`),
                            },
                            {
                                label: 'FIX INFO',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-fix-info`),
                            },
                            {
                                label: 'LL CROSSING',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-ll-xing-time-mkr`),
                            },
                            {
                                label: 'TIME MARKER',
                                action: () => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-ll-xing-time-mkr`),
                            },
                            {
                                label: 'CPNY F-PLN REPORT',
                                action: () => { },
                            }])}
                        />
                        <Button
                            label="DIR TO"
                            onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-direct-to`)}
                            buttonStyle="margin-right: 5px;"
                        />
                    </div>
                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

interface FplnLineCommonProps extends ComponentProps {
    openRevisionsMenuCallback: () => void;
}
enum FplnLineColor {
    Active = '#00ff00',
    Temporary = '#ffff00',
    Secondary = '#ffffff',
    Alternate = '#00ffff'
}

enum FplnLineFlags {
    None = 0,
    FirstLine = 1 << 0,
    BeforeSpecial = 1 << 1,
    AfterSpecial = 1 << 2,
    BeforeActiveLeg = 1 << 3,
    IsActiveLeg = 1 << 4,
    LastLine = 1 << 5,
}

enum FplnLineType {
    Waypoint,
    Special,
    Hold,
}

interface FplnLineTypeDiscriminator {
    /*
     * waypoint: Regular or pseudo waypoints
     * special: DISCONTINUITY, END OF F-PLN etc.
     */
    type: FplnLineType;
    originalLegIndex: number; // TODO consider linking to flight plan when data is being integrated
}

// Type for DISCO, END OF F-PLN etc.
interface FplnLineSpecialDisplayData extends FplnLineTypeDiscriminator {
    // type: FplnLineType.Special;
    label: string;
}

export interface FplnLineWaypointDisplayData extends FplnLineTypeDiscriminator {
    // type: FplnLineType.Waypoint;
    isPseudoWaypoint: boolean;
    isAltnWaypoint: boolean;
    isMissedAppchWaypoint: boolean;
    ident: string;
    overfly: boolean;
    annotation: string;
    etaOrSecondsFromPresent: number; // timestamp, will be printed to HH:mm
    transitionAltitude: number;
    altitudePrediction: number;
    hasAltitudeConstraint: boolean;
    altitudeConstraintIsRespected: boolean;
    speedPrediction: number;
    hasSpeedConstraint: boolean;
    speedConstraintIsRespected: boolean;
    efobPrediction: number;
    windPrediction: WindVector;
    trackFromLastWpt?: number;
    distFromLastWpt: number;
    fpa: number;
}

interface FplnLineHoldDisplayData extends FplnLineTypeDiscriminator {
    // type: FplnLineType.Hold;
    isPseudoWaypoint: boolean;
    isAltnWaypoint: boolean;
    isMissedAppchWaypoint: boolean;
    ident: string;
    holdSpeed: number;
    distFromLastWpt: number;
}

type FplnLineDisplayData = FplnLineWaypointDisplayData | FplnLineSpecialDisplayData | FplnLineHoldDisplayData;

function isWaypoint(object: FplnLineDisplayData): object is FplnLineWaypointDisplayData {
    return object.type === FplnLineType.Waypoint;
}

function isSpecial(object: FplnLineDisplayData): object is FplnLineSpecialDisplayData {
    return object.type === FplnLineType.Special;
}

function isHold(object: FplnLineDisplayData): object is FplnLineHoldDisplayData {
    return object.type === FplnLineType.Hold;
}

type lineConstraintsCallbacks = {
    speed: () => void;
    rta: () => void;
    altitude: () => void;
    wind: () => void;
}

export interface FplnLegLineProps extends FplnLineCommonProps {
    previousRow: Subscribable<FplnLineDisplayData | null>;
    data: Subscribable<FplnLineDisplayData>;
    flags: Subscribable<FplnLineFlags>;
    displayEfobAndWind: Subscribable<boolean>;
    globalLineColor: Subscribable<FplnLineColor>;
    revisionsMenuIsOpened: Subject<boolean>;
    callbacks: lineConstraintsCallbacks;
}

class FplnLegLine extends DisplayComponent<FplnLegLineProps> {
    // Make sure to collect all subscriptions here, so we can properly destroy them.
    private subs = [] as Subscription[];

    private selectedForRevision = Subject.create(false);

    private lineColor = MappedSubject.create(([color, data]) => {
        if ((isWaypoint(data) || isHold(data)) && (data.isAltnWaypoint === true || data.isMissedAppchWaypoint === true)) {
            return FplnLineColor.Alternate;
        }
        return color;
    }, this.props.globalLineColor, this.props.data);

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private lineRef = FSComponent.createRef<HTMLDivElement>();

    private currentlyRenderedType: FplnLineType;

    private annotationRef = FSComponent.createRef<HTMLDivElement>();

    private identRef = FSComponent.createRef<HTMLDivElement | HTMLSpanElement>();

    private timeRef = FSComponent.createRef<HTMLDivElement>();

    private speedRef = FSComponent.createRef<HTMLDivElement>();

    private altRef = FSComponent.createRef<HTMLDivElement>();

    private connectorRef = FSComponent.createRef<HTMLDivElement>();

    private trackRef = FSComponent.createRef<HTMLDivElement>();

    private distRef = FSComponent.createRef<HTMLDivElement>();

    private fpaRef = FSComponent.createRef<HTMLDivElement>();

    private allRefs: NodeReference<HTMLElement>[] = [this.annotationRef, this.identRef, this.timeRef, this.speedRef, this.altRef, this.connectorRef, this.trackRef, this.distRef, this.fpaRef]

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.flags.sub((val) => {
            if (FplnLineFlags.IsActiveLeg === (val & FplnLineFlags.IsActiveLeg)) {
                this.allRefs.forEach((ref) => (ref.getOrDefault() ? ref.getOrDefault().classList.add('mfd-fms-fpln-leg-active') : null));
            } else {
                this.allRefs.forEach((ref) => (ref.getOrDefault() ? ref.getOrDefault().classList.remove('mfd-fms-fpln-leg-active') : null));
            }
        }, true));

        this.subs.push(this.props.displayEfobAndWind.sub(() => {
            const data = this.props.data.get();
            if (isWaypoint(data)) {
                this.renderSpdAltEfobWind(data);
            }
        }, true));

        this.subs.push(this.props.data.sub((data) => this.onNewData(data), true));

        this.subs.push(this.selectedForRevision.sub((val) => {
            if (val === true) {
                this.identRef.getOrDefault().classList.add('selected');
            } else {
                this.identRef.getOrDefault().classList.remove('selected');
            }
        }));

        this.subs.push(this.props.revisionsMenuIsOpened.sub((val) => {
            if (val === false) {
                this.selectedForRevision.set(false);
                this.identRef.getOrDefault().classList.remove('selected');
            }
        }));

        if (this.identRef.getOrDefault()) {
            this.identRef.instance.addEventListener('click', () => {
                if (this.props.data.get().originalLegIndex !== undefined) {
                    this.props.openRevisionsMenuCallback();
                    this.selectedForRevision.set(true);
                }
            });
        }

        if (this.timeRef.getOrDefault()) {
            this.timeRef.instance.parentElement.addEventListener('click', () => this.props.callbacks.rta());
        }
    }

    private onNewData(data: FplnLineDisplayData): void {
        if (isWaypoint(data)) {
            if (this.currentlyRenderedType !== FplnLineType.Waypoint) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderWaypointLine(), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineType.Waypoint;
            }

            if (data.overfly === true) {
                this.identRef.getOrDefault().innerHTML = `<span>${data.ident}<span style="font-size: 24px; vertical-align: baseline;">@</span></span>`;
            } else {
                this.identRef.getOrDefault().innerText = data.ident;
            }

            // TODO: RNP info
            if (this.annotationRef.getOrDefault()) {
                this.annotationRef.getOrDefault().innerText = data.annotation;
            }

            // Format time to leg
            // TODO: Time constraint, "HOLD SPD" label
            if (this.props.globalLineColor.get() === FplnLineColor.Active) {
                if (data.etaOrSecondsFromPresent) {
                    const date = new Date(data.etaOrSecondsFromPresent);
                    this.timeRef.getOrDefault().innerText = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
                }
            } else {
                this.timeRef.getOrDefault().innerText = '--:--';
            }

            this.renderSpdAltEfobWind(data);

            while (this.connectorRef.getOrDefault().firstChild) {
                this.connectorRef.getOrDefault().removeChild(this.connectorRef.getOrDefault().firstChild);
            }
            FSComponent.render(this.lineConnector(data), this.connectorRef.getOrDefault());

            // TODO: True / magnetic track
            if (this.trackRef.getOrDefault() && this.distRef.getOrDefault() && this.fpaRef.getOrDefault()) {
                if (FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial)) {
                    this.trackRef.getOrDefault().innerText = '';
                    this.distRef.getOrDefault().innerText = '';
                    this.fpaRef.getOrDefault().innerText = '';
                } else {
                    this.trackRef.getOrDefault().innerText = data.trackFromLastWpt ? `${data.trackFromLastWpt.toFixed(0)}°` : '';
                    this.distRef.getOrDefault().innerText = data.distFromLastWpt.toFixed(0);
                    this.fpaRef.getOrDefault().innerText = data.fpa ? data.fpa.toFixed(1) : '';
                }
            }
        } else if (isSpecial(data)) {
            if (this.currentlyRenderedType !== FplnLineType.Special) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderSpecialLine(data), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineType.Special;
            }

            const delimiter = data.label.length > 13 ? '- - - - -' : '- - - - - - ';
            this.identRef.getOrDefault().innerHTML = `${delimiter}<span style="margin: 0px 15px 0px 15px;">${data.label}</span>${delimiter}`;
        } else if (isHold(data)) {
            if (this.currentlyRenderedType !== FplnLineType.Waypoint) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderWaypointLine(), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineType.Waypoint;
            }

            this.identRef.getOrDefault().innerText = data.ident;
            this.timeRef.getOrDefault().innerText = 'SPD';

            while (this.connectorRef.getOrDefault().firstChild) {
                this.connectorRef.getOrDefault().removeChild(this.connectorRef.getOrDefault().firstChild);
            }
            FSComponent.render(FplnLineConnectorHold(this.lineColor.get()), this.connectorRef.getOrDefault());

            // TODO: True / magnetic track
            if (this.trackRef.getOrDefault() && this.distRef.getOrDefault() && this.fpaRef.getOrDefault()) {
                this.trackRef.getOrDefault().innerText = '';
                this.distRef.getOrDefault().innerText = '';
                this.fpaRef.getOrDefault().innerText = '';
            }
        }
    }

    private renderSpdAltEfobWind(data: FplnLineWaypointDisplayData): void {
        while (this.speedRef.instance.firstChild) {
            this.speedRef.instance.parentElement.removeEventListener('click', () => this.props.callbacks.speed());
            this.speedRef.instance.removeChild(this.speedRef.instance.firstChild);
        }
        while (this.altRef.instance.firstChild) {
            this.altRef.instance.parentElement.removeEventListener('click', () => this.props.callbacks.altitude());
            this.altRef.instance.parentElement.removeEventListener('click', () => this.props.callbacks.wind());
            this.altRef.instance.removeChild(this.altRef.instance.firstChild);
        }
        FSComponent.render(this.efobOrSpeed(data), this.speedRef.instance);
        FSComponent.render(this.windOrAlt(data), this.altRef.instance);

        if (this.props.displayEfobAndWind.get() === true) {
            this.altRef.instance.style.alignSelf = 'flex-end';
            this.altRef.instance.style.paddingRight = '20px';
            this.altRef.instance.parentElement.addEventListener('click', () => this.props.callbacks.wind());
            this.speedRef.instance.parentElement.className = 'mfd-fms-fpln-label-small';
            this.speedRef.instance.style.paddingLeft = '10px';
        } else {
            this.altRef.instance.style.alignSelf = null;
            this.altRef.instance.style.paddingRight = null;
            this.altRef.instance.parentElement.addEventListener('click', () => this.props.callbacks.altitude());
            this.speedRef.instance.parentElement.className = 'mfd-fms-fpln-label-small-clickable';
            this.speedRef.instance.style.paddingLeft = null;
            this.speedRef.instance.parentElement.addEventListener('click', () => this.props.callbacks.speed());
        }
    }

    private formatWind(data: FplnLineWaypointDisplayData): VNode {
        let directionStr = '---';
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.windPrediction.direction === data.windPrediction.direction
            && !(FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) || FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine))) {
            directionStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
        } else {
            directionStr = <span>{data.windPrediction.direction.toFixed(0).toString().padStart(3, '0')}</span>;
        }

        let speedStr = '--';
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.windPrediction.speed === data.windPrediction.speed) {
            speedStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
        } else {
            speedStr = <span>{data.windPrediction.speed.toFixed(0).toString().padStart(3, '0')}</span>;
        }

        return (
            <div style="display: flex; flex-direction: row; justify-self: flex-end">
                <div style="width: 45px; text-align: center;">{directionStr}</div>
                <span>/</span>
                <div style="width: 45px; text-align: center;">{speedStr}</div>
            </div>
        );
    }

    private formatAltitude(data: FplnLineWaypointDisplayData): VNode {
        let altStr: VNode = <span>-----</span>;
        const previousRow = this.props.previousRow.get();
        if (data.altitudePrediction) {
            if (previousRow
                && isWaypoint(previousRow)
                && previousRow.altitudePrediction === data.altitudePrediction
                && !data.hasAltitudeConstraint
                && !(FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) || FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine))) {
                altStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
            } else if (data.altitudePrediction > (data.transitionAltitude ?? 18000)) {
                altStr = <span>{`FL${Math.round(data.altitudePrediction / 100).toString()}`}</span>;
            } else {
                altStr = <span>{data.altitudePrediction.toFixed(0)}</span>;
            }
        }
        if (data.hasAltitudeConstraint) {
            if (data.altitudeConstraintIsRespected) {
                return (
                    <>
                        <span class="mfd-fms-fpln-leg-constraint-respected">*</span>
                        <span>{altStr}</span>
                    </>
                );
            }
            return (
                <>
                    <span class="mfd-fms-fpln-leg-constraint-missed">*</span>
                    <span>{altStr}</span>
                </>
            );
        }
        return <span style="margin-left: 20px;">{altStr}</span>;
    }

    private formatSpeed(data: FplnLineWaypointDisplayData): VNode {
        let speedStr: VNode = <span>---</span>;
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.speedPrediction === data.speedPrediction
            && !data.hasSpeedConstraint
            && !(FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) || FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine))) {
            speedStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
        } else if (data.speedPrediction !== undefined && data.speedPrediction !== null) {
            speedStr = <span>{data.speedPrediction > 2 ? data.speedPrediction.toFixed(0) : `.${data.speedPrediction.toFixed(2).split('.')[1]}`}</span>;
        }

        if (data.hasSpeedConstraint) {
            if (data.speedConstraintIsRespected) {
                return (
                    <>
                        <span class="mfd-fms-fpln-leg-constraint-respected">*</span>
                        <span>{speedStr}</span>
                    </>
                );
            }
            return (
                <>
                    <span class="mfd-fms-fpln-leg-constraint-missed">*</span>
                    <span>{speedStr}</span>
                </>
            );
        }
        return <span style="margin-left: 20px;">{speedStr}</span>;
    }

    private efobOrSpeed(data: FplnLineWaypointDisplayData): VNode {
        if (this.props.displayEfobAndWind.get() === true) {
            return (data.efobPrediction && this.props.globalLineColor.get() === FplnLineColor.Active) ? <span>{(data.efobPrediction / 1000).toFixed(1)}</span> : <span>--.-</span>;
        }
        return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatSpeed(data) : <span>---</span>;
    }

    private windOrAlt(data: FplnLineWaypointDisplayData): VNode {
        if (this.props.displayEfobAndWind.get() === true) {
            return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatWind(data) : <span>---°/---</span>;
        }
        return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatAltitude(data) : <span>-----</span>;
    }

    private lineConnector(data: FplnLineWaypointDisplayData): VNode {
        if (FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) && FplnLineFlags.BeforeActiveLeg === (this.props.flags.get() & FplnLineFlags.BeforeActiveLeg)) {
            return <></>;
        }
        if (FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) {
            return FplnLineConnectorFirstLineNotBeforeActiveLeg(this.lineColor.get(),
                FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg),
                FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial));
        }
        if (FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial)) {
            const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
                || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
            return FplnLineConnectorNormalNotBeforeActiveLeg(this.lineColor.get(), lastLineOrBeforeSpecial);
        }
        if (FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg)) {
            return FplnLineConnectorActiveLeg(this.lineColor.get());
        }
        if (data.isPseudoWaypoint) {
            const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
                || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
            return FplnLineConnectorPseudoWaypoint(this.lineColor.get(), lastLineOrBeforeSpecial);
        }
        const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
            || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
        return FplnLineConnectorNormal(this.lineColor.get(), lastLineOrBeforeSpecial);
    }

    renderWaypointLine(): VNode {
        return (
            <div
                ref={this.lineRef}
                class={{
                    'mfd-fms-fpln-line': true,
                    'mfd-fms-fpln-line-temporary': this.lineColor.map((it) => it === FplnLineColor.Temporary),
                    'mfd-fms-fpln-line-secondary': this.lineColor.map((it) => it === FplnLineColor.Secondary),
                    'mfd-fms-fpln-line-altn': this.lineColor.map((it) => it === FplnLineColor.Alternate),
                }}
                style={`${FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}
            >
                <div style="width: 25%; display: flex; flex-direction: column;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
                        <div ref={this.annotationRef} class="mfd-fms-fpln-line-annotation" />
                    )}
                    <div ref={this.identRef} class="mfd-fms-fpln-line-ident" />
                </div>
                <div class="mfd-fms-fpln-label-small-clickable" style="width: 11.5%;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && <div class="mfd-fms-fpln-leg-upper-row" />}
                    <div ref={this.timeRef} class="mfd-fms-fpln-leg-lower-row" />

                </div>
                <div class="mfd-fms-fpln-label-small-clickable" style="width: 15%; align-items: flex-start; padding-left: 40px;" onclick={() => this.props.callbacks.speed()}>
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && <div class="mfd-fms-fpln-leg-upper-row" />}
                    <div ref={this.speedRef} class="mfd-fms-fpln-leg-lower-row" />
                </div>
                <div class="mfd-fms-fpln-label-small-clickable" style="width: 21%; align-items: flex-start; padding-left: 20px;" onclick={() => this.props.callbacks.altitude()}>
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && <div class="mfd-fms-fpln-leg-upper-row" />}
                    <div ref={this.altRef} class="mfd-fms-fpln-leg-lower-row" />
                </div>
                <div ref={this.connectorRef} class="mfd-fms-fpln-label-small" style="width: 30px; margin-right: 5px;" />
                <div class="mfd-fms-fpln-label-small" style="width: 9%; align-items: flex-start;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
                        <div ref={this.trackRef} class="mfd-fms-fpln-leg-upper-row" />
                    )}
                    <div class="mfd-fms-fpln-leg-lower-row" />
                </div>
                <div class="mfd-fms-fpln-label-small" style="width: 6%; align-items: flex-end;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
                        <div ref={this.distRef} class="mfd-fms-fpln-leg-upper-row" />
                    )}
                    <div class="mfd-fms-fpln-leg-lower-row" />
                </div>
                <div class="mfd-fms-fpln-label-small" style="width: 8%; align-items: flex-end;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
                        <div ref={this.fpaRef} class="mfd-fms-fpln-leg-upper-row" />
                    )}
                    <div class="mfd-fms-fpln-leg-lower-row" />
                </div>
            </div>
        );
    }

    renderSpecialLine(data: FplnLineSpecialDisplayData) {
        const delimiter = data.label.length > 13 ? '- - - - -' : '- - - - - - ';
        return (
            <div
                ref={this.identRef}
                class="mfd-fms-fpln-line mfd-fms-fpln-line-special"
                style={`font-size: 30px; ${FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}
            >
                {delimiter}
                <span style="margin: 0px 15px 0px 15px;">{data.label}</span>
                {delimiter}
            </div>
        );
    }

    render() {
        const data = this.props.data.get();
        if (isWaypoint(data)) {
            this.currentlyRenderedType = FplnLineType.Waypoint;
            return <div ref={this.topRef}>{this.renderWaypointLine()}</div>;
        }
        if (isSpecial(data)) {
            this.currentlyRenderedType = FplnLineType.Special;
            return <div ref={this.topRef}>{this.renderSpecialLine(data)}</div>;
        }
        if (isHold(data)) {
            this.currentlyRenderedType = FplnLineType.Hold;
            return <div ref={this.topRef}>{this.renderWaypointLine()}</div>;
        }
        return <></>;
    }
}

function FplnLineConnectorFirstLineNotBeforeActiveLeg(lineColor: FplnLineColor, activeLeg: boolean, beforeSpecial: boolean): VNode {
    return (
        <svg height="40" width="30">
            <line x1="15" y1="40" x2="15" y2="30" style={`stroke:${beforeSpecial ? '#000' : lineColor};stroke-width:2`} />
            <line x1="8" y1="18" x2="0" y2="18" style={`stroke:${(activeLeg && lineColor === FplnLineColor.Active) ? '#fff' : lineColor};stroke-width:2`} />
            <g style={`fill:none;stroke:${(activeLeg && lineColor !== FplnLineColor.Temporary) ? '#fff' : lineColor};stroke-width:2`}>
                <polyline
                    points="15,31 8,19 15,5 22,19 15,31"
                />
            </g>
        </svg>
    );
}

function FplnLineConnectorNormal(lineColor: FplnLineColor, lastLine: boolean): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="63" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
            <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
                <line x1="15" y1="0" x2="15" y2="37" />
                <polyline
                    points="15,63 8,51 15,37 22,51 15,63"
                />
                <line x1="8" y1="50" x2="0" y2="50" />
                <line x1="15" y1="10" x2="30" y2="10" />
            </g>
        </svg>
    );
}

function FplnLineConnectorNormalNotBeforeActiveLeg(lineColor: FplnLineColor, lastLine: boolean): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="63" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
            <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
                <polyline
                    points="15,63 8,51 15,37 22,51 15,63"
                />
                <line x1="8" y1="50" x2="0" y2="50" />
            </g>
        </svg>
    );
}

function FplnLineConnectorActiveLeg(lineColor: FplnLineColor): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="62" style={`stroke:${lineColor};stroke-width:2`} />
            <g style={`fill:none;stroke:${lineColor === FplnLineColor.Active ? '#fff' : lineColor};stroke-width:2`}>
                <line x1="15" y1="9" x2="15" y2="37" />
                <polyline
                    points="15,63 8,51 15,37 22,51 15,63"
                />
                <line x1="8" y1="50" x2="0" y2="50" />
                <line x1="15" y1="10" x2="30" y2="10" />
            </g>

        </svg>
    );
}

function FplnLineConnectorPseudoWaypoint(lineColor: FplnLineColor, lastLine: boolean): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="50" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
            <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
                <line x1="15" y1="0" x2="15" y2="50" />
                <line x1="15" y1="50" x2="0" y2="50" />
                <line x1="15" y1="10" x2="30" y2="10" />
            </g>
        </svg>
    );
}

function FplnLineConnectorHold(lineColor: FplnLineColor): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="0" style={`stroke:${lineColor};stroke-width:2`} />
        </svg>
    );
}

import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, NodeReference, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { mockDerivedData, mockFlightPlanLegsData, mockPredictionsData, mockPseudoWaypoints } from 'instruments/src/MFD/dev-data/FlightPlanLegMockData';
import { DerivedFplnLegData, FlightPlanLeg, PseudoWaypoint, WindVector } from 'instruments/src/MFD/dev-data/FlightPlanInterfaceMockup';
import { ContextMenu } from 'instruments/src/MFD/pages/common/ContextMenu';
import { getRevisionsMenu } from 'instruments/src/MFD/pages/FMS/F-PLN/FplnRevisionsMenu';
import { DestinationWindow } from 'instruments/src/MFD/pages/FMS/F-PLN/DestinationWindow';
import { InsertNextWptFromWindow } from 'instruments/src/MFD/pages/FMS/F-PLN/InsertNextWptFrom';

interface MfdFmsFplnProps extends AbstractMfdPageProps {
}

export class MfdFmsFpln extends DisplayComponent<MfdFmsFplnProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private tmpyIsActive = Subject.create<boolean>(false);

    private lineColor = Subject.create<FplnLineColor>(FplnLineColor.Active);

    private flightPlan = { allLegs: mockFlightPlanLegsData };

    private navGeometryProfile = { waypointPredictions: mockPredictionsData };

    private spdAltEfobWindRef = FSComponent.createRef<HTMLDivElement>();

    private displayEfobAndWind = Subject.create<boolean>(false);

    private efobAndWindButtonDynamicContent = Subject.create<VNode>(<span>HELLO</span>);

    private efobAndWindButtonMenuItems = Subject.create<ButtonMenuItem[]>([{ label: '', action: () => null }]);

    private lineData: FplnLineDisplayData[];

    private activeLegIndex: number = 1;

    private derivedFplnLegData: DerivedFplnLegData[] = [];

    private linesDivRef = FSComponent.createRef<HTMLDivElement>();

    private tmpyLineRef = FSComponent.createRef<HTMLDivElement>();

    private displayFplnFromLegIndex = Subject.create<number>(0);

    private disabledScrollDown = Subject.create(true);

    private disabledScrollUp = Subject.create(false);

    private revisionsMenuRef = FSComponent.createRef<ContextMenu>();

    private revisedWaypoint = Subject.create<FlightPlanLeg>(null);

    private revisedWaypointIndex = Subject.create<number>(0);

    private revisionsMenuOpened = Subject.create<boolean>(false);

    private newDestWindowOpened = Subject.create<boolean>(false);

    private insertNextWptWindowOpened = Subject.create<boolean>(false);

    private nextWptAvailableWaypoints = ArraySubject.create<string>(['']) ;

    private update(startAtIndex: number): void {
        this.flightPlan = { allLegs: mockFlightPlanLegsData };
        this.navGeometryProfile = { waypointPredictions: mockPredictionsData };
        if (startAtIndex > this.flightPlan.allLegs.length || startAtIndex < 0) {
            this.displayFplnFromLegIndex.set(0);
            return;
        }

        // Compute rest of required attributes
        this.derivedFplnLegData = [];
        let lastDistanceFromStart = (this.navGeometryProfile.waypointPredictions.length > 0) ? this.navGeometryProfile.waypointPredictions[0].distanceFromStart : 0;
        this.flightPlan.allLegs.forEach((leg, index) => {
            const newEl: DerivedFplnLegData = { distanceFromLastWpt: undefined, trackFromLastWpt: undefined, windPrediction: undefined };
            if (mockDerivedData[index]) {
                // Copy over wind and track, need to find source for that
                newEl.windPrediction = mockDerivedData[index].windPrediction;
                newEl.trackFromLastWpt = mockDerivedData[index].trackFromLastWpt;

                newEl.distanceFromLastWpt = this.navGeometryProfile.waypointPredictions[index].distanceFromStart - lastDistanceFromStart;
            }
            this.derivedFplnLegData.push(newEl);
            if (this.navGeometryProfile.waypointPredictions[index]) {
                lastDistanceFromStart = this.navGeometryProfile.waypointPredictions[index].distanceFromStart;
            }
        });

        while (this.linesDivRef.instance.firstChild) {
            this.linesDivRef.instance.removeChild(this.linesDivRef.instance.firstChild);
        }

        this.lineData = [];

        // Prepare sequencing of pseudo waypoints
        const pseudoWptMap = new Map<number, PseudoWaypoint>();
        mockPseudoWaypoints.forEach((wpt) => pseudoWptMap.set(wpt.alongLegIndex, wpt));

        // Construct leg data for all legs
        for (let i = 0; i < this.flightPlan.allLegs.length; i++) {
            const leg = this.flightPlan.allLegs[i];
            let reduceDistanceBy = 0;

            if (pseudoWptMap.has(i) === true) {
                const pwp = pseudoWptMap.get(i);
                reduceDistanceBy = pwp.flightPlanInfo.distanceFromLastFix;
                const data: FplnLineWaypointDisplayData = {
                    type: FplnLineType.Waypoint,
                    originalLegIndex: null,
                    isPseudoWaypoint: true,
                    ident: pwp.mcduIdent ?? pwp.ident,
                    overfly: false,
                    annotation: pwp.mcduHeader ?? '',
                    etaOrSecondsFromPresent: pwp.flightPlanInfo.secondsFromPresent,
                    transitionAltitude: (leg instanceof FlightPlanLeg) ? (leg.definition.transitionAltitude ?? 18000) : 18000,
                    altitudePrediction: pwp.flightPlanInfo.altitude,
                    hasAltitudeConstraint: false, // TODO
                    altitudeConstraintIsRespected: true,
                    speedPrediction: pwp.flightPlanInfo.speed,
                    hasSpeedConstraint: (pwp.mcduIdent ?? pwp.ident) === '(SPDLIM)',
                    speedConstraintIsRespected: true,
                    efobPrediction: this.navGeometryProfile.waypointPredictions[i].estimatedFuelOnBoard, // TODO
                    windPrediction: this.derivedFplnLegData[i].windPrediction, // TODO
                    trackFromLastWpt: this.derivedFplnLegData[i].trackFromLastWpt, // TODO
                    distFromLastWpt: pwp.flightPlanInfo.distanceFromLastFix,
                    fpa: null,
                };
                this.lineData.push(data);
            }

            if (leg instanceof FlightPlanLeg) {
                const data: FplnLineWaypointDisplayData = {
                    type: FplnLineType.Waypoint,
                    originalLegIndex: i,
                    isPseudoWaypoint: false,
                    ident: leg.ident,
                    overfly: leg.overfly,
                    annotation: leg.annotation,
                    etaOrSecondsFromPresent: this.navGeometryProfile.waypointPredictions[i].secondsFromPresent,
                    transitionAltitude: leg.definition.transitionAltitude ?? 18000,
                    altitudePrediction: this.navGeometryProfile.waypointPredictions[i].altitude,
                    hasAltitudeConstraint: !!this.navGeometryProfile.waypointPredictions[i].altitudeConstraint,
                    altitudeConstraintIsRespected: this.navGeometryProfile.waypointPredictions[i].isAltitudeConstraintMet,
                    speedPrediction: this.navGeometryProfile.waypointPredictions[i].speed,
                    hasSpeedConstraint: !!this.navGeometryProfile.waypointPredictions[i].speedConstraint,
                    speedConstraintIsRespected: this.navGeometryProfile.waypointPredictions[i].isSpeedConstraintMet,
                    efobPrediction: this.navGeometryProfile.waypointPredictions[i].estimatedFuelOnBoard,
                    windPrediction: this.derivedFplnLegData[i].windPrediction,
                    trackFromLastWpt: this.derivedFplnLegData[i].trackFromLastWpt,
                    distFromLastWpt: this.derivedFplnLegData[i].distanceFromLastWpt - reduceDistanceBy,
                    fpa: leg.definition.verticalAngle,
                };
                this.lineData.push(data);
            } else {
                const data: FplnLineSpecialDisplayData = {
                    type: FplnLineType.Special,
                    originalLegIndex: null,
                    label: 'DISCONTINUITY',
                };
                this.lineData.push(data);
            }
        }
        this.lineData.push({
            type: FplnLineType.Special,
            originalLegIndex: null,
            label: 'END OF F-PLN',
        });
        this.lineData.push({
            type: FplnLineType.Special,
            originalLegIndex: null,
            label: 'NO ALTN F-PLN',
        });

        const untilLegIndex = Math.min(this.lineData.length, startAtIndex + (this.tmpyIsActive.get() ? 8 : 9));
        for (let drawIndex = startAtIndex; drawIndex < untilLegIndex; drawIndex++) {
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
            if (lineIndex === (this.tmpyIsActive.get() ? 7 : 8)) {
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
            const node = (
                <FplnLegLine
                    data={Subject.create(this.lineData[drawIndex])} // TODO make subscribable
                    previousRow={Subject.create(previousRow)}
                    openRevisionsMenuCallback={() => this.openRevisionsMenu(lineIndex, this.lineData[drawIndex].originalLegIndex)}
                    flags={Subject.create(flags)}
                    displayEfobAndWind={this.displayEfobAndWind}
                    lineColor={this.lineColor}
                    selectedForRevision={Subject.create(false)}
                    revisionsMenuIsOpened={this.revisionsMenuOpened}
                />
            );
            FSComponent.render(node, this.linesDivRef.instance);
        }
    }

    private openRevisionsMenu(lineIndex: number, originalLegIndex: number) {
        if (this.revisionsMenuOpened.get() === false) {
            const leg = this.flightPlan.allLegs[originalLegIndex];

            if (leg instanceof FlightPlanLeg) {
                this.revisedWaypoint.set(leg);
                this.revisedWaypointIndex.set(originalLegIndex);
                this.revisionsMenuRef.instance.props.values = getRevisionsMenu(this, 'waypoint');
                this.revisionsMenuRef.instance.display(195, 183);
            } else {
                // Find last leg before DISCO which is a proper leg, and revise this leg
                let beforeDiscoIndex = originalLegIndex - 1;
                while (beforeDiscoIndex >= 0) {
                    const beforeLeg = this.flightPlan.allLegs[beforeDiscoIndex];
                    if (beforeLeg instanceof FlightPlanLeg) {
                        this.revisedWaypoint.set(beforeLeg);
                    }
                    beforeDiscoIndex -= 1;
                }
                this.revisionsMenuRef.instance.props.values = getRevisionsMenu(this, 'discontinuity');
                this.revisionsMenuRef.instance.display(195, 183);
            }
        }
    }

    public openNewDestWindow() {
        this.newDestWindowOpened.set(true);
    }

    public openInsertNextWptFromWindow() {
        const wpt = this.flightPlan.allLegs.slice(this.revisedWaypointIndex.get() + 1).map((el) => {
            if (el instanceof FlightPlanLeg) {
                return el.ident;
            }
            return null;
        }).filter((el) => el !== null);
        this.nextWptAvailableWaypoints.set(wpt);
        this.insertNextWptWindowOpened.set(true);
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.activePageTitle.set(`${val.category.toUpperCase()}/F-PLN`);
        }, true));

        this.subs.push(this.displayEfobAndWind.sub((val) => {
            this.efobAndWindButtonDynamicContent.set(val === true ? this.efobWindButton() : this.spdAltButton());
            this.efobAndWindButtonMenuItems.set([{
                action: () => this.displayEfobAndWind.set(!this.displayEfobAndWind.get()),
                label: this.displayEfobAndWind.get() === true ? 'SPD&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ALT' : 'EFOB&nbsp;&nbsp;&nbsp;&nbsp;T.WIND',
            }]);
        }, true));

        this.subs.push(this.displayFplnFromLegIndex.sub((val) => {
            this.update(val);

            this.disabledScrollUp.set(!this.lineData || val <= 0);
            this.disabledScrollDown.set(!this.lineData || val >= this.lineData.length - (this.tmpyIsActive.get() ? 8 : 9));
        }, true));

        this.subs.push(this.tmpyIsActive.sub((val) => {
            if (val === true) {
                this.lineColor.set(FplnLineColor.Temporary);
                this.tmpyLineRef.instance.style.display = 'flex';
            } else {
                this.lineColor.set(FplnLineColor.Active);
                this.tmpyLineRef.instance.style.display = 'none';
            }
            this.update(this.displayFplnFromLegIndex.get());
        }, true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
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

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="mfd-page-container">
                    <ContextMenu
                        ref={this.revisionsMenuRef}
                        idPrefix="revisionsMenu"
                        values={getRevisionsMenu(this, 'waypoint')}
                        opened={this.revisionsMenuOpened}
                    />
                    <DestinationWindow
                        revisedWaypoint={this.revisedWaypoint}
                        visible={this.newDestWindowOpened}
                        cancelAction={() => this.newDestWindowOpened.set(false)}
                        confirmAction={(newDest) => {
                            console.log(`New DEST: ${newDest}`);
                            this.tmpyIsActive.set(true);
                            this.newDestWindowOpened.set(false);
                        }}
                    />
                    <InsertNextWptFromWindow
                        revisedWaypoint={this.revisedWaypoint}
                        availableWaypoints={this.nextWptAvailableWaypoints}
                        visible={this.insertNextWptWindowOpened}
                        cancelAction={() => this.insertNextWptWindowOpened.set(false)}
                        confirmAction={() => {
                            this.tmpyIsActive.set(true);
                            this.insertNextWptWindowOpened.set(false);
                        }}
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
                                onClick={() => null}
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
                            onClick={() => this.tmpyIsActive.set(false)}
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
                            onClick={() => this.tmpyIsActive.set(false)}
                            buttonStyle="color: #e68000; padding-right: 2px;"
                        />
                    </div>
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div class="mfd-fms-fpln-line-destination">
                        <Button
                            label="LFPG26R"
                            onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-departure`)}
                            buttonStyle="font-size: 30px; width: 150px; margin-right: 5px;"
                        />
                        <span class="mfd-label">20:08</span>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label">74.5</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label">6009</span>
                            <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                        </div>
                        <div style="display: flex; flex-direction: row; margin-top: 5px; margin-bottom: 5px;">
                            <IconButton
                                icon="double-down"
                                onClick={() => this.displayFplnFromLegIndex.set(this.displayFplnFromLegIndex.get() + 1)}
                                disabled={this.disabledScrollDown}
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <IconButton
                                icon="double-up"
                                onClick={() => this.displayFplnFromLegIndex.set(this.displayFplnFromLegIndex.get() - 1)}
                                disabled={this.disabledScrollUp}
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <Button
                                label="DEST"
                                onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln-arrival`)}
                                buttonStyle="height: 60px; margin-right: 5px; padding: auto 15px auto 15px;"
                            />
                        </div>
                    </div>
                    <div class="mfd-fms-fpln-footer">
                        <Button label="INIT" onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/init`)} buttonStyle="width: 125px;" />
                        <Button
                            label="F-PLN INFO"
                            onClick={() => null}
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
                                action: () => null,
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
                <Footer bus={this.props.bus} uiService={this.props.uiService} />
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
    Secondary = '#ffffff'
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
    ident: string;
    overfly: boolean;
    annotation: string;
    etaOrSecondsFromPresent: number; // depending on flight phase, before takeoff secondsFromPresent, thereafter eta (in seconds, printed as HH:mm)
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

type FplnLineDisplayData = FplnLineWaypointDisplayData | FplnLineSpecialDisplayData;

function isWaypoint(object: FplnLineDisplayData): object is FplnLineWaypointDisplayData {
    return object.type === FplnLineType.Waypoint;
}

function isSpecial(object: FplnLineDisplayData): object is FplnLineWaypointDisplayData {
    return object.type === FplnLineType.Special;
}

export interface FplnLegLineProps extends FplnLineCommonProps {
    previousRow: Subscribable<FplnLineDisplayData | null>;
    data: Subscribable<FplnLineDisplayData>;
    flags: Subscribable<FplnLineFlags>;
    displayEfobAndWind: Subscribable<boolean>;
    lineColor: Subscribable<FplnLineColor>;
    selectedForRevision: Subject<boolean>;
    revisionsMenuIsOpened: Subject<boolean>;
}

class FplnLegLine extends DisplayComponent<FplnLegLineProps> {
    // Make sure to collect all subscriptions here, so we can properly destroy them.
    private subs = [] as Subscription[];

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

        this.subs.push(this.props.selectedForRevision.sub((val) => {
            if (val === true) {
                this.identRef.getOrDefault().classList.add('selected');
            } else {
                this.identRef.getOrDefault().classList.remove('selected');
            }
        }));

        this.subs.push(this.props.revisionsMenuIsOpened.sub((val) => {
            if (val === false) {
                this.props.selectedForRevision.set(false);
                this.identRef.getOrDefault().classList.remove('selected');
            }
        }));

        this.identRef.instance.addEventListener('click', () => {
            this.props.openRevisionsMenuCallback();
            this.props.selectedForRevision.set(true);
        });
    }

    private onNewData(data: FplnLineDisplayData): void {
        if (isWaypoint(data)) {
            if (this.currentlyRenderedType !== FplnLineType.Waypoint) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderWaypointLine(), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineType.Special;
            }

            // TODO: Hold/turn direction
            if (data.overfly === true) {
                this.identRef.getOrDefault().innerHTML = `<span>${data.ident}<span style="font-size: 24px; vertical-align: baseline;">@</span></span>`;
            } else {
                this.identRef.getOrDefault().innerText = data.ident;
            }

            // TODO: Hold/turn direction
            if (this.annotationRef.getOrDefault()) {
                this.annotationRef.getOrDefault().innerText = data.annotation;
            }

            // Format time to leg
            // TODO: Time constraint, "HOLD SPD" label
            if (data.etaOrSecondsFromPresent) {
                const minutesTotal = data.etaOrSecondsFromPresent / 60;
                const hours = Math.abs(Math.floor(minutesTotal / 60)).toFixed(0).toString().padStart(2, '0');
                const minutes = Math.abs(minutesTotal % 60).toFixed(0).toString().padStart(2, '0');
                this.timeRef.getOrDefault().innerText = `${hours}:${minutes}`;
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
        }
    }

    private renderSpdAltEfobWind(data: FplnLineWaypointDisplayData): void {
        while (this.speedRef.instance.firstChild) {
            this.speedRef.instance.removeChild(this.speedRef.instance.firstChild);
        }
        while (this.altRef.instance.firstChild) {
            this.altRef.instance.removeChild(this.altRef.instance.firstChild);
        }
        FSComponent.render(this.efobOrSpeed(data), this.speedRef.instance);
        FSComponent.render(this.windOrAlt(data), this.altRef.instance);

        if (this.props.displayEfobAndWind.get() === true) {
            this.altRef.instance.style.alignSelf = 'flex-end';
            this.altRef.instance.style.paddingRight = '20px';
            this.speedRef.instance.parentElement.className = 'mfd-fms-fpln-label-small';
            this.speedRef.instance.style.paddingLeft = '10px';
        } else {
            this.altRef.instance.style.alignSelf = null;
            this.altRef.instance.style.paddingRight = null;
            this.speedRef.instance.parentElement.className = 'mfd-fms-fpln-label-small-clickable';
            this.speedRef.instance.style.paddingLeft = null;
        }
    }

    private formatWind(data: FplnLineWaypointDisplayData): VNode {
        let directionStr = '';
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.windPrediction.direction === data.windPrediction.direction
            && !(FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) || FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine))) {
            directionStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
        } else {
            directionStr = <span>{data.windPrediction.direction.toFixed(0).toString().padStart(3, '0')}</span>;
        }

        let speedStr = '';
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
        let altStr: VNode = <></>;
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
        let speedStr: VNode = <></>;
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.speedPrediction === data.speedPrediction
            && !data.hasSpeedConstraint
            && !(FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) || FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine))) {
            speedStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
        } else {
            speedStr = <span>{data.speedPrediction > 2 ? data.speedPrediction.toString() : `.${data.speedPrediction.toFixed(2).split('.')[1]}`}</span>;
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
            return <span>{data.efobPrediction.toFixed(1).toString()}</span>;
        }
        return this.formatSpeed(data);
    }

    private windOrAlt(data: FplnLineWaypointDisplayData): VNode {
        if (this.props.displayEfobAndWind.get() === true) {
            return this.formatWind(data);
        }
        return this.formatAltitude(data);
    }

    private lineConnector(data: FplnLineWaypointDisplayData): VNode {
        if (FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) && FplnLineFlags.BeforeActiveLeg === (this.props.flags.get() & FplnLineFlags.BeforeActiveLeg)) {
            return <></>;
        }
        if (FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) {
            return FplnLineConnectorFirstLineNotBeforeActiveLeg(this.props.lineColor.get(),
                FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg),
                FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial));
        }
        if (FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial)) {
            const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
            || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
            return FplnLineConnectorNormalNotBeforeActiveLeg(this.props.lineColor.get(), lastLineOrBeforeSpecial);
        }
        if (FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg)) {
            return FplnLineConnectorActiveLeg(this.props.lineColor.get());
        }
        if (data.isPseudoWaypoint) {
            const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
            || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
            return FplnLineConnectorPseudoWaypoint(this.props.lineColor.get(), lastLineOrBeforeSpecial);
        }
        const lastLineOrBeforeSpecial = FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine)
            || FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
        return FplnLineConnectorNormal(this.props.lineColor.get(), lastLineOrBeforeSpecial);
    }

    renderWaypointLine(): VNode {
        return (
            <div
                ref={this.lineRef}
                class={{
                    'mfd-fms-fpln-line': true,
                    'mfd-fms-fpln-line-temporary': this.props.lineColor.map((it) => it === FplnLineColor.Temporary),
                    'mfd-fms-fpln-line-secondary': this.props.lineColor.map((it) => it === FplnLineColor.Secondary),
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
                <div class="mfd-fms-fpln-label-small-clickable" style="width: 15%; align-items: flex-start; padding-left: 40px;">
                    {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && <div class="mfd-fms-fpln-leg-upper-row" />}
                    <div ref={this.speedRef} class="mfd-fms-fpln-leg-lower-row" />
                </div>
                <div class="mfd-fms-fpln-label-small-clickable" style="width: 21%; align-items: flex-start; padding-left: 20px;">
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

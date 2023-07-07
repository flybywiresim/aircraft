/* eslint-disable jsx-a11y/label-has-associated-control */

import { ComponentProps, DisplayComponent, FSComponent, NodeReference, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TriangleDown, TriangleUp } from 'instruments/src/MFD/pages/common/shapes';
import { derivedMockData, flightPlanLegsMockData, predictionsMockData } from 'instruments/src/MFD/dev-data/FlightPlanLegMockData';
import { DerivedFplnLegData, FlightPlanLeg, WindVector } from 'instruments/src/MFD/dev-data/FlightPlanInterfaceMockup';

interface MfdFmsFplnProps extends MfdComponentProps {
    instrument: BaseInstrument;
}

export class MfdFmsFpln extends DisplayComponent<MfdFmsFplnProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private tmpyIsActive = Subject.create<boolean>(false);

    private flightPlan = { allLegs: flightPlanLegsMockData };

    private navGeometryProfile = { waypointPredictions: predictionsMockData };

    private spdAltEfobWindRef = FSComponent.createRef<HTMLDivElement>();

    private displayEfobAndWind = Subject.create<boolean>(false);

    private efobAndWindButtonDynamicContent = Subject.create<VNode>(<span>HELLO</span>);

    private efobAndWindButtonMenuItems = Subject.create<ButtonMenuItem[]>([]);

    // Only legs to be displayed, i.e. max. 9
    private lineData: FplnLineDisplayData[];

    private activeLegIndex: number = 1;

    private derivedFplnLegData: DerivedFplnLegData[] = [];

    private linesRef = FSComponent.createRef<HTMLDivElement>();

    private displayFplnFromLegIndex = Subject.create<number>(0);

    private update(startAtIndex: number): void {
        this.flightPlan = { allLegs: flightPlanLegsMockData };
        this.navGeometryProfile = { waypointPredictions: predictionsMockData };
        if (startAtIndex > this.flightPlan.allLegs.length || startAtIndex < 0) {
            this.displayFplnFromLegIndex.set(0);
            return;
        }

        // Compute rest of required attributes
        this.derivedFplnLegData = [];
        let lastDistanceFromStart = (this.navGeometryProfile.waypointPredictions.length > 0) ? this.navGeometryProfile.waypointPredictions[0].distanceFromStart : 0;
        this.flightPlan.allLegs.forEach((leg, index) => {
            const newEl: DerivedFplnLegData = { distanceFromLastWpt: undefined, trackFromLastWpt: undefined, windPrediction: undefined };
            if (derivedMockData[index]) {
                // Copy over wind and track, need to find source for that
                newEl.windPrediction = derivedMockData[index].windPrediction;
                newEl.trackFromLastWpt = derivedMockData[index].trackFromLastWpt;

                newEl.distanceFromLastWpt = this.navGeometryProfile.waypointPredictions[index].distanceFromStart - lastDistanceFromStart;
            }
            this.derivedFplnLegData.push(newEl);
            if (this.navGeometryProfile.waypointPredictions[index]) {
                lastDistanceFromStart = this.navGeometryProfile.waypointPredictions[index].distanceFromStart;
            }
        });

        while (this.linesRef.instance.firstChild) {
            this.linesRef.instance.removeChild(this.linesRef.instance.firstChild);
        }

        this.lineData = [];

        for (let drawIndex = startAtIndex; drawIndex < Math.min(this.flightPlan.allLegs.length, startAtIndex + 9); drawIndex++) {
            const lineIndex = drawIndex - startAtIndex;
            const leg = this.flightPlan.allLegs[drawIndex];

            let node: VNode;
            const previousRow = (drawIndex > 0) ? this.lineData[lineIndex - 1] : null;
            if (leg instanceof FlightPlanLeg) {
                const data: FplnLineWaypointDisplayData = {
                    type: FplnLineTypes.Waypoint,
                    isPseudoWaypoint: leg.ident.startsWith('('),
                    ident: leg.ident,
                    annotation: leg.annotation,
                    etaOrSecondsFromPresent: this.navGeometryProfile.waypointPredictions[drawIndex].secondsFromPresent,
                    transitionAltitude: leg.definition.transitionAltitude ?? 18000,
                    altitudePrediction: this.navGeometryProfile.waypointPredictions[drawIndex].altitude,
                    hasAltitudeConstraint: !!this.navGeometryProfile.waypointPredictions[drawIndex].altitudeConstraint,
                    altitudeConstraintIsRespected: this.navGeometryProfile.waypointPredictions[drawIndex].isAltitudeConstraintMet,
                    speedPrediction: this.navGeometryProfile.waypointPredictions[drawIndex].speed,
                    hasSpeedConstraint: !!this.navGeometryProfile.waypointPredictions[drawIndex].speedConstraint,
                    speedConstraintIsRespected: this.navGeometryProfile.waypointPredictions[drawIndex].isSpeedConstraintMet,
                    efobPrediction: this.navGeometryProfile.waypointPredictions[drawIndex].estimatedFuelOnBoard,
                    windPrediction: this.derivedFplnLegData[drawIndex].windPrediction,
                    trackFromLastWpt: this.derivedFplnLegData[drawIndex].trackFromLastWpt,
                    distFromLastWpt: this.derivedFplnLegData[drawIndex].distanceFromLastWpt,
                    fpa: null,
                };
                this.lineData.push(data);

                node = (
                    <FplnLegLine
                        data={Subject.create(data)} // TODO make subscribable
                        previousRow={Subject.create(previousRow)}
                        openRevisionsMenuCallback={() => this.openRevisionsMenu(lineIndex, drawIndex, false)}
                        firstLine={drawIndex === startAtIndex}
                        lastLine={drawIndex === startAtIndex + (this.tmpyIsActive.get() ? 7 : 8)}
                        activeLeg={Subject.create(drawIndex === this.activeLegIndex)}
                        displayEfobAndWind={this.displayEfobAndWind}
                    />
                );
            } else {
                const data: FplnLineSpecialDisplayData = {
                    type: FplnLineTypes.Special,
                    label: 'DISCONTINUITY',
                };
                this.lineData.push(data);

                node = (
                    <FplnLegLine
                        data={Subject.create(data)}
                        previousRow={Subject.create(previousRow)}
                        openRevisionsMenuCallback={() => this.openRevisionsMenu(lineIndex, drawIndex, false)}
                        firstLine={drawIndex === startAtIndex}
                        lastLine={drawIndex === startAtIndex + (this.tmpyIsActive.get() ? 7 : 8)}
                        activeLeg={Subject.create(drawIndex === this.activeLegIndex)}
                        displayEfobAndWind={this.displayEfobAndWind}
                    />
                );
            }
            FSComponent.render(node, this.linesRef.instance);
        }
    }

    private openRevisionsMenu(lineIndex: number, legIndex: number, isPseudoWaypoint: boolean) {
        console.log(`Open revisions menu at line ${lineIndex}, leg ${legIndex}, isPWP ${isPseudoWaypoint}`);
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/F-PLN');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/F-PLN');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/F-PLN');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/F-PLN');
                break;

            default:
                this.activePageTitle.set('ACTIVE/F-PLN');
                break;
            }
        }, true));

        this.subs.push(this.displayEfobAndWind.sub((val) => {
            this.efobAndWindButtonDynamicContent.set(val === true ? this.efobWindButton() : this.spdAltButton());
            // console.log(val === true ? this.efobWindButton : this.spdAltButton);
            this.efobAndWindButtonMenuItems.set([{
                action: () => this.displayEfobAndWind.set(!this.displayEfobAndWind.get()),
                label: this.displayEfobAndWind.get() === true ? 'SPD&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ALT' : 'EFOB&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;T.WIND',
            }]);
        }, true));

        this.subs.push(this.displayFplnFromLegIndex.sub((val) => this.update(val), true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    private spdAltButton(): VNode {
        return (
            <div style="flex: 1; display: flex; flex-direction: row; justify-content: space-between;">
                <span style="text-align: center; vertical-align: center; padding-left: 10px;">
                    SPD
                </span>
                <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                    ALT
                </span>
                <span style="display: flex; align-items: center; justify-content: center;"><TriangleDown /></span>
            </div>
        );
    }

    private efobWindButton(): VNode {
        return (
            <div style="flex: 1; display: flex; flex-direction: row; justify-content: space-between;">
                <span style="text-align: center; vertical-align: center;">
                    EFOB
                </span>
                <span style="text-align: center; vertical-align: center; margin-left: 40px;">
                    T.WIND
                </span>
                <span style="display: flex; align-items: center; justify-content: center;"><TriangleDown /></span>
            </div>
        );
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer">
                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 5px; border-bottom: 1px solid lightgrey;">
                        <div style="display: flex; width: 25%; justify-content: flex-start; align-items: center; padding-left: 3px;">
                            <span class="MFDLabel">FROM</span>
                        </div>
                        <div style="display: flex; width: 11.5%; justify-content: center; align-items: center;">
                            <span class="MFDLabel">TIME</span>
                        </div>
                        <div ref={this.spdAltEfobWindRef} style="display: flex; width: 40.5%; justify-content: center; align-items: center; padding-bottom: 2px;">
                            <Button
                                label={this.efobAndWindButtonDynamicContent}
                                onClick={() => null}
                                buttonStyle="margin-right: 5px; width: 270px; height: 43px;"
                                idPrefix="efobtwindbtn"
                                menuItems={this.efobAndWindButtonMenuItems}
                            />
                        </div>
                        <div style="display: flex; width: 7%; justify-content: center; align-items: center;">
                            <span class="MFDLabel">TRK</span>
                        </div>
                        <div style="display: flex; width: 8%; justify-content: flex-end; align-items: center;">
                            <span class="MFDLabel">DIST</span>
                        </div>
                        <div style="display: flex; width: 6%; justify-content: flex-end; align-items: center;">
                            <span class="MFDLabel">FPA</span>
                        </div>
                    </div>
                    <div ref={this.linesRef} />
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid lightgrey;">
                        <Button
                            label="LFPG26R"
                            onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln-dep`)}
                            buttonStyle="font-size: 30px; width: 150px; margin-right: 5px;"
                        />
                        <span class="MFDLabel">20:08</span>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel">74.5</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel">6009</span>
                            <span class="MFDUnitLabel trailingUnit">NM</span>
                        </div>
                        <div style="display: flex; flex-direction: row; margin-top: 5px; margin-bottom: 5px;">
                            <IconButton
                                icon="double-down"
                                onClick={() => this.displayFplnFromLegIndex.set(this.displayFplnFromLegIndex.get() + 1)}
                                disabled={Subject.create(false)} // TODO
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <IconButton
                                icon="double-up"
                                onClick={() => this.displayFplnFromLegIndex.set(this.displayFplnFromLegIndex.get() - 1)}
                                disabled={Subject.create(false)} // TODO
                                containerStyle="width: 60px; height: 60px;"
                            />
                            <Button
                                label="DEST"
                                onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln-arrival`)}
                                buttonStyle="height: 60px; margin-right: 5px; padding: auto 15px auto 15px;"
                            />
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 0px 0px 5px 0px; border-top: 1px solid lightgrey; padding-top: 10px;">
                        <Button label="INIT" onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/init`)} buttonStyle="width: 125px;" />
                        <Button
                            label={Subject.create(
                                <div style="flex: 1; display: flex; flex-direction: row; justify-content: space-between;">
                                    <span style="text-align: center; vertical-align: center; padding-left: 5px; padding-right: 10px;">
                                        F-PLN INFO
                                    </span>
                                    <span style="display: flex; align-items: center; justify-content: center;"><TriangleUp /></span>
                                </div>,
                            )}
                            onClick={() => console.log('F_PLN INFO')}
                            buttonStyle="padding-right: 5px;"
                        />
                        <Button label="DIR TO" onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln/direct-to`)} buttonStyle="margin-right: 5px;" />
                    </div>
                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

interface FplnLineCommonProps extends ComponentProps {
    openRevisionsMenuCallback: (index: number) => void;
}

enum FplnLineTypes {
    Waypoint,
    Special,
  }
interface FplnLineTypeDiscriminator {
    /*
     * waypoint: Regular or pseudo waypoints
     * special: DISCONTINUITY, END OF F-PLN etc.
     */
    type: FplnLineTypes;
}

// Type for DISCO, END OF F-PLN etc.
interface FplnLineSpecialDisplayData extends FplnLineTypeDiscriminator {
    label: string;
}

export interface FplnLineWaypointDisplayData extends FplnLineTypeDiscriminator {
    isPseudoWaypoint: boolean;
    ident: string;
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
    return object.type === FplnLineTypes.Waypoint;
}

function isSpecial(object: FplnLineDisplayData): object is FplnLineWaypointDisplayData {
    return object.type === FplnLineTypes.Special;
}

interface FplnLegLineProps extends FplnLineCommonProps {
    previousRow: Subscribable<FplnLineDisplayData | null>;
    data: Subscribable<FplnLineDisplayData>;
    firstLine: boolean;
    lastLine: boolean;
    activeLeg: Subscribable<boolean>;
    displayEfobAndWind: Subscribable<boolean>;
}
// TODO TMPY fplns (all yellow)
// TODO SEC fplns (all white)
// TODO leg ident of active leg = Green
// TODO pseudo waypoint line
// TODO handle connector and upper line before and after DISCO/special line

class FplnLegLine extends DisplayComponent<FplnLegLineProps> {
    // Make sure to collect all subscriptions here, so we can properly destroy them.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private currentlyRenderedType: FplnLineTypes;

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

        this.subs.push(this.props.activeLeg.sub((val) => {
            if (val === true) {
                this.allRefs.forEach((ref) => (ref.getOrDefault() ? ref.getOrDefault().classList.add('MFDFplnActiveLeg') : null));
            } else {
                this.allRefs.forEach((ref) => (ref.getOrDefault() ? ref.getOrDefault().classList.remove('MFDFplnActiveLeg') : null));
            }
        }, true));

        this.subs.push(this.props.displayEfobAndWind.sub(() => {
            const data = this.props.data.get();
            if (isWaypoint(data)) {
                this.renderSpdAltEfobWind(data);
            }
        }, true));

        this.subs.push(this.props.data.sub((data) => this.onNewData(data), true));
    }

    private onNewData(data: FplnLineDisplayData): void {
        if (isWaypoint(data)) {
            if (this.currentlyRenderedType !== FplnLineTypes.Waypoint) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderWaypointLine(), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineTypes.Special;
            }
            this.identRef.getOrDefault().innerText = data.ident;

            if (this.annotationRef.getOrDefault()) {
                this.annotationRef.getOrDefault().innerText = data.annotation;
            }

            // Format time to leg
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

            if (this.trackRef.getOrDefault() && this.distRef.getOrDefault() && this.fpaRef.getOrDefault()) {
                this.trackRef.getOrDefault().innerText = data.trackFromLastWpt ? `${data.trackFromLastWpt.toFixed(0)}°` : '';
                this.distRef.getOrDefault().innerText = data.distFromLastWpt.toFixed(0);
                this.fpaRef.getOrDefault().innerText = data.fpa ? data.fpa.toFixed(1) : '';
            }
        } else if (isSpecial(data)) {
            if (this.currentlyRenderedType !== FplnLineTypes.Special) {
                while (this.topRef.getOrDefault().firstChild) {
                    this.topRef.getOrDefault().removeChild(this.topRef.getOrDefault().firstChild);
                }
                FSComponent.render(this.renderSpecialLine(data), this.topRef.getOrDefault());
                this.currentlyRenderedType = FplnLineTypes.Special;
            }
            this.identRef.getOrDefault().innerText = data.label;
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
            this.speedRef.instance.parentElement.className = 'MFDFplnSmallLabel';
        } else {
            this.altRef.instance.style.alignSelf = null;
            this.altRef.instance.style.paddingRight = null;
            this.speedRef.instance.parentElement.className = 'MFDFplnClickableSmallLabel';
        }
    }

    private formatWind(data: FplnLineWaypointDisplayData): VNode {
        let directionStr = '';
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.windPrediction.direction === data.windPrediction.direction) {
            directionStr = ':';
        } else {
            directionStr = data.windPrediction.direction.toFixed(0).toString().padStart(3, '0');
        }

        let speedStr = '';
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.windPrediction.speed === data.windPrediction.speed) {
            speedStr = ':';
        } else {
            speedStr = data.windPrediction.speed.toFixed(0).toString().padStart(3, '0');
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
        let altStr = '';
        const previousRow = this.props.previousRow.get();
        if (data.altitudePrediction) {
            if (previousRow
                && isWaypoint(previousRow)
                && previousRow.altitudePrediction === data.altitudePrediction
                && !data.hasAltitudeConstraint
                && !this.props.firstLine) {
                altStr = ':';
            } else if (data.altitudePrediction > (data.transitionAltitude ?? 18000)) {
                altStr = `FL${Math.round(data.altitudePrediction / 100).toString()}`;
            } else {
                altStr = data.altitudePrediction.toFixed(0);
            }
        }
        if (data.hasAltitudeConstraint) {
            if (data.altitudeConstraintIsRespected) {
                return (
                    <>
                        <span class="MFDFplnConstraintRespected">*</span>
                        <span>{altStr}</span>
                    </>
                );
            }
            return (
                <>
                    <span class="MFDFplnConstraintMissed">*</span>
                    <span>{altStr}</span>
                </>
            );
        }
        return <span style="margin-left: 20px;">{altStr.toString()}</span>;
    }

    private formatSpeed(data: FplnLineWaypointDisplayData): VNode {
        let speedStr = '';
        const previousRow = this.props.previousRow.get();
        if (previousRow
            && isWaypoint(previousRow)
            && previousRow.speedPrediction === data.speedPrediction
            && !data.hasSpeedConstraint
            && !this.props.firstLine) {
            speedStr = ':';
        } else {
            speedStr = data.speedPrediction.toString();
        }
        if (data.hasSpeedConstraint) {
            if (data.speedConstraintIsRespected) {
                return (
                    <>
                        <span class="MFDFplnConstraintRespected">*</span>
                        <span>{speedStr}</span>
                    </>
                );
            }
            return (
                <>
                    <span class="MFDFplnConstraintMissed">*</span>
                    <span>{speedStr}</span>
                </>
            );
        }
        return <span style="margin-left: 20px;">{speedStr.toString()}</span>;
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
        if (this.props.firstLine) {
            return <></>;
        }
        if (this.props.activeLeg.get()) {
            return FplnLineConnectorActiveLeg();
        }
        if (data.isPseudoWaypoint) {
            return FplnLineConnectorPseudoWaypoint(this.props.lastLine);
        }
        return FplnLineConnectorNormal(this.props.lastLine);
    }

    renderWaypointLine(): VNode {
        return (
            <div class="MFDFplnLine" style={`${this.props.firstLine ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}>
                <div style="width: 25%; display: flex; flex-direction: column; ">
                    {!this.props.firstLine && (
                        <div ref={this.annotationRef} class="MFDFplnLineAnnotation" />
                    )}
                    <div ref={this.identRef} class="MFDFplnLineIdent" />
                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 11.5%;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.timeRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;" />

                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 15%; align-items: flex-start; padding-left: 30px;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.speedRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;" />
                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 22.5%; align-items: flex-start; padding-left: 10px;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.altRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;" />
                </div>
                <div ref={this.connectorRef} class="MFDFplnSmallLabel" style="width: 30px; margin-right: 5px;" />
                <div class="MFDFplnSmallLabel" style="width: 8%; align-items: flex-start;">
                    {!this.props.firstLine && (
                        <div ref={this.trackRef} class="MFDFplnLegUpperRow" />
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
                <div class="MFDFplnSmallLabel" style="width: 6%; align-items: flex-end;">
                    {!this.props.firstLine && (
                        <div ref={this.distRef} class="MFDFplnLegUpperRow" style="text-align: right;" />
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
                <div class="MFDFplnSmallLabel" style="width: 6%; align-items: flex-end;">
                    {!this.props.firstLine && (
                        <div ref={this.fpaRef} class="MFDFplnLegUpperRow" />
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
            </div>
        );
    }

    renderSpecialLine(data: FplnLineSpecialDisplayData) {
        return (
            <div class="MFDFplnLine MFDFplnSpecialLine" style={`font-size: 30px; ${this.props.firstLine ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}>
                - - - - - -
                <span ref={this.identRef} style="margin: 0px 15px 0px 15px;">{data.label}</span>
                - - - - - -
            </div>
        );
    }

    render() {
        const data = this.props.data.get();
        if (isWaypoint(data)) {
            this.currentlyRenderedType = FplnLineTypes.Waypoint;
            return <div ref={this.topRef}>{this.renderWaypointLine()}</div>;
        }
        if (isSpecial(data)) {
            this.currentlyRenderedType = FplnLineTypes.Special;
            return <div ref={this.topRef}>{this.renderSpecialLine(data)}</div>;
        }
        return <></>;
    }
}

function FplnLineConnectorNormal(lastLine: boolean): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="63" style={`stroke:${lastLine ? '#000' : '#00ff00'};stroke-width:2`} />
            <g style="fill:none;stroke:#00ff00;stroke-width:2">
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

function FplnLineConnectorActiveLeg(): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="62" style="fill:none;stroke:#00ff00;stroke-width:2" />
            <g style="fill:none;stroke:#ffffff;stroke-width:2">
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

function FplnLineConnectorPseudoWaypoint(lastLine: boolean): VNode {
    return (
        <svg height="72" width="30">
            <line x1="15" y1="72" x2="15" y2="50" style={`stroke:${lastLine ? '#000' : '#00ff00'};stroke-width:2`} />
            <g style="fill:none;stroke:#00ff00;stroke-width:2">
                <line x1="15" y1="0" x2="15" y2="50" />
                <line x1="15" y1="50" x2="0" y2="50" />
                <line x1="15" y1="10" x2="30" y2="10" />
            </g>
        </svg>
    );
}

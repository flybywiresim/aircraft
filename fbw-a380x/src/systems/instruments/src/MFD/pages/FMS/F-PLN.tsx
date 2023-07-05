/* eslint-disable jsx-a11y/label-has-associated-control */

import { ComponentProps, DisplayComponent, FSComponent, NodeReference, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TriangleDown, TriangleUp } from 'instruments/src/MFD/pages/common/shapes';
import { derivedMockData, flightPlanLegsMockData, predictionsMockData } from 'instruments/src/MFD/dev-data/FlightPlanLegMockData';
import { DerivedFplnLegData, FlightPlanLeg, VerticalWaypointPrediction } from 'instruments/src/MFD/dev-data/FlightPlanInterfaceMockup';

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
    // private flightPlanLegs: FlightPlanLeg[] = [];

    private activeLegIndex: number = 1;

    // Only predictions for legs to be displayed, i.e. max. 9
    // private verticalWaypointPredictions: VerticalWaypointPrediction[] = [];

    private derivedFplnLegData: DerivedFplnLegData[] = [];

    private linesRef = FSComponent.createRef<HTMLDivElement>();

    private displayFplnFromLegIndex = Subject.create<number>(0);

    private update(startAtIndex: number): void {
        console.log(this.displayFplnFromLegIndex.get());
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
            // Copy over wind and track, need to find source for that
            const newEl: DerivedFplnLegData = { distanceFromLastWpt: undefined, trackFromLastWpt: undefined, windPrediction: undefined };
            newEl.windPrediction = derivedMockData[index].windPrediction;
            newEl.trackFromLastWpt = derivedMockData[index].trackFromLastWpt;

            newEl.distanceFromLastWpt = this.navGeometryProfile.waypointPredictions[index].distanceFromStart - lastDistanceFromStart;
            this.derivedFplnLegData.push(newEl);
            lastDistanceFromStart = this.navGeometryProfile.waypointPredictions[index].distanceFromStart;
        });

        while (this.linesRef.instance.firstChild) {
            this.linesRef.instance.removeChild(this.linesRef.instance.firstChild);
        }

        for (let drawIndex = startAtIndex; drawIndex < Math.min(this.flightPlan.allLegs.length, startAtIndex + 9); drawIndex++) {
            let previousRow: FplnLineFmgcData | null;
            if (drawIndex > 0) {
                previousRow = {
                    flightPlanLeg: this.flightPlan.allLegs[drawIndex - 1],
                    verticalWptPrediction: this.navGeometryProfile.waypointPredictions[drawIndex - 1],
                    derivedFplnLegData: this.derivedFplnLegData[drawIndex - 1],
                };
            } else {
                previousRow = null;
            }
            const node = (
                <FplnLegLine
                    previousRow={previousRow}
                    flightPlanLeg={this.flightPlan.allLegs[drawIndex]}
                    verticalWptPrediction={this.navGeometryProfile.waypointPredictions[drawIndex]}
                    derivedFplnLegData={this.derivedFplnLegData[drawIndex]}
                    openRevisionsMenuCallback={() => {}}
                    firstLine={drawIndex === startAtIndex}
                    lastLine={drawIndex === startAtIndex + (this.tmpyIsActive.get() ? 7 : 8)}
                    activeLeg={Subject.create(drawIndex === this.activeLegIndex)}
                    pseudoWaypoint={this.flightPlan.allLegs[drawIndex].ident.startsWith('(')}
                    displayEfobAndWind={this.displayEfobAndWind}
                />
            );
            FSComponent.render(node, this.linesRef.instance);
        }
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

export type FplnLine = FplnLegLine | FplnSpecialLine;

interface FplnLineCommonProps extends ComponentProps {
    openRevisionsMenuCallback: (index: number) => void;
}
interface FplnLineFmgcData {
    flightPlanLeg: FlightPlanLeg;
    verticalWptPrediction: VerticalWaypointPrediction;
    derivedFplnLegData: DerivedFplnLegData;
}
interface FplnLegLineProps extends FplnLineFmgcData, FplnLineCommonProps {
    previousRow: FplnLineFmgcData | null;
    firstLine: boolean;
    lastLine: boolean;
    activeLeg: Subscribable<boolean>;
    pseudoWaypoint: boolean;
    displayEfobAndWind: Subscribable<boolean>;
}
class FplnSpecialLine extends DisplayComponent<FplnLineCommonProps> {
    render() {
        return (
            <div class="MFDFplnLine" style="font-size: 30px;">
                - - - - - -
                <span style="margin: 0px 15px 0px 15px;">{this.props.children}</span>
                - - - - - -
            </div>
        );
    }
}

// TODO TMPY fplns (all yellow)
// TODO SEC fplns (all white)
// TODO leg ident of active leg = Green
// TODO pseudo waypoint line

class FplnLegLine extends DisplayComponent<FplnLegLineProps> {
    // Make sure to collect all subscriptions here, so we can properly destroy them.
    private subs = [] as Subscription[];

    private annotationRef = FSComponent.createRef<HTMLDivElement>();

    private identRef = FSComponent.createRef<HTMLDivElement>();

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

        this.subs.push(this.props.displayEfobAndWind.sub((val) => {
            while (this.speedRef.instance.firstChild) {
                this.speedRef.instance.removeChild(this.speedRef.instance.firstChild);
            }
            while (this.altRef.instance.firstChild) {
                this.altRef.instance.removeChild(this.altRef.instance.firstChild);
            }
            FSComponent.render(this.efobOrSpeed(), this.speedRef.instance);
            FSComponent.render(this.windOrAlt(), this.altRef.instance);

            if (val === true) {
                this.altRef.instance.style.alignSelf = 'flex-end';
                this.altRef.instance.style.paddingRight = '20px';
                this.speedRef.instance.parentElement.className = 'MFDFplnSmallLabel';
            } else {
                this.altRef.instance.style.alignSelf = null;
                this.altRef.instance.style.paddingRight = null;
                this.speedRef.instance.parentElement.className = 'MFDFplnClickableSmallLabel';
            }
        }, true));
    }

    private formatWind(): VNode {
        let directionStr = '';
        if (this.props?.previousRow?.derivedFplnLegData?.windPrediction.direction
            && this.props?.previousRow?.derivedFplnLegData?.windPrediction.direction === this.props?.derivedFplnLegData?.windPrediction.direction) {
            directionStr = ':';
        } else {
            directionStr = this.props.derivedFplnLegData.windPrediction.direction.toFixed(0).toString().padStart(3, '0');
        }

        let speedStr = '';
        if (this.props?.previousRow?.derivedFplnLegData?.windPrediction.speed
            && this.props?.previousRow?.derivedFplnLegData?.windPrediction.speed === this.props?.derivedFplnLegData?.windPrediction.speed) {
            speedStr = ':';
        } else {
            speedStr = this.props.derivedFplnLegData.windPrediction.speed.toFixed(0).toString().padStart(3, '0');
        }

        return (
            <div style="display: flex; flex-direction: row; justify-self: flex-end">
                <div style="width: 45px; text-align: center;">{directionStr}</div>
                <span>/</span>
                <div style="width: 45px; text-align: center;">{speedStr}</div>
            </div>
        );
    }

    private formatAltitude(): VNode {
        let altStr = '';
        if (this.props.verticalWptPrediction.altitude) {
            if (this.props?.previousRow?.verticalWptPrediction?.altitude
                && this.props.previousRow.verticalWptPrediction.altitude === this.props.verticalWptPrediction.altitude
                && !this.props.verticalWptPrediction.altitudeConstraint
                && !this.props.firstLine) {
                altStr = ':';
            } else if (this.props.verticalWptPrediction.altitude > (this.props.flightPlanLeg.definition.transitionAltitude ?? 18000)) {
                altStr = `FL${Math.round(this.props.verticalWptPrediction.altitude / 100)}`;
            } else {
                altStr = this.props.verticalWptPrediction.altitude.toString();
            }
        }
        if (this.props.verticalWptPrediction.altitudeConstraint) {
            if (this.props.verticalWptPrediction.isAltitudeConstraintMet) {
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

    private formatSpeed(): VNode {
        let speedStr = '';
        if (this.props.verticalWptPrediction.speed) {
            if (this.props?.previousRow?.verticalWptPrediction?.speed
                && this.props.previousRow.verticalWptPrediction.speed === this.props.verticalWptPrediction.speed
                && !this.props.verticalWptPrediction.speedConstraint
                && !this.props.firstLine) {
                speedStr = ':';
            } else {
                speedStr = this.props.verticalWptPrediction.speed.toString();
            }
        }
        if (this.props.verticalWptPrediction.speedConstraint) {
            if (this.props.verticalWptPrediction.isSpeedConstraintMet) {
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

    private efobOrSpeed(): VNode {
        if (this.props.displayEfobAndWind.get() === true) {
            return <span>{this.props.verticalWptPrediction.estimatedFuelOnBoard.toFixed(1).toString()}</span>;
        }
        return this.formatSpeed();
    }

    private windOrAlt(): VNode {
        if (this.props.displayEfobAndWind.get() === true) {
            return this.formatWind();
        }
        return this.formatAltitude();
    }

    private lineConnector(): SVGElement {
        if (this.props.firstLine) {
            return null;
        }
        if (this.props.activeLeg.get()) {
            return FplnLineConnectorActiveLeg();
        }
        if (this.props.pseudoWaypoint) {
            return FplnLineConnectorPseudoWaypoint(this.props.lastLine);
        }
        return FplnLineConnectorNormal(this.props.lastLine);
    }

    render() {
        // Format time to leg
        let timeStr = '';
        if (this.props.verticalWptPrediction.secondsFromPresent) {
            const minutesTotal = this.props.verticalWptPrediction.secondsFromPresent / 60;
            const hours = Math.abs(Math.floor(minutesTotal / 60)).toFixed(0).toString().padStart(2, '0');
            const minutes = Math.abs(minutesTotal % 60).toFixed(0).toString().padStart(2, '0');
            timeStr = `${hours}:${minutes}`;
        }

        return (
            <div class="MFDFplnLine" style={`${this.props.firstLine ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}>
                <div style="width: 25%; display: flex; flex-direction: column; ">
                    {!this.props.firstLine && (
                        <div ref={this.annotationRef} class="MFDFplnLineAnnotation">
                            {this.props.flightPlanLeg.annotation}
                        </div>
                    )}
                    <div ref={this.identRef} class="MFDFplnLineIdent">
                        {this.props.flightPlanLeg.ident}
                    </div>
                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 11.5%;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.timeRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;">
                        {timeStr.toString()}
                    </div>

                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 15%; align-items: flex-start; padding-left: 30px;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.speedRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;">
                        {this.efobOrSpeed()}
                    </div>
                </div>
                <div class="MFDFplnClickableSmallLabel" style="width: 22.5%; align-items: flex-start; padding-left: 10px;">
                    {!this.props.firstLine && <div class="MFDFplnLegUpperRow" />}
                    <div ref={this.altRef} class="MFDFplnLegLowerRow" style="display: flex; justify-content: center; align-items: center;">
                        {this.windOrAlt()}
                    </div>
                </div>
                <div ref={this.connectorRef} class="MFDFplnSmallLabel" style="width: 30px; margin-right: 5px;">
                    {this.lineConnector()}
                </div>
                <div class="MFDFplnSmallLabel" style="width: 8%; align-items: flex-start;">
                    {!this.props.firstLine && (
                        <div ref={this.trackRef} class="MFDFplnLegUpperRow">
                            {this.props.derivedFplnLegData.trackFromLastWpt && `${this.props.derivedFplnLegData.trackFromLastWpt.toString()}°`}
                        </div>
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
                <div class="MFDFplnSmallLabel" style="width: 6%; align-items: flex-end;">
                    {!this.props.firstLine && (
                        <div ref={this.distRef} class="MFDFplnLegUpperRow" style="text-align: right;">
                            {this.props.derivedFplnLegData.distanceFromLastWpt && this.props.derivedFplnLegData.distanceFromLastWpt.toString()}
                        </div>
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
                <div class="MFDFplnSmallLabel" style="width: 6%; align-items: flex-end;">
                    {!this.props.firstLine && (
                        <div ref={this.fpaRef} class="MFDFplnLegUpperRow">
                            {this.props.flightPlanLeg.definition.verticalAngle && this.props.flightPlanLeg.definition.verticalAngle.toString()}
                        </div>
                    )}
                    <div class="MFDFplnLegLowerRow" />
                </div>
            </div>
        );
    }
}

function FplnLineConnectorNormal(lastLine: boolean): SVGElement {
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

function FplnLineConnectorActiveLeg(): SVGElement {
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

function FplnLineConnectorPseudoWaypoint(lastLine: boolean): SVGElement {
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

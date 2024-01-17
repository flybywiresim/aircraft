/* eslint-disable jsx-a11y/label-has-associated-control */

import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { ArraySubject, ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Knots, Foot } from '@flybywiresim/fbw-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';

import './MfdFmsFplnVertRev.scss';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AltitudeOrFlightLevelFormat, SpeedKnotsFormat, TimeHHMMSSFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { Vmo } from '@shared/PerformanceConstants';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { AltitudeConstraintType, SpeedConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';

interface MfdFmsFplnVertRevProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnVertRev extends FmsPage<MfdFmsFplnVertRevProps> {
    private selectedPageIndex = Subject.create(0);

    private availableWaypoints = ArraySubject.create<string>([]);

    private selectedWaypointIndex = Subject.create<number>(undefined);

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private transitionAltitude = Subject.create<Foot>(0);

    // RTA page

    // SPD page
    private speedMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

    private speedConstraintInput = Subject.create<Knots>(undefined);

    private speedConstraintType = Subject.create<'CLB' | 'DES'>(undefined);

    private spdConstraintDisabled = Subject.create(true);

    // CMS page

    // ALT page
    private altitudeMessageArea = Subject.create<string>('TOO STEEP PATH AHEAD');

    private altitudeConstraintInput = Subject.create<Foot>(undefined);

    private altitudeConstraintType = Subject.create<'CLB' | 'DES'>(undefined);

    private altConstraintDisabled = Subject.create(true);

    private selectedAltitudeConstraintOption = Subject.create<number>(undefined);

    private altWindowLabelRef = FSComponent.createRef<HTMLDivElement>();

    private altWindowValueRef = FSComponent.createRef<HTMLDivElement>();

    private altWindowUnitLeading = Subject.create<string>('');

    private altWindowUnitValue = Subject.create<string>('EMPTY');

    private altWindowUnitTrailing = Subject.create<string>('');

    // STEP ALTs page

    protected onNewData(): void {
        console.time('F-PLN/VERT REV:onNewData');

        const pd = this.loadedFlightPlan.performanceData;
        // const fm = this.props.fmService.fmgc.data;

        if (pd.transitionAltitude !== undefined) {
            this.transitionAltitude.set(pd.transitionAltitude);
        }

        const wpt = this.loadedFlightPlan.allLegs.slice(this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + 1).map((el) => {
            if (el instanceof FlightPlanLeg) {
                return el.ident;
            }
            return null;
        }).filter((el) => el !== null);
        this.availableWaypoints.set(wpt);

        if (this.props.fmcService.master.revisedWaypointIndex.get() !== undefined) {
            this.selectedWaypointIndex.set(
                this.props.fmcService.master.revisedWaypointIndex.get() - this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex - 1,
            );
        }

        this.updateConstraints();

        console.timeEnd('F-PLN/VERT REV:onNewData');
    }

    public static isEligibleForVerticalRevision(legIndex: number, leg: FlightPlanLeg, flightPlan: FlightPlan): boolean {
        // Check conditions: No constraints for airports, FROM waypoint, CRZ legs, GA legs, pseudo waypoints
        const enrouteLegsNoDisco = flightPlan.enrouteSegment.allLegs.filter((it) => it instanceof FlightPlanLeg);
        const firstEnrouteFix = enrouteLegsNoDisco[0] as FlightPlanLeg;
        const lastEnrouteFix = enrouteLegsNoDisco[enrouteLegsNoDisco.length - 1] as FlightPlanLeg;
        const firstEnrouteLegIndex = flightPlan.findLegIndexByFixIdent(firstEnrouteFix.definition.waypoint.ident);
        const lastEnrouteLegIndex = flightPlan.findLegIndexByFixIdent(lastEnrouteFix.definition.waypoint.ident);
        if (leg.isRunway()
        || legIndex <= flightPlan.activeLegIndex
        || (legIndex >= firstEnrouteLegIndex && legIndex <= lastEnrouteLegIndex)
        || legIndex >= flightPlan.firstMissedApproachLegIndex) {
            return false;
        }
        return true;
    }

    private updateConstraints() {
        const wptIdx = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + this.selectedWaypointIndex.get() + 1;
        if (wptIdx !== undefined) {
            const leg = this.loadedFlightPlan.legElementAt(wptIdx);

            if (MfdFmsFplnVertRev.isEligibleForVerticalRevision(wptIdx, leg, this.loadedFlightPlan) === false) {
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
            this.speedConstraintInput.set(leg.speedConstraint?.speed);
            this.speedConstraintType.set(leg.constraintType === WaypointConstraintType.CLB ? 'CLB' : 'DES');

            // Load altitude constraints
            switch (leg.altitudeConstraint?.type) {
            case AltitudeConstraintType.at:
                this.selectedAltitudeConstraintOption.set(0);
                break;
            case AltitudeConstraintType.atOrAbove:
                this.selectedAltitudeConstraintOption.set(1);
                break;
            case AltitudeConstraintType.atOrBelow:
                this.selectedAltitudeConstraintOption.set(2);
                break;
            default:
                this.selectedAltitudeConstraintOption.set(undefined);
                break;
            }
            this.altitudeConstraintInput.set(leg.altitudeConstraint?.altitude1);
            this.altitudeConstraintType.set(leg.constraintType === WaypointConstraintType.CLB ? 'CLB' : 'DES');

            if (leg.altitudeConstraint?.altitude2 !== undefined) {
                const ac = leg.altitudeConstraint;
                this.altConstraintDisabled.set(true);
                // ALT window
                if (ac.altitude1 > this.transitionAltitude.get()) {
                    // FL
                    this.altWindowUnitLeading.set('FL');
                    this.altWindowUnitTrailing.set('');
                    this.altWindowUnitValue.set(`${(ac.altitude1 / 100).toFixed(0)}-${(ac.altitude2 / 100).toFixed(0)}`);
                } else {
                    // altitude
                    this.altWindowUnitLeading.set('');
                    this.altWindowUnitTrailing.set('FT');
                    this.altWindowUnitValue.set(`${(ac.altitude1).toFixed(0)}-${(ac.altitude2).toFixed(0)}`);
                }
                this.altWindowLabelRef.instance.style.visibility = 'visible';
                this.altWindowValueRef.instance.style.visibility = 'visible';
            } else {
                this.altConstraintDisabled.set(false);
                this.altWindowLabelRef.instance.style.visibility = 'hidden';
                this.altWindowValueRef.instance.style.visibility = 'hidden';
            }
        }
    }

    private async onWptDropdownModified(idx: number): Promise<void> {
        this.selectedWaypointIndex.set(idx);
        this.props.fmcService.master.revisedWaypointIndex.set(this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + idx + 1);

        this.updateConstraints();
    }

    private async tryUpdateAltitudeConstraint(newAlt?: number) {
        const alt = Number.isFinite(newAlt) ? newAlt : this.altitudeConstraintInput.get();
        if (alt !== undefined && this.selectedAltitudeConstraintOption.get() !== undefined) {
            const index = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex
            + this.selectedWaypointIndex.get() + 1;
            const fpln = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get());
            const leg = fpln.legElementAt(index);

            let option: AltitudeConstraintType;

            switch (this.selectedAltitudeConstraintOption.get()) {
            case 0:
                option = AltitudeConstraintType.at;
                break;
            case 1:
                option = AltitudeConstraintType.atOrAbove;
                break;
            case 2:
                option = AltitudeConstraintType.atOrBelow;
                break;

            default:
                option = AltitudeConstraintType.at;
                break;
            }

            this.props.fmcService.master.flightPlanService.setPilotEnteredAltitudeConstraintAt(index,
                leg.segment.class === SegmentClass.Arrival,
                { altitude1: alt, type: option },
                this.loadedFlightPlanIndex.get(),
                false);
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

        this.subs.push(sub.on('realTime').atFrequency(1).handle((_t) => {
            // const obs = this.props.fmService.guidanceController.verticalProfileComputationParametersObserver.get();
        }));

        this.subs.push(this.tmpyActive.sub((v) => {
            this.returnButtonDiv.getOrDefault().style.visibility = (v ? 'hidden' : 'visible');
            this.tmpyInsertButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden');
        }, true));
    }

    render(): VNode {
        return (
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
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* SPD */}
                            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 15px;">
                                <div><span class="mfd-label biggest amber">{this.speedMessageArea}</span></div>
                                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin-top: 25px;">
                                    <span class="mfd-label biggest green mfd-spacing-right">{this.speedConstraintType}</span>
                                    <span class="mfd-label bigger mfd-spacing-right">SPD CSTR AT </span>
                                    <DropdownMenu
                                        idPrefix="clbConstraintWptDropdown"
                                        selectedIndex={this.selectedWaypointIndex}
                                        values={this.availableWaypoints}
                                        freeTextAllowed={false}
                                        containerStyle="width: 175px;"
                                        alignLabels="flex-start"
                                        onModified={(i) => this.onWptDropdownModified(i)}
                                        numberOfDigitsForInputField={7}
                                        tmpyActive={this.tmpyActive}
                                    />
                                </div>
                                <div class="mfd-vert-rev-spd-cstr-line">
                                    <InputField<number>
                                        dataEntryFormat={new SpeedKnotsFormat(Subject.create(90), Subject.create(Vmo))}
                                        dataHandlerDuringValidation={async (val) => {
                                            const index = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex
                                                + this.selectedWaypointIndex.get()
                                                + 1;
                                            const fpln = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get());
                                            const leg = fpln.legElementAt(index);

                                            this.props.fmcService.master.flightPlanService.setPilotEnteredSpeedConstraintAt(index,
                                                leg.segment.class === SegmentClass.Arrival,
                                                { speed: val, type: SpeedConstraintType.atOrBelow },
                                                this.loadedFlightPlanIndex.get(),
                                                false);
                                        }}
                                        mandatory={Subject.create(false)}
                                        disabled={this.spdConstraintDisabled}
                                        value={this.speedConstraintInput}
                                        alignText="flex-end"
                                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
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
                                            const index = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex
                                                + this.selectedWaypointIndex.get()
                                                + 1;
                                            const fpln = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get());
                                            const leg = fpln.legElementAt(index);

                                            this.props.fmcService.master.flightPlanService.setPilotEnteredSpeedConstraintAt(index,
                                                leg.segment.class === SegmentClass.Arrival,
                                                undefined,
                                                this.loadedFlightPlanIndex.get(),
                                                false);
                                        }}
                                        disabled={this.spdConstraintDisabled}
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
                                <div><span class="mfd-label biggest amber">{this.altitudeMessageArea}</span></div>
                                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin-top: 25px;">
                                    <span class="mfd-label biggest green mfd-spacing-right">{this.altitudeConstraintType}</span>
                                    <span class="mfd-label bigger mfd-spacing-right">ALT CSTR AT </span>
                                    <DropdownMenu
                                        idPrefix="altConstraintWptDropdown"
                                        selectedIndex={this.selectedWaypointIndex}
                                        values={this.availableWaypoints}
                                        freeTextAllowed={false}
                                        containerStyle="width: 175px;"
                                        alignLabels="flex-start"
                                        onModified={(i) => this.onWptDropdownModified(i)}
                                        numberOfDigitsForInputField={7}
                                        tmpyActive={this.tmpyActive}
                                    />
                                </div>
                                <div class="mfd-vert-rev-alt-cstr-line">
                                    <div class="mfd-vert-rev-alt-cstr-rb">
                                        <RadioButtonGroup
                                            idPrefix="altCstrRadioButtons"
                                            selectedIndex={this.selectedAltitudeConstraintOption}
                                            values={['AT', 'AT OR ABOVE', 'AT OR BELOW']}
                                            tmpyActive={this.tmpyActive}
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
                                        <InputField<number>
                                            dataEntryFormat={new AltitudeOrFlightLevelFormat(this.transitionAltitude)}
                                            dataHandlerDuringValidation={(val) => this.tryUpdateAltitudeConstraint(val)}
                                            mandatory={Subject.create(false)}
                                            disabled={this.altConstraintDisabled}
                                            value={this.altitudeConstraintInput}
                                            alignText="flex-end"
                                            errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                                        />
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
                                            const index = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex
                                                + this.selectedWaypointIndex.get()
                                                + 1;
                                            const fpln = this.props.fmcService.master.flightPlanService.get(this.loadedFlightPlanIndex.get());
                                            const leg = fpln.legElementAt(index);

                                            this.props.fmcService.master.flightPlanService.setPilotEnteredAltitudeConstraintAt(index,
                                                leg.segment.class === SegmentClass.Arrival,
                                                undefined,
                                                this.loadedFlightPlanIndex.get(),
                                                false);
                                        }}
                                        disabled={this.altConstraintDisabled}
                                        buttonStyle="adding-right: 2px;"
                                    />
                                </div>
                            </div>
                        </TopTabNavigatorPage>
                        <TopTabNavigatorPage>
                            {/* STEP ALTs */}
                            <div style="display: flex; justify-content: center; align-items: center;">
                                <span class="mfd-label mfd-spacing-right">NOT IMPLEMENTED</span>
                            </div>
                        </TopTabNavigatorPage>
                    </TopTabNavigator>
                    <div style="flex-grow: 1;" />
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <div ref={this.returnButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                            <Button
                                label="RETURN"
                                onClick={() => {
                                    this.props.fmcService.master.resetRevisedWaypoint();
                                    this.props.mfd.uiService.navigateTo('back');
                                }}
                            />
                        </div>
                        <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                            <Button
                                label="TMPY F-PLN"
                                onClick={() => {
                                    this.props.fmcService.master.resetRevisedWaypoint();
                                    this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
                                }}
                                buttonStyle="color: yellow"
                            />
                        </div>
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
            </>
        );
    }
}

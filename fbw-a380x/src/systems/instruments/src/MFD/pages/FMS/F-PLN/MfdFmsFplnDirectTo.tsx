import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFplnDirectTo.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanIndex, WaypointEntryUtils } from '@fmgc/index';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';

interface MfdFmsFplnDirectToProps extends AbstractMfdPageProps {
}

enum DirectToOption {
    DIRECT = 0,
    DIRECT_WITH_ABEAM = 1,
    CRS_IN = 2,
    CRS_OUT = 3
}

export class MfdFmsFplnDirectTo extends FmsPage<MfdFmsFplnDirectToProps> {
    private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

    private availableWaypoints = ArraySubject.create<string>([]);

    private selectedWaypointIndex = Subject.create<number>(null);

    private manualWptIdent: string | null = '';

    private utcEta = Subject.create<string>('--:--');

    private distToWpt = Subject.create<string>('---');

    private directToOption = Subject.create<DirectToOption>(DirectToOption.DIRECT);

    private eraseButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    protected onNewData(): void {
        console.time('DIRECT-TO:onNewData');

        // Use active FPLN for building the list (page only works for active anyways)
        const activeFpln = this.props.fmcService.master.flightPlanService.active;
        const wpt = activeFpln.allLegs.slice(
            activeFpln.activeLegIndex,
            activeFpln.firstMissedApproachLegIndex,
        ).map((el) => {
            if (el instanceof FlightPlanLeg && el.isXF() === true) {
                return el.ident;
            }
            return null;
        }).filter((el) => el !== null);
        this.availableWaypoints.set(wpt);

        // Existance of TMPY fpln is indicator for pending direct to revision
        if (this.loadedFlightPlanIndex.get() === FlightPlanIndex.Temporary) {
            // If waypoint was revised, select revised wpt
            if (this.props.fmcService.master.revisedWaypoint() !== undefined) {
                const selectedLegIndex = this.availableWaypoints.getArray().findIndex((it) => it === this.props.fmcService.master.revisedWaypoint().ident);
                if (selectedLegIndex !== -1) {
                    this.selectedWaypointIndex.set(selectedLegIndex);
                }
            }

            // Manual waypoint was entered. In this case, force dropdown field to display wpt ident without selecting it
            if (this.manualWptIdent) {
                this.selectedWaypointIndex.set(null);
                this.dropdownMenuRef.instance.forceLabel(this.manualWptIdent);
            }

            // TODO Display ETA; target waypoint is now activeLeg termination in temporary fpln
            if (this.loadedFlightPlan.activeLeg instanceof FlightPlanLeg) {
                // No predictions for temporary fpln atm, so only distance is displayed
                this.distToWpt.set(this.loadedFlightPlan?.activeLeg?.calculated?.cumulativeDistance?.toFixed(0) ?? '---');
            }
        }

        console.timeEnd('DIRECT-TO:onNewData');
    }

    private async onDropdownModified(idx: number, text: string): Promise<void> {
        if (this.props.fmcService.master.flightPlanService.hasTemporary) {
            await this.props.fmcService.master.flightPlanService.temporaryDelete();
            this.props.fmcService.master.resetRevisedWaypoint();
        }

        const fpln = this.props.fmcService.master.flightPlanService.active;
        if (idx >= 0) {
            if (this.availableWaypoints.get(idx)
                && fpln.findLegIndexByFixIdent(this.availableWaypoints.get(idx))) {
                this.selectedWaypointIndex.set(idx);
                this.manualWptIdent = null;
                await this.props.fmcService.master.flightPlanService.directToLeg(
                    this.props.fmcService.master.navigation.getPpos(),
                    SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
                    fpln.findLegIndexByFixIdent(this.availableWaypoints.get(idx)),
                    this.directToOption.get() === DirectToOption.DIRECT_WITH_ABEAM,
                    FlightPlanIndex.Active,
                );
            }
        } else {
            const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmcService.master, text, true, undefined);
            this.manualWptIdent = wpt.ident;
            await this.props.fmcService.master.flightPlanService.directToWaypoint(
                this.props.fmcService.master.navigation.getPpos(),
                SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
                wpt,
                this.directToOption.get() === DirectToOption.DIRECT_WITH_ABEAM,
                FlightPlanIndex.Active,
            );
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.onNewData();

        this.subs.push(this.tmpyActive.sub((v) => {
            this.eraseButtonDiv.getOrDefault().style.display = (v ? 'block' : 'none');
            this.returnButtonDiv.getOrDefault().style.display = (v ? 'none' : 'block');
            this.tmpyInsertButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden');
        }, true));
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="fr">
                    <div style="flex: 1">
                        <div class="fc">
                            <div class="mfd-fms-direct-to-wpt-row">
                                <span class="mfd-label">DIRECT TO</span>
                                <div class="mfd-fms-direct-to-dropdown-div">
                                    <DropdownMenu
                                        ref={this.dropdownMenuRef}
                                        idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_directToDropdown`}
                                        selectedIndex={this.selectedWaypointIndex}
                                        values={this.availableWaypoints}
                                        freeTextAllowed
                                        containerStyle="width: 175px;"
                                        alignLabels="flex-start"
                                        onModified={(i, text) => this.onDropdownModified(i, text)}
                                        numberOfDigitsForInputField={7}
                                        tmpyActive={this.tmpyActive}
                                    />
                                </div>
                            </div>
                            <div class="mfd-fms-direct-to-wpt-info">
                                <div class="mfd-fms-direct-to-utc-label"><span class="mfd-label">UTC</span></div>
                                <div class="mfd-fms-direct-to-utc-value">
                                    <span class={{
                                        'mfd-value-green': true,
                                        'bigger': true,
                                        'mfd-fms-yellow-text': this.tmpyActive,
                                    }}
                                    >
                                        {this.utcEta}
                                    </span>

                                </div>
                                <div />
                                <div class="mfd-fms-direct-to-utc-label"><span class="mfd-label">DIST</span></div>
                                <div class="mfd-fms-direct-to-utc-value">
                                    <span class={{
                                        'mfd-value-green': true,
                                        'bigger': true,
                                        'mfd-fms-yellow-text': this.tmpyActive,
                                    }}
                                    >
                                        {this.distToWpt}
                                    </span>

                                </div>
                                <div><span class="mfd-label-unit mfd-unit-trailing">NM</span></div>
                            </div>
                        </div>
                    </div>
                    <div style="flex: 1">
                        <div class="mfd-fms-direct-to-options-box">
                            <span class="mfd-label">OPTIONS</span>
                            <div class="mfd-fms-direct-to-options">
                                <RadioButtonGroup
                                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_directToOptionsRadio`}
                                    values={['DIRECT', 'DIRECT WITH ABEAM', 'CRS IN', 'CRS OUT']}
                                    valuesDisabled={Subject.create([false, true, true, true])}
                                    selectedIndex={this.directToOption}
                                    tmpyActive={this.tmpyActive}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex-grow: 1;" />
                <div class="mfd-fms-bottom-button-row">
                    <div ref={this.eraseButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="ERASE<br />DIR TO*"
                            onClick={async () => {
                                await this.props.fmcService.master.flightPlanService.temporaryDelete();
                                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
                            }}
                            buttonStyle="color: #e68000;"
                        />
                    </div>
                    <div ref={this.returnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="RETURN"
                            onClick={() => this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`)}
                        />
                    </div>
                    <div ref={this.tmpyInsertButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="INSERT<br />DIR TO*"
                            onClick={async () => {
                                this.props.fmcService.master.flightPlanService.temporaryInsert();
                                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
                            }}
                            buttonStyle="color: #e68000;"
                        />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
            </>
        );
    }
}

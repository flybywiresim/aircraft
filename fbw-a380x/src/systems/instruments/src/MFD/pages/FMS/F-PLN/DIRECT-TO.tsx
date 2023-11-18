import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './direct-to.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { WaypointEntryUtils } from '@fmgc/index';
import { Fix } from 'msfs-navdata';
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
    private availableWaypoints = ArraySubject.create<string>([]);

    private selectedWaypointIndex = Subject.create<number>(undefined);

    private utcEta = Subject.create<string>('--:--');

    private distToWpt = Subject.create<string>('---');

    private directToOption = Subject.create<DirectToOption>(DirectToOption.DIRECT);

    private eraseButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    protected onNewData(): void {
        console.time('DIRECT-TO:onNewData');

        console.timeEnd('DIRECT-TO:onNewData');
    }

    private async onDropdownModified(idx: number, text: string): Promise<void> {
        if (this.props.fmService.flightPlanService.hasTemporary) {
            await this.props.fmService.flightPlanService.temporaryDelete();
        }

        let wpt: Fix;
        const fpln = this.props.fmService.flightPlanService.get(this.loadedFlightPlanIndex.get());
        if (idx >= 0) {
            if (this.availableWaypoints.get(idx)
            && fpln.elementAt(this.props.fmService.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + idx + 1).isDiscontinuity === false) {
                this.selectedWaypointIndex.set(idx);
                wpt = fpln.legElementAt(this.props.fmService.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + idx + 1).definition.waypoint;
            }
        } else {
            wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmService.mfd, text, true);
        }

        await this.props.fmService.flightPlanService.directTo(
            this.props.fmService.navigationProvider.getPpos(),
            SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
            wpt,
            this.directToOption.get() === DirectToOption.DIRECT_WITH_ABEAM,
            this.loadedFlightPlanIndex.get(),
        );

        // TODO Display ETA and dist to wpt; target waypoint is now activeLeg termination in temporary fpln
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const wpt = this.loadedFlightPlan.allLegs.slice(this.props.fmService.flightPlanService.get(this.loadedFlightPlanIndex.get()).activeLegIndex + 1).map((el) => {
            if (el instanceof FlightPlanLeg) {
                return el.ident;
            }
            return null;
        }).filter((el) => el !== null);
        this.availableWaypoints.set(wpt);

        this.subs.push(this.tmpyActive.sub((v) => {
            // this.eraseButtonDiv.getOrDefault().style.visibility = (v ? 'hidden' : 'visible');
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
                                        idPrefix="directToDropdown"
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
                                    idPrefix="directToOptionsRadio"
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
                                await this.props.fmService.flightPlanService.temporaryDelete();
                            }}
                            buttonStyle="color: #e68000;"
                        />
                    </div>
                    <div ref={this.returnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="RETURN"
                            onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`)}
                        />
                    </div>
                    <div ref={this.tmpyInsertButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="INSERT<br />DIR TO*"
                            onClick={async () => {
                                this.props.fmService.flightPlanService.temporaryInsert();
                                this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`);
                            }}
                            buttonStyle="color: #e68000;"
                        />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

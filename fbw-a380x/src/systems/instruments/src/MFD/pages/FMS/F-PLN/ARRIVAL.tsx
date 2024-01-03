import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { ApproachType } from '@fmgc/index';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';

const ApproachTypeOrder = Object.freeze({
    [ApproachType.Mls]: 0,
    [ApproachType.MlsTypeA]: 1,
    [ApproachType.MlsTypeBC]: 2,
    [ApproachType.Ils]: 3,
    [ApproachType.Gls]: 4,
    [ApproachType.Igs]: 5,
    [ApproachType.Loc]: 6,
    [ApproachType.LocBackcourse]: 7,
    [ApproachType.Lda]: 8,
    [ApproachType.Sdf]: 9,
    [ApproachType.Fms]: 10,
    [ApproachType.Gps]: 11,
    [ApproachType.Rnav]: 12,
    [ApproachType.VorDme]: 13,
    [ApproachType.Vortac]: 13, // VORTAC and VORDME are intentionally the same
    [ApproachType.Vor]: 14,
    [ApproachType.NdbDme]: 15,
    [ApproachType.Ndb]: 16,
    [ApproachType.Unknown]: 17,
});

interface MfdFmsFplnArrProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnArr extends FmsPage<MfdFmsFplnArrProps> {
    private toIcao = Subject.create<string>('');

    private rwyLs = Subject.create<string>('');

    private rwyIdent = Subject.create<string>('');

    private rwyLength = Subject.create<string>('');

    private rwyCrs = Subject.create<string>('');

    private appr = Subject.create<string>('');

    private rwyFreq = Subject.create<string>('');

    private via = Subject.create<string>('');

    private star = Subject.create<string>('');

    private trans = Subject.create<string>('');

    private rwyOptions = Subject.create<ButtonMenuItem[]>([]);

    private apprDisabled = Subject.create<boolean>(false);

    private apprOptions = Subject.create<ButtonMenuItem[]>([]);

    private viaDisabled = Subject.create<boolean>(false);

    private viaOptions = Subject.create<ButtonMenuItem[]>([]);

    private starDisabled = Subject.create<boolean>(false);

    private starOptions = Subject.create<ButtonMenuItem[]>([]);

    private transDisabled = Subject.create<boolean>(false);

    private transOptions = Subject.create<ButtonMenuItem[]>([]);

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private apprButtonScrollTo = Subject.create<number>(null);

    protected onNewData(): void {
        console.time('ARRIVAL:onNewData');

        const isAltn = this.props.fmService.revisedWaypointIsAltn.get();
        const flightPlan: BaseFlightPlan = isAltn ? this.loadedFlightPlan.alternateFlightPlan : this.loadedFlightPlan;

        if (flightPlan.destinationAirport) {
            this.toIcao.set(flightPlan.destinationAirport.ident);

            const runways: ButtonMenuItem[] = [];
            const sortedRunways = flightPlan.availableDestinationRunways.sort((a, b) => a.ident.localeCompare(b.ident));
            sortedRunways.forEach((rw) => {
                runways.push({
                    label: `${rw.ident.substring(2).padEnd(3, ' ')} ${rw.length.toFixed(0).padStart(5, ' ')}FT`,
                    action: async () => {
                        await this.props.fmService.flightPlanService.setDestinationRunway(rw.ident, this.loadedFlightPlanIndex.get(), isAltn);
                        await this.props.fmService.flightPlanService.setApproach(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        await this.props.fmService.flightPlanService.setApproachVia(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                    },
                });
            });
            this.rwyOptions.set(runways);

            if (flightPlan.destinationRunway) {
                this.rwyLs.set(flightPlan.destinationRunway.lsIdent);
                this.rwyIdent.set(flightPlan.destinationRunway.ident.substring(2));
                this.rwyLength.set(flightPlan.destinationRunway.length.toFixed(0) ?? '----');
                this.rwyCrs.set(flightPlan.destinationRunway.bearing.toFixed(0).padStart(3, '0') ?? '---');
            } else {
                this.rwyLs.set('----');
                this.rwyIdent.set('---');
                this.rwyLength.set('----');
                this.rwyCrs.set('---');
            }

            if (flightPlan.availableApproaches?.length > 0) {
                const appr: ButtonMenuItem[] = [{
                    label: 'NONE',
                    action: async () => {
                        await this.props.fmService.flightPlanService.setApproach(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        await this.props.fmService.flightPlanService.setApproachVia(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                    },
                }];

                // Sort approaches by runway
                const sortedApproaches = flightPlan.availableApproaches.sort((a, b) => a.runwayIdent.localeCompare(b.runwayIdent) || ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type]);
                let isFirstMatch = true;
                sortedApproaches.forEach((el, idx) => {
                    appr.push({
                        label: el.ident,
                        action: async () => {
                            await this.props.fmService.flightPlanService.setDestinationRunway(el.runwayIdent, this.loadedFlightPlanIndex.get(), isAltn); // Should we do this here?
                            await this.props.fmService.flightPlanService.setApproach(el.ident, this.loadedFlightPlanIndex.get(), isAltn);
                            await this.props.fmService.flightPlanService.setApproachVia(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        },
                    });

                    if (
                        isFirstMatch === true
                        && flightPlan.approach === undefined
                        && el.runwayIdent === flightPlan?.destinationRunway?.ident
                    ) {
                        this.apprButtonScrollTo.set(idx + 1); // Account for NONE, add 1
                        isFirstMatch = false;
                    }
                });
                this.apprOptions.set(appr);
                this.apprDisabled.set(false);
            } else {
                this.apprDisabled.set(true);
            }

            if (flightPlan.approach) {
                this.appr.set(flightPlan.approach.ident);
                this.rwyFreq.set(flightPlan.destinationRunway.lsFrequencyChannel.toFixed(2));

                if (flightPlan.approach.transitions.length > 0) {
                    const vias: ButtonMenuItem[] = [{
                        label: 'NONE',
                        action: async () => {
                            await this.props.fmService.flightPlanService.setApproachVia(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        },
                    }];

                    // Only show VIAs for STAR, if STAR is set. Consider handling this in FlightPlanService when FpmConfig.CHECK_VIA_COMPATIBILITY===true
                    // const enrouteTransitions = flightPlan.arrival.enrouteTransitions[0];

                    flightPlan.approach.transitions.forEach((el) => {
                        vias.push({
                            label: el.ident,
                            action: async () => {
                                await this.props.fmService.flightPlanService.setApproachVia(el.ident, this.loadedFlightPlanIndex.get(), isAltn);
                            },
                        });
                    });
                    this.viaOptions.set(vias);
                    this.viaDisabled.set(false);
                } else {
                    this.viaDisabled.set(true);
                }
            } else if (flightPlan.availableApproaches?.length > 0) {
                this.appr.set('------');
                this.rwyFreq.set('---.--');
            } else {
                this.appr.set('NONE');
                this.rwyFreq.set('---.--');
            }

            if (flightPlan.approachVia) {
                this.via.set(flightPlan.approachVia.ident);
            } else if (!flightPlan.approach || flightPlan?.approach?.transitions?.length > 0) {
                this.via.set('------');
            } else {
                this.via.set('NONE');
            }

            if (flightPlan.availableArrivals?.length > 0) {
                const arrivals: ButtonMenuItem[] = [{
                    label: 'NONE',
                    action: async () => {
                        await this.props.fmService.flightPlanService.setArrival(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        await this.props.fmService.flightPlanService.setArrivalEnrouteTransition(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                    },
                }];
                flightPlan.availableArrivals.forEach((el) => {
                    arrivals.push({
                        label: el.ident,
                        action: async () => {
                            await this.props.fmService.flightPlanService.setArrival(el.ident, this.loadedFlightPlanIndex.get(), isAltn);
                            await this.props.fmService.flightPlanService.setArrivalEnrouteTransition(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        },
                    });
                });
                this.starOptions.set(arrivals);
                this.starDisabled.set(false);
            } else {
                this.starDisabled.set(true);
            }

            if (flightPlan.arrival) {
                this.star.set(flightPlan.arrival.ident);

                if (flightPlan.arrival.enrouteTransitions?.length > 0) {
                    const trans: ButtonMenuItem[] = [{
                        label: 'NONE',
                        action: async () => {
                            await this.props.fmService.flightPlanService.setArrivalEnrouteTransition(undefined, this.loadedFlightPlanIndex.get(), isAltn);
                        },
                    }];
                    flightPlan.arrival.enrouteTransitions.forEach((el) => {
                        trans.push({
                            label: el.ident,
                            action: async () => {
                                await this.props.fmService.flightPlanService.setArrivalEnrouteTransition(el.ident, this.loadedFlightPlanIndex.get(), isAltn);
                            },
                        });
                    });
                    this.transOptions.set(trans);
                    this.transDisabled.set(false);
                }
            } else {
                if (flightPlan.availableArrivals?.length > 0) {
                    this.star.set('------');
                } else {
                    this.star.set('NONE');
                }
                this.transDisabled.set(true);
            }

            if (flightPlan.arrivalEnrouteTransition) {
                this.trans.set(flightPlan.arrivalEnrouteTransition.ident);
            } else if (flightPlan?.arrival?.enrouteTransitions?.length === 0) {
                this.trans.set('NONE');
            } else {
                this.trans.set('------');
            }
        } else {
            this.toIcao.set('----');
        }

        console.timeEnd('ARRIVAL:onNewData');
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.tmpyActive.sub((v) => {
            this.returnButtonDiv.getOrDefault().style.visibility = (v ? 'hidden' : 'visible');
            this.tmpyInsertButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden');
        }, true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="mfd-fms-fpln-labeled-box-container">
                    <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
                        SELECTED ARRIVAL
                    </span>
                    <div class="mfd-fms-fpln-label-bottom-space" style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 0.2; display: flex; flex-direction: row; align-items: center;">
                            <span class="mfd-label mfd-spacing-right">TO</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.toIcao}
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">LS</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyLs}
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyIdent}
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">LENGTH</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyLength}
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">FT</span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">CRS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyCrs}
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">°</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">APPR</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.appr}
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">FREQ/CHAN</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyFreq}
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">VIA</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.via}
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">STAR</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.star}
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">TRANS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.trans}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <Button
                        label="RWY"
                        onClick={() => { }}
                        buttonStyle="width: 190px;"
                        idPrefix="f-pln-arr-rwy-btn"
                        menuItems={this.rwyOptions}
                    />
                    <Button
                        label="APPR"
                        onClick={() => { }}
                        disabled={this.apprDisabled}
                        buttonStyle="width: 160px;"
                        idPrefix="f-pln-arr-appr-btn"
                        menuItems={this.apprOptions}
                        scrollToMenuItem={this.apprButtonScrollTo}
                    />
                    <Button
                        label="VIA"
                        onClick={() => { }}
                        disabled={this.viaDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-via-btn"
                        menuItems={this.viaOptions}
                    />
                    <Button
                        label="STAR"
                        onClick={() => { }}
                        disabled={this.starDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-star-btn"
                        menuItems={this.starOptions}
                    />
                    <Button
                        label="TRANS"
                        onClick={() => { }}
                        disabled={this.transDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-trans-btn"
                        menuItems={this.transOptions}
                    />
                </div>
                <div style="flex-grow: 1;" />
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <div ref={this.returnButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                        <Button
                            label="RETURN"
                            onClick={() => {
                                this.props.fmService.resetRevisedWaypoint();
                                this.props.uiService.navigateTo('back');
                            }}
                        />
                    </div>
                    <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                        <Button
                            label="TMPY F-PLN"
                            onClick={() => {
                                this.props.fmService.resetRevisedWaypoint();
                                this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`);
                            }}
                            buttonStyle="color: yellow"
                        />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

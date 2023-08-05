import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { ActiveUriInformation } from 'instruments/src/MFD/pages/common/UIService';

interface MfdFmsFplnDepProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnDep extends DisplayComponent<MfdFmsFplnDepProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private loadedFlightPlan: FlightPlan;

    private currentFlightPlanVersion: number = 0;

    private tmpyActive = Subject.create<boolean>(false);

    private secActive = Subject.create<boolean>(false);

    private fromIcao = Subject.create<string>('');

    private rwyIdent = Subject.create<string>('');

    private rwyLength = Subject.create<string>('');

    private rwyCrs = Subject.create<string>('');

    private rwyEoSid = Subject.create<string>('');

    private rwyFreq = Subject.create<string>('');

    private rwySid = Subject.create<string>('');

    private rwyTrans = Subject.create<string>('');

    private rwyOptions = Subject.create<ButtonMenuItem[]>([]);

    private sidDisabled = Subject.create<boolean>(false);

    private sidOptions = Subject.create<ButtonMenuItem[]>([]);

    private transDisabled = Subject.create<boolean>(false);

    private transOptions = Subject.create<ButtonMenuItem[]>([]);

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private onNewData(): void {
        console.time('DEPARTURE:onNewData');
        this.currentFlightPlanVersion = this.loadedFlightPlan.version;

        if (this.loadedFlightPlan.originAirport) {
            this.fromIcao.set(this.loadedFlightPlan.originAirport.ident);

            const runways: ButtonMenuItem[] = [];
            this.loadedFlightPlan.availableOriginRunways.forEach((rw) => {
                runways.push({
                    label: `${rw.ident.substring(2).padEnd(3, ' ')} ${rw.length.toFixed(0).padStart(5, ' ')}FT ${rw.lsIdent ? 'ILS' : ''}`,
                    action: () => {
                        this.props.flightPlanService.setOriginRunway(rw.ident);
                        this.props.flightPlanService.setDepartureProcedure(undefined);
                        this.props.flightPlanService.setDepartureEnrouteTransition(undefined);
                    },
                });
            });
            this.rwyOptions.set(runways);

            if (this.loadedFlightPlan.originRunway) {
                this.rwyIdent.set(this.loadedFlightPlan.originRunway.ident.substring(2));
                this.rwyLength.set(this.loadedFlightPlan.originRunway.length.toFixed(0) ?? '----');
                this.rwyCrs.set(this.loadedFlightPlan.originRunway.bearing.toFixed(0) ?? '---');
                this.rwyEoSid.set('NONE');
                this.rwyFreq.set(this.loadedFlightPlan.originRunway.lsFrequencyChannel.toFixed(2) ?? '---.--');

                if (this.loadedFlightPlan.availableDepartures?.length > 0) {
                    const sids: ButtonMenuItem[] = [{
                        label: 'NONE',
                        action: () => {
                            this.props.flightPlanService.setDepartureProcedure(undefined);
                            this.props.flightPlanService.setDepartureEnrouteTransition(undefined);
                        },
                    }];
                    this.loadedFlightPlan.availableDepartures.forEach((dep) => {
                        sids.push({
                            label: dep.ident,
                            action: () => {
                                this.props.flightPlanService.setDepartureProcedure(dep.ident);
                                this.props.flightPlanService.setDepartureEnrouteTransition(undefined);
                            },
                        });
                    });
                    this.sidOptions.set(sids);
                    this.sidDisabled.set(false);
                }
            } else {
                this.rwyIdent.set('---');
                this.rwyLength.set('----');
                this.rwyCrs.set('---');
                this.rwyEoSid.set('------');
                this.rwyFreq.set('---.--');
                this.sidDisabled.set(true);
            }

            if (this.loadedFlightPlan.originDeparture) {
                this.rwySid.set(this.loadedFlightPlan.originDeparture.ident);

                if (this.loadedFlightPlan.originDeparture.enrouteTransitions?.length > 0) {
                    const trans: ButtonMenuItem[] = [{ label: 'NONE', action: () => this.props.flightPlanService.setDepartureEnrouteTransition(undefined) }];
                    this.loadedFlightPlan.originDeparture.enrouteTransitions.forEach((el) => {
                        trans.push({ label: el.ident, action: () => this.props.flightPlanService.setDepartureEnrouteTransition(el.ident) });
                    });
                    this.transOptions.set(trans);
                    this.transDisabled.set(false);
                }
            } else {
                if (this.loadedFlightPlan.availableDepartures?.length > 0) {
                    this.rwySid.set('------');
                } else {
                    this.rwySid.set('NONE');
                }
                this.transDisabled.set(true);
            }

            if (this.loadedFlightPlan.departureEnrouteTransition) {
                this.rwyTrans.set(this.loadedFlightPlan.departureEnrouteTransition.ident);
            } else if (this.loadedFlightPlan?.originDeparture?.enrouteTransitions?.length === 0) {
                this.rwyTrans.set('NONE');
            } else {
                this.rwyTrans.set('------');
            }
        } else {
            this.fromIcao.set('----');
        }

        this.tmpyActive.set(this.props.flightPlanService.hasTemporary);
        console.timeEnd('DEPARTURE:onNewData');
    }

    private whichFlightPlan(activeUri: ActiveUriInformation): FlightPlan {
        switch (activeUri.category) {
        case 'active':
            return this.props.flightPlanService.activeOrTemporary;
        case 'sec1':
            return this.props.flightPlanService.secondary(1);
        case 'sec2':
            return this.props.flightPlanService.secondary(2);
        case 'sec3':
            return this.props.flightPlanService.secondary(3);

        default:
            return this.props.flightPlanService.activeOrTemporary;
        }
    }

    private onFlightPlanChanged() {
        console.log(1);
        this.loadedFlightPlan = this.whichFlightPlan(this.props.uiService.activeUri.get());
        this.currentFlightPlanVersion = this.loadedFlightPlan.version;
        this.tmpyActive.set(this.props.flightPlanService.hasTemporary);
    }

    private checkIfFlightPlanChanged() {
        if (this.whichFlightPlan(this.props.uiService.activeUri.get()).version !== this.currentFlightPlanVersion) {
            this.onFlightPlanChanged();
            this.onNewData();
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.activePageTitle.set(`${val.category.toUpperCase()}/F-PLN/DEPARTURE`);
        }, true));

        this.subs.push(this.tmpyActive.sub((v) => this.tmpyInsertButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden'), true));

        this.onFlightPlanChanged();
        this.onNewData();
        setInterval(() => this.checkIfFlightPlanChanged(), 50);
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={this.tmpyActive} />
                {/* begin page content */}
                <div class="mfd-fms-fpln-labeled-box-container">
                    <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
                        SELECTED DEPARTURE
                    </span>
                    <div class="mfd-fms-fpln-label-bottom-space" style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 3; display: flex; flex-direction: row; align-items: center;">
                            <span class="mfd-label mfd-spacing-right">FROM</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.fromIcao}
                            </span>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyIdent}
                            </span>
                        </div>
                        <div style="flex: 1.3; display: flex; flex-direction: column;">
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
                        <div style="flex: 0.7; display: flex; flex-direction: column;">
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
                        <div style="flex: 0.25; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">EOSID</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyEoSid}
                            </span>
                        </div>
                        <div style="flex: 0.3; display: flex; flex-direction: column;">
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
                        <div style="flex: 0.25; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">SID</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwySid}
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
                                    {this.rwyTrans}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; margin-left: 50px;">
                    <Button
                        label="RWY"
                        onClick={() => null}
                        buttonStyle="width: 250px;"
                        idPrefix="f-pln-dep-rwy-btn"
                        menuItems={this.rwyOptions}
                    />
                    <div style="width: 100px;" />
                    <Button
                        label="SID"
                        onClick={() => null}
                        disabled={this.sidDisabled}
                        buttonStyle="width: 140px;"
                        idPrefix="f-pln-dep-sid-btn"
                        menuItems={this.sidOptions}
                    />
                    <div style="width: 50px;" />
                    <Button
                        label="TRANS"
                        onClick={() => null}
                        disabled={this.transDisabled}
                        buttonStyle="width: 130px;"
                        idPrefix="f-pln-dep-trans-btn"
                        menuItems={this.transOptions}
                    />
                </div>
                <div style="flex-grow: 1;" />
                <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                    <Button label="TMPY F-PLN" onClick={() => this.props.flightPlanService.temporaryInsert()} buttonStyle="color: yellow" />
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} flightPlanService={this.props.flightPlanService} />
            </>
        );
    }
}

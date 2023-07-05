/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirportFormat, CostIndexFormat, CrzTempFormat, FlightLevelFormat, LongAlphanumericFormat, TripWindFormat, TropoFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { defaultTropopauseAlt, maxCertifiedAlt } from 'shared/PerformanceConstants';

interface MfdFmsInitProps extends MfdComponentProps {
}

export class MfdFmsInit extends DisplayComponent<MfdFmsInitProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private fltNbr = Subject.create<string>(null);

    private fromIcao = Subject.create<string>(null);

    private toIcao = Subject.create<string>(null);

    private altnIcao = Subject.create<string>(null);

    private altnDisabled = Subject.create(true);

    private cpnyRte = Subject.create<string>(null);

    private altnRte = Subject.create<string>(null);

    private crzFl = Subject.create<number>(null);

    private crzTemp = Subject.create<number>(null);

    private crzTempIsDisabled = Subject.create(true);

    private costIndex = Subject.create<number>(null);

    private costIndexDisabled = Subject.create(true);

    private tropoAlt = Subject.create<number>(defaultTropopauseAlt);

    private tripWind = Subject.create<number>(null);

    private tripWindDisabled = Subject.create(true);

    private cpnyRteMandatory = Subject.create(true);

    private departureButtonDisabled = Subject.create(true);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/INIT');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/INIT');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/INIT');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/INIT');
                break;

            default:
                this.activePageTitle.set('ACTIVE/INIT');
                break;
            }
        }, true));

        // Check if CPNY RTE is mandatory
        this.subs.push(this.fromIcao.sub(() => this.fromToChanged(), true));
        this.subs.push(this.toIcao.sub(() => this.fromToChanged(), true));
        this.subs.push(this.crzFl.sub((val) => this.crzTempIsDisabled.set(!val), true));
    }

    private fromToChanged() {
        this.cpnyRteMandatory.set(!this.fromIcao.get() || !this.toIcao.get());
        this.altnDisabled.set(!this.fromIcao.get() || !this.toIcao.get());
        this.costIndexDisabled.set(!this.fromIcao.get() || !this.toIcao.get());
        this.tripWindDisabled.set(!this.fromIcao.get() || !this.toIcao.get());
        this.departureButtonDisabled.set(!this.fromIcao.get());

        if (this.fromIcao.get() && this.toIcao.get()) {
            if (!this.altnIcao.get()) {
                this.altnIcao.set('NONE');
            }

            if (!this.cpnyRte.get()) {
                this.cpnyRte.set('NONE');
            }

            if (!this.altnRte.get()) {
                this.altnRte.set('NONE');
            }
        }
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer">
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">FLT NBR</div>
                        <InputField<string>
                            dataEntryFormat={new LongAlphanumericFormat()}
                            mandatory={Subject.create(true)}
                            value={this.fltNbr}
                            containerStyle="width: 200px; margin-right: 5px;"
                            alignText="center"
                        />
                        <Button label="ACFT STATUS" onClick={() => this.props.navigateTo('fms/data/status')} buttonStyle="margin-right: 10px; width: 200px;" />
                        <div style="flex-grow: 1" />
                        <Button
                            label="RECEIVED<br />CPNY F-PLN"
                            onClick={() => console.log('CPNY F-PLN REQUEST')}
                            buttonStyle="width: 175px;"
                            idPrefix="fplnreq"
                            menuItems={Subject.create([
                                { label: 'INSERT*', action: () => console.log('INSERT') },
                                { label: 'CLEAR*', action: () => console.log('CLEAR') }])}
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 10px; margin-bottom: 10px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">FROM</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            mandatory={Subject.create(true)}
                            canBeCleared={Subject.create(false)}
                            value={this.fromIcao}
                            alignText="center"
                        />
                        <div class="MFDLabel" style="margin: 0px 10px 0px 10px;">TO</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            mandatory={Subject.create(true)}
                            canBeCleared={Subject.create(false)}
                            value={this.toIcao}
                            alignText="center"
                        />
                        <div class="MFDLabel" style="margin: 0px 10px 0px 10px;">ALTN</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            mandatory={Subject.create(true)}
                            disabled={this.altnDisabled}
                            value={this.altnIcao}
                            alignText="center"
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CPNY RTE</div>
                        <InputField<string>
                            dataEntryFormat={new LongAlphanumericFormat()}
                            mandatory={this.cpnyRteMandatory}
                            canBeCleared={Subject.create(false)}
                            value={this.cpnyRte}
                            containerStyle="width: 200px; margin-right: 5px;"
                            alignText="center"
                        />
                        <Button label="RTE SEL" onClick={() => console.log('RTE SEL')} buttonStyle="margin-right: 10px; width: 200px;" />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px; border-bottom: 1px solid lightgrey; margin-bottom: 25px; padding-bottom: 25px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">ALTN RTE</div>
                        <InputField<string>
                            dataEntryFormat={new LongAlphanumericFormat()}
                            mandatory={Subject.create(false)}
                            disabled={this.altnDisabled}
                            canBeCleared={Subject.create(false)}
                            value={this.altnRte}
                            containerStyle="width: 200px; margin-right: 5px;"
                            alignText="center"
                        />
                        <Button label="ALTN RTE SEL" disabled={this.altnDisabled} onClick={() => console.log('ALTN RTE SEL')} buttonStyle="margin-right: 10px; width: 200px;" />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CRZ FL</div>
                        <InputField<number>
                            dataEntryFormat={new FlightLevelFormat(Subject.create(100), Subject.create(maxCertifiedAlt))}
                            mandatory={Subject.create(true)}
                            disabled={this.altnDisabled}
                            canBeCleared={Subject.create(false)}
                            value={this.crzFl}
                            containerStyle="margin-right: 25px;"
                        />
                        <div class="MFDLabel" style="text-align: right; padding-right: 5px;">CRZ TEMP</div>
                        <InputField<number>
                            dataEntryFormat={new CrzTempFormat()}
                            mandatory={Subject.create(false)}
                            disabled={this.crzTempIsDisabled}
                            value={this.crzTemp}
                            containerStyle="width: 110px; justify-content: flex-end;"
                            alignText="center"
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 10px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CI</div>
                        <InputField<number>
                            dataEntryFormat={new CostIndexFormat()}
                            mandatory={Subject.create(true)}
                            disabled={this.costIndexDisabled}
                            value={this.costIndex}
                            containerStyle="width: 70px; margin-right: 90px; justify-content: center;"
                            alignText="center"
                        />
                        <div class="MFDLabel" style="text-align: right; padding-right: 5px;">TROPO</div>
                        <InputField<number>
                            dataEntryFormat={new TropoFormat()}
                            mandatory={Subject.create(false)}
                            computedByFms={Subject.create(true)}
                            value={this.tropoAlt}
                            alignText="flex-end"
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;border-bottom: 1px solid lightgrey; margin-bottom: 15px; padding-bottom: 35px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px; margin-top: 90px;">TRIP WIND</div>
                        <InputField<number>
                            dataEntryFormat={new TripWindFormat()}
                            mandatory={Subject.create(false)}
                            disabled={this.tripWindDisabled}
                            value={this.tripWind}
                            containerStyle="width: 125px; margin-right: 80px; margin-top: 90px;"
                            alignText="center"
                        />
                        <Button label="WIND" onClick={() => console.log('WIND')} buttonStyle="margin-right: 10px; margin-top: 90px;" />
                        <div style="flex-grow: 1" />
                        <Button label="CPNY WIND<br />REQUEST" onClick={() => console.log('CPNY WIND REQUEST')} buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;" />
                    </div>
                    <Button label="IRS" onClick={() => this.props.navigateTo('fms/position/irs')} buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;" />
                    <div style={`display: ${this.props.activeUri.get().category === 'active' ? 'flex' : 'none'}; flex-direction: row;`}>
                        <Button
                            label="DEPARTURE"
                            disabled={this.departureButtonDisabled}
                            onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln/departure`)}
                            buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
                        />
                        <Button label="RTE SUMMARY" onClick={() => this.props.navigateTo('fms/data/route')} buttonStyle="margin-left: 50px; margin-bottom: 10px;" />
                    </div>
                    <Button label="NAVAIDS" onClick={() => this.props.navigateTo('fms/position/navaids')} buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;" />
                    <Button
                        label="FUEL&LOAD"
                        onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/fuel-load`)}
                        buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
                    />
                    <div style="display: flex; flex-direction: row;">
                        <Button
                            label="T.O. PERF"
                            onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/perf/to`)}
                            buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px; height: 40px;"
                        />
                        <div style="flex-grow: 1" />
                        <Button label="CPNY T.O.<br />REQUEST" onClick={() => console.log('CPNY T.O. REQUEST')} buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;" />
                    </div>

                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

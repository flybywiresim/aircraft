/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirportFormat, CostIndexFormat, CrzTempFormat, FlightLevelFormat, LongAlphanumericFormat, TripWindFormat, TropoFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { maxCertifiedAlt } from 'shared/constants';

interface MfdFmsActiveInitProps extends MfdComponentProps {
}

export class MfdFmsActiveInit extends DisplayComponent<MfdFmsActiveInitProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private fltNbr = Subject.create<string>(null);

    private fromIcao = Subject.create<string>(null);

    private toIcao = Subject.create<string>(null);

    private altnIcao = Subject.create<string>(null);

    private cpnyRte = Subject.create<string>(null);

    private altnRte = Subject.create<string>(null);

    private crzFl = Subject.create<number>(null);

    private crzTemp = Subject.create<number>(null);

    private costIndex = Subject.create<number>(null);

    private tropoAlt = Subject.create<number>(null);

    private tripWind = Subject.create<number>(null);

    private cpnyRteMandatory = Subject.create(true);

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
        this.subs.push(this.fromIcao.sub((val) => this.cpnyRteMandatory.set(!val || !this.toIcao.get())));
        this.subs.push(this.toIcao.sub((val) => this.cpnyRteMandatory.set(!this.fromIcao.get() || !val)));
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
                            isMandatory={Subject.create(true)}
                            value={this.fltNbr}
                            containerStyle="width: 200px; margin-right: 5px;"
                        />
                        <Button onClick={() => this.props.navigateTo('fms/data/status')} containerStyle="margin-right: 10px; width: 200px;">ACFT STATUS</Button>
                        <div style="flex-grow: 1" />
                        <Button onClick={() => console.log('CPNY F-PLN REQUEST')} containerStyle="width: 175px;">
                            CPNY F-PLN
                            <br />
                            REQUEST
                        </Button>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 10px; margin-bottom: 10px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">FROM</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            isMandatory={Subject.create(true)}
                            value={this.fromIcao}
                        />
                        <div class="MFDLabel" style="margin: 0px 10px 0px 10px;">TO</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            isMandatory={Subject.create(true)}
                            value={this.toIcao}
                        />
                        <div class="MFDLabel" style="margin: 0px 10px 0px 10px;">ALTN</div>
                        <InputField<string>
                            dataEntryFormat={new AirportFormat()}
                            isMandatory={Subject.create(true)}
                            value={this.altnIcao}
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CPNY RTE</div>
                        <InputField<string>
                            dataEntryFormat={new LongAlphanumericFormat()}
                            isMandatory={this.cpnyRteMandatory}
                            value={this.cpnyRte}
                            containerStyle="width: 200px; margin-right: 5px;"
                        />
                        <Button onClick={() => console.log('RTE SEL')} containerStyle="margin-right: 10px; width: 200px;">RTE SEL</Button>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px; border-bottom: 1px solid lightgrey; margin-bottom: 25px; padding-bottom: 25px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">ALTN RTE</div>
                        <InputField<string>
                            dataEntryFormat={new LongAlphanumericFormat()}
                            isMandatory={Subject.create(true)}
                            value={this.altnRte}
                            containerStyle="width: 200px; margin-right: 5px;"
                        />
                        <Button onClick={() => console.log('ALTN RTE SEL')} containerStyle="margin-right: 10px; width: 200px;">ALTN RTE SEL</Button>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CRZ FL</div>
                        <InputField<number>
                            dataEntryFormat={new FlightLevelFormat(Subject.create(100), Subject.create(maxCertifiedAlt))}
                            isMandatory={Subject.create(true)}
                            value={this.crzFl}
                            containerStyle="margin-right: 25px;"
                        />
                        <div class="MFDLabel" style="text-align: right; padding-right: 5px;">CRZ TEMP</div>
                        <InputField<number>
                            dataEntryFormat={new CrzTempFormat()}
                            isMandatory={Subject.create(false)}
                            value={this.crzTemp}
                            containerStyle="width: 110px; justify-content: flex-end;"
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 10px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px;">CI</div>
                        <InputField<number>
                            dataEntryFormat={new CostIndexFormat()}
                            isMandatory={Subject.create(true)}
                            value={this.costIndex}
                            containerStyle="width: 70px; margin-right: 90px; justify-content: center;"
                        />
                        <div class="MFDLabel" style="text-align: right; padding-right: 5px;">TROPO</div>
                        <InputField<number>
                            dataEntryFormat={new TropoFormat()}
                            isMandatory={Subject.create(false)}
                            value={this.tropoAlt}
                        />
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center; margin-top: 5px;border-bottom: 1px solid lightgrey; margin-bottom: 15px; padding-bottom: 35px;">
                        <div class="MFDLabel" style="width: 150px; text-align: right; padding-right: 5px; margin-top: 90px;">TRIP WIND</div>
                        <InputField<number>
                            dataEntryFormat={new TripWindFormat()}
                            isMandatory={Subject.create(false)}
                            value={this.tripWind}
                            containerStyle="width: 125px; margin-right: 80px; margin-top: 90px;"
                        />
                        <Button onClick={() => console.log('WIND')} containerStyle="margin-right: 10px; margin-top: 90px;">WIND</Button>
                        <div style="flex-grow: 1" />
                        <Button onClick={() => console.log('CPNY WIND REQUEST')} containerStyle="margin-right: 10px; justify-self: flex-end; width: 175px;">
                            CPNY WIND
                            <br />
                            REQUEST
                        </Button>
                    </div>
                    <Button onClick={() => this.props.navigateTo('fms/position/irs')} containerStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;">IRS</Button>
                    <div style="display: flex; flex-direction: row;">
                        <Button
                            onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln/departure`)}
                            containerStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
                        >
                            DEPARTURE
                        </Button>
                        <Button onClick={() => this.props.navigateTo('fms/data/route')} containerStyle="margin-left: 50px; margin-bottom: 10px;">RTE SUMMARY</Button>
                    </div>
                    <Button onClick={() => this.props.navigateTo('fms/position/navaids')} containerStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;">NAVAIDS</Button>
                    <Button
                        onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/fuel-load`)}
                        containerStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
                    >
                        FUEL&LOAD
                    </Button>
                    <div style="display: flex; flex-direction: row;">
                        <Button
                            onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/perf/to`)}
                            containerStyle="width: 160px; margin-left: 150px; margin-bottom: 10px; height: 40px;"
                        >
                            T.O. PERF
                        </Button>
                        <div style="flex-grow: 1" />
                        <Button onClick={() => console.log('CPNY WIND REQUEST')} containerStyle="margin-right: 10px; justify-self: flex-end; width: 175px;">
                            CPNY WIND
                            <br />
                            REQUEST
                        </Button>
                    </div>

                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

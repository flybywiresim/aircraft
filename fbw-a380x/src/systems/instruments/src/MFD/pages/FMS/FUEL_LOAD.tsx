/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './fuel_load.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { CostIndexFormat, PaxNbrFormat, PercentageFormat, TimeHHMMFormat, WeightFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { maxAltnFuel, maxBlockFuel, maxFinalFuel, maxJtsnGw, maxRteRsvFuel, maxRteRsvFuelPerc, maxTaxiFuel, maxZfw, maxZfwCg, minZfwCg } from 'shared/PerformanceConstants';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {
    instrument: BaseInstrument;
}

export class MfdFmsFuelLoad extends DisplayComponent<MfdFmsFuelLoadProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private zfw = Subject.create<number>(null);

    private zfwCg = Subject.create<number>(null);

    private blockFuel = Subject.create<number>(null);

    private taxiFuel = Subject.create<number>(null);

    private paxNbr = Subject.create<number>(null);

    private costIndex = Subject.create<number>(null);

    private rteRsvFuelWeight = Subject.create<number>(null);

    private rteRsvFuelPercentage = Subject.create<number>(null);

    private jtsnGw = Subject.create<number>(null);

    private altnFuel = Subject.create<number>(null);

    private finalFuelWeight = Subject.create<number>(null);

    private finalFuelTime = Subject.create<number>(null);

    private minFuelAtDest = Subject.create<number>(null);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/FUEL&LOAD');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/FUEL&LOAD');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/FUEL&LOAD');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/FUEL&LOAD');
                break;

            default:
                this.activePageTitle.set('ACTIVE/FUEL&LOAD');
                break;
            }
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
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="mfd-page-container">
                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px 25px 10px 25px;">
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">GW</span>
                            <span class="mfd-value-green">---.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">CG</span>
                            <span class="mfd-value-green">--.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">%</span>
                        </div>
                        <div class="mfd-label-value-container">
                            <span class="mfd-label mfd-spacing-right">FOB</span>
                            <span class="mfd-value-green">---.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center; ">
                        <div class="mfd-label mfd-spacing-right fuelLoad">
                            ZFW
                        </div>
                        <InputField<number>
                            dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxZfw))}
                            value={this.zfw}
                            mandatory={Subject.create(true)}
                            canBeCleared={Subject.create(false)}
                            alignText="flex-end"
                            containerStyle="width: 150px;"
                        />
                        <div class="mfd-label mfd-spacing-right fuelLoad">
                            ZFWCG
                        </div>
                        <InputField<number>
                            dataEntryFormat={new PercentageFormat(Subject.create(minZfwCg), Subject.create(maxZfwCg))}
                            value={this.zfwCg}
                            mandatory={Subject.create(true)}
                            canBeCleared={Subject.create(false)}
                            alignText="center"
                            containerStyle="width: 100px;"
                        />
                    </div>
                    <div class="mfd-fms-fuel-load-block-line">
                        <div class="mfd-label mfd-spacing-right fuelLoad">
                            BLOCK
                        </div>
                        <InputField<number>
                            dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel))}
                            value={this.blockFuel}
                            mandatory={Subject.create(true)}
                            alignText="flex-end"
                            containerStyle="width: 150px;"
                        />
                        <div style="display: flex; flex: 1; justify-content: center;">
                            <Button
                                label={Subject.create(
                                    <div style="display: flex; flex-direction: row;">
                                        <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                            FUEL
                                            <br />
                                            PLANNING
                                        </span>
                                        <span style="display: flex; align-items: center; justify-content: center;">*</span>
                                    </div>,
                                )}
                                onClick={() => console.log('FUEL PLANNING')}
                                buttonStyle="padding-right: 2px;"
                            />
                        </div>
                    </div>
                    <div class="mfd-fms-fuel-load-middle-grid">
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            TAXI
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel))}
                                value={this.taxiFuel}
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div />
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            PAX NBR
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new PaxNbrFormat()}
                                value={this.paxNbr}
                                mandatory={Subject.create(true)}
                                alignText="center"
                                containerStyle="width: 75px;"
                            />
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            TRIP
                        </div>
                        <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="mfd-value-green">---.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                            <span class="mfd-value-green">--:--</span>
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            CI
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new CostIndexFormat()}
                                value={this.costIndex}
                                mandatory={Subject.create(true)}
                                alignText="center"
                                containerStyle="width: 75px;"
                            />
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            RTE RSV
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxRteRsvFuel))}
                                value={this.rteRsvFuelWeight}
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div style="margin-bottom: 20px; margin-left: 5px">
                            <InputField<number>
                                dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(maxRteRsvFuelPerc))}
                                value={this.rteRsvFuelPercentage}
                                alignText="center"
                                containerStyle="width: 120px;"
                            />
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            JTSN GW
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxJtsnGw))}
                                value={this.jtsnGw}
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            ALTN
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel))}
                                value={this.altnFuel}
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                            <span class="mfd-value-green">--:--</span>
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            TOW
                        </div>
                        <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="mfd-value-green">---.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            FINAL
                        </div>
                        <div style="margin-bottom: 20px;">
                            <InputField<number>
                                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel))}
                                value={this.altnFuel}
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div style="margin-bottom: 20px; margin-left: 5px;">
                            <InputField<number>
                                dataEntryFormat={new TimeHHMMFormat()}
                                value={this.finalFuelTime}
                                alignText="center"
                                containerStyle="width: 120px;"
                            />
                        </div>
                        <div class="mfd-label mfd-spacing-right middleGrid">
                            LW
                        </div>
                        <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="mfd-value-green">---.-</span>
                            <span class="mfd-label-unit mfd-unit-trailing">T</span>
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: row; margin-top: 25px;">
                        <div style="width: 62.5%">
                            <div style="display: grid; grid-template-columns: auto auto auto auto;">
                                <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                                <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                                <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">
                                    UTC
                                </div>
                                <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">
                                    EFOB
                                </div>
                                <div class="mfd-label mfd-fms-fuel-load-dest-grid-middle-cell">
                                    DEST
                                </div>
                                <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">
                                    KFBW
                                </div>
                                <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">
                                    01:23
                                </div>
                                <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-middle-cell">
                                    <span class="mfd-value-green">43.2</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                                <div class="mfd-label" style="text-align: center; align-self: center;">
                                    ALTN
                                </div>
                                <div class="mfd-label bigger green" style="text-align: center; align-self: center;">
                                    KFBW
                                </div>
                                <div class="mfd-label bigger green" style="text-align: center; align-self: center;">
                                    02:34
                                </div>
                                <div class="mfd-label-value-container" style="align-self: center; justify-content: center;">
                                    <span class="mfd-value-green">33.2</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                            <div class="mfd-label" style="margin-bottom: 20px; text-align: center;">MIN FUEL AT DEST</div>
                            <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                                <InputField<number>
                                    dataEntryFormat={new WeightFormat()}
                                    value={this.minFuelAtDest}
                                    alignText="flex-end"
                                    containerStyle="width: 150px;"
                                />
                            </div>
                            <div class="mfd-label" style="margin-bottom: 5px; text-align: center;">EXTRA</div>
                            <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                <div class="mfd-label-value-container" style="margin-right: 20px;">
                                    <span class="mfd-value-green">10.2</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                                <span class="mfd-value-green">00:20</span>
                            </div>
                        </div>
                    </div>
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div style="width: 150px;">
                        <Button label="RETURN" onClick={() => this.props.uiService.navigateTo('back')} buttonStyle="margin-right: 5px;" />
                    </div>

                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} uiService={this.props.uiService} />
            </>
        );
    }
}

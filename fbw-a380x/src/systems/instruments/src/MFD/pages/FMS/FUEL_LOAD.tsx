/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './fuel_load.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { CostIndexFormat, PaxNbrFormat, PercentageFormat, TimeHHMMFormat, WeightFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { maxAltnFuel, maxBlockFuel, maxFinalFuel, maxJtsnGw, maxRteRsvFuel, maxRteRsvFuelPerc, maxTaxiFuel, maxZfw, maxZfwCg, minZfwCg } from 'shared/PerformanceConstants';

interface MfdFmsFuelLoadProps extends MfdComponentProps {
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

        this.subs.push(this.props.activeUri.sub((val) => {
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
                <div class="MFDPageContainer">
                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px 25px 10px 25px;">
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">GW</span>
                            <span class="MFDGreenValue">---.-</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">CG</span>
                            <span class="MFDGreenValue">--.-</span>
                            <span class="MFDUnitLabel trailingUnit">%</span>
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel spacingRight">FOB</span>
                            <span class="MFDGreenValue">---.-</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center; ">
                        <div class="MFDLabel spacingRight fuelLoad">
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
                        <div class="MFDLabel spacingRight fuelLoad">
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
                    <div class="fuelLoadBlockLine">
                        <div class="MFDLabel spacingRight fuelLoad">
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
                    <div class="fuelLoadMiddleGrid">
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
                            TRIP
                        </div>
                        <div class="MFDLabelValueContainer" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="MFDGreenValue">---.-</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                            <span class="MFDGreenValue">--:--</span>
                        </div>
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
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
                            <span class="MFDGreenValue">--:--</span>
                        </div>
                        <div class="MFDLabel spacingRight middleGrid">
                            TOW
                        </div>
                        <div class="MFDLabelValueContainer" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="MFDGreenValue">---.-</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                        <div class="MFDLabel spacingRight middleGrid">
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
                        <div class="MFDLabel spacingRight middleGrid">
                            LW
                        </div>
                        <div class="MFDLabelValueContainer" style="justify-content: flex-end; margin-bottom: 20px;">
                            <span class="MFDGreenValue">---.-</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: row; margin-top: 25px;">
                        <div style="width: 62.5%">
                            <div style="display: grid; grid-template-columns: auto auto auto auto;">
                                <div class="fuelLoadDestGridTopCell" />
                                <div class="fuelLoadDestGridTopCell" />
                                <div class="MFDLabel fuelLoadDestGridTopCell">
                                    UTC
                                </div>
                                <div class="MFDLabel fuelLoadDestGridTopCell">
                                    EFOB
                                </div>
                                <div class="MFDLabel fuelLoadDestGridMiddleCell">
                                    DEST
                                </div>
                                <div class="MFDLabel bigger green fuelLoadDestGridMiddleCell">
                                    KFBW
                                </div>
                                <div class="MFDLabel bigger green fuelLoadDestGridMiddleCell">
                                    01:23
                                </div>
                                <div class="MFDLabelValueContainer fuelLoadDestGridMiddleCell">
                                    <span class="MFDGreenValue">43.2</span>
                                    <span class="MFDUnitLabel trailingUnit">T</span>
                                </div>
                                <div class="MFDLabel" style="text-align: center; align-self: center;">
                                    ALTN
                                </div>
                                <div class="MFDLabel bigger green" style="text-align: center; align-self: center;">
                                    KFBW
                                </div>
                                <div class="MFDLabel bigger green" style="text-align: center; align-self: center;">
                                    02:34
                                </div>
                                <div class="MFDLabelValueContainer" style="align-self: center; justify-content: center;">
                                    <span class="MFDGreenValue">33.2</span>
                                    <span class="MFDUnitLabel trailingUnit">T</span>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                            <div class="MFDLabel" style="margin-bottom: 20px; text-align: center;">MIN FUEL AT DEST</div>
                            <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                                <InputField<number>
                                    dataEntryFormat={new WeightFormat()}
                                    value={this.minFuelAtDest}
                                    alignText="flex-end"
                                    containerStyle="width: 150px;"
                                />
                            </div>
                            <div class="MFDLabel" style="margin-bottom: 5px; text-align: center;">EXTRA</div>
                            <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                <div class="MFDLabelValueContainer" style="margin-right: 20px;">
                                    <span class="MFDGreenValue">10.2</span>
                                    <span class="MFDUnitLabel trailingUnit">T</span>
                                </div>
                                <span class="MFDGreenValue">00:20</span>
                            </div>
                        </div>
                    </div>
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div style="width: 150px;">
                        <Button label="RETURN" onClick={() => this.props.navigateTo('back')} buttonStyle="margin-right: 5px;" />
                    </div>

                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

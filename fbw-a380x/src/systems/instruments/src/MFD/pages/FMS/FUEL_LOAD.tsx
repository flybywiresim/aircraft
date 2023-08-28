/* eslint-disable jsx-a11y/label-has-associated-control */

import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './fuel_load.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { CostIndexFormat, PaxNbrFormat, PercentageFormat, TimeHHMMFormat, WeightFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { maxAltnFuel, maxBlockFuel, maxFinalFuel, maxJtsnGw, maxRteRsvFuel, maxRteRsvFuelPerc, maxTaxiFuel, maxZfw, maxZfwCg, minZfwCg } from 'shared/PerformanceConstants';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {
}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
    private zfw = Subject.create<number>(null);

    private zfwCg = Subject.create<number>(null);

    private blockFuel = Subject.create<number>(null);

    private fuelPlanningIsDisabled = Subject.create<boolean>(true);

    private computedBlockFuel = Subject.create<number>(undefined);

    private taxiFuel = Subject.create<number>(null); // TODO connect

    private paxNbr = Subject.create<number>(null); // TODO connect

    private costIndex = Subject.create<number>(null); // TODO connect

    private rteRsvFuelWeight = Subject.create<number>(null); // TODO connect

    private rteRsvFuelPercentage = Subject.create<number>(null); // TODO connect

    private jtsnGw = Subject.create<number>(null); // TODO connect

    private altnFuel = Subject.create<number>(null); // TODO connect

    private finalFuelWeight = Subject.create<number>(null); // TODO connect

    private finalFuelTime = Subject.create<number>(null); // TODO connect

    private minFuelAtDest = Subject.create<number>(null); // TODO connect

    protected onNewData() {
        console.time('FUEL_LOAD:onNewData');

        if (this.props.fmService.fmgc.data.routeReserveFuelIsPilotEntered.get() === false) {
            // Calculate Rte Rsv fuel for 5.0% reserve
            this.props.fmService.fmgc.data.routeReserveFuelWeightCalculated.set(10_200); // TODO
        }

        if (this.props.fmService.fmgc.data.finalFuelIsPilotEntered.get() === false) {
            // Calculate Rte Rsv fuel for 00:30 time
            this.props.fmService.fmgc.data.finalFuelWeightCalculated.set(13_800); // TODO
        }

        console.timeEnd('FUEL_LOAD:onNewData');
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <>
                {super.render()}
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
                            value={this.props.fmService.fmgc.data.zeroFuelWeight}
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
                            value={this.props.fmService.fmgc.data.zeroFuelWeightCenterOfGravity}
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
                            value={this.props.fmService.fmgc.data.blockFuel}
                            mandatory={Subject.create(true)}
                            alignText="flex-end"
                            containerStyle="width: 150px;"
                        />
                        <div style="display: flex; flex: 1; justify-content: center;">
                            <Button
                                disabled={this.fuelPlanningIsDisabled}
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
                                value={this.props.fmService.fmgc.data.taxiFuel}
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
                                value={this.props.fmService.fmgc.data.paxNumber}
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
                                value={this.props.fmService.fmgc.data.costIndex}
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
                                dataHandlerDuringValidation={async (v) => this.props.fmService.fmgc.data.routeReserveFuelWeightPilotEntry.set(v || undefined)}
                                enteredByPilot={this.props.fmService.fmgc.data.routeReserveFuelIsPilotEntered}
                                value={this.props.fmService.fmgc.data.routeReserveFuelWeight}
                                onModified={() => {}} // already handled during data validation
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div style="margin-bottom: 20px; margin-left: 5px">
                            <InputField<number>
                                dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(maxRteRsvFuelPerc))}
                                dataHandlerDuringValidation={async (v) => this.props.fmService.fmgc.data.routeReserveFuelPercentagePilotEntry.set(v)}
                                enteredByPilot={this.props.fmService.fmgc.data.routeReserveFuelIsPilotEntered}
                                value={this.props.fmService.fmgc.data.routeReserveFuelPercentage}
                                onModified={() => {}} // already handled during data validation
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
                                value={this.props.fmService.fmgc.data.jettisonGrossWeight}
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
                                value={this.props.fmService.fmgc.data.alternateFuel}
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
                                dataHandlerDuringValidation={async (v) => this.props.fmService.fmgc.data.finalFuelWeightPilotEntry.set(v)}
                                enteredByPilot={this.props.fmService.fmgc.data.finalFuelIsPilotEntered}
                                value={this.props.fmService.fmgc.data.finalFuelWeight}
                                onModified={() => {}} // already handled during data validation
                                alignText="flex-end"
                                containerStyle="width: 150px;"
                            />
                        </div>
                        <div style="margin-bottom: 20px; margin-left: 5px;">
                            <InputField<number>
                                dataEntryFormat={new TimeHHMMFormat()}
                                dataHandlerDuringValidation={async (v) => this.props.fmService.fmgc.data.finalFuelTimePilotEntry.set(v)}
                                enteredByPilot={this.props.fmService.fmgc.data.finalFuelIsPilotEntered}
                                value={this.props.fmService.fmgc.data.finalFuelTime}
                                onModified={() => {}} // already handled during data validation
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
                                    value={this.props.fmService.fmgc.data.minimumFuelAtDestination}
                                    alignText="flex-end"
                                    containerStyle="width: 150px;"
                                />
                            </div>
                            <div class="mfd-label" style="margin-bottom: 5px; text-align: center;">EXTRA</div>
                            <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                                <div class="mfd-label-value-container" style="margin-right: 20px;">
                                    <span class="mfd-value-green">--.-</span>
                                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                                </div>
                                <span class="mfd-value-green">--:--</span>
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
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

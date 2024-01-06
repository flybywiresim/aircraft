import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFplnAirways.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { PendingAirways } from '@fmgc/flightplanning/new/plans/PendingAirways';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirwayFormat, WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/MfdFlightManagementService';
import { Fix } from 'msfs-navdata';
import { FmsErrorType } from '@fmgc/FmsError';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { NXSystemMessages } from 'instruments/src/MFD/pages/FMS/legacy/NXSystemMessages';

interface MfdFmsFplnAirwaysProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnAirways extends FmsPage<MfdFmsFplnAirwaysProps> {
    private revisedFixIdent = Subject.create<string>('');

    private airwayLinesRef = FSComponent.createRef<HTMLDivElement>();

    private displayFromLine = Subject.create<number>(0);

    private disabledScrollDown = Subject.create(true);

    private disabledScrollUp = Subject.create(true);

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyFplnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    protected onNewData(): void {
        console.time('AIRWAYS:onNewData');

        if (this.props.fmService.revisedWaypoint()) {
            this.revisedFixIdent.set(this.props.fmService.revisedWaypoint().ident);
        }

        console.timeEnd('AIRWAYS:onNewData');
    }

    private renderNextLine(fromFix: Fix): void {
        // Render max. 10 items for now
        if (this.airwayLinesRef.instance.children.length <= 10) {
            const line = (
                <AirwayLine
                    fmService={this.props.fmService}
                    pendingAirways={this.loadedFlightPlan.pendingAirways}
                    fromFix={fromFix}
                    isFirstLine={false}
                    nextLineCallback={(fix) => this.renderNextLine(fix)}
                />
            );
            FSComponent.render(line, this.airwayLinesRef.instance);
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.tmpyActive.sub((v) => {
            this.returnButtonDiv.getOrDefault().style.visibility = (v ? 'hidden' : 'visible');
            this.tmpyFplnButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden');
        }, true));

        const firstLine = (
            <AirwayLine
                fmService={this.props.fmService}
                pendingAirways={this.loadedFlightPlan.pendingAirways}
                fromFix={this.props.fmService.revisedWaypoint()}
                isFirstLine
                nextLineCallback={(fix) => this.renderNextLine(fix)}
            />
        );
        FSComponent.render(firstLine, this.airwayLinesRef.instance);
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="fc" style="margin-top: 15px;">
                    <div class="fr" style="align-items: center;">
                        <span class="mfd-label" style="margin-left: 15px;">AIRWAYS FROM</span>
                        <span
                            class={{
                                'mfd-value-green': true,
                                'bigger': true,
                                'mfd-fms-yellow-text': this.tmpyActive,
                            }}
                            style="margin-left: 20px;"
                        >
                            {this.revisedFixIdent}

                        </span>
                    </div>
                    <div ref={this.airwayLinesRef} style="height: 630px; margin: 10px 30px 5px 30px; border: 2px outset lightgrey; padding: 15px;" />
                </div>
                <div style="display: flex; flex-direction: row; justify-content: center">
                    <IconButton
                        icon="double-down"
                        onClick={() => this.displayFromLine.set(this.displayFromLine.get() + 1)}
                        disabled={this.disabledScrollDown}
                        containerStyle="width: 60px; height: 60px; margin-right: 20px;"
                    />
                    <IconButton
                        icon="double-up"
                        onClick={() => this.displayFromLine.set(this.displayFromLine.get() - 1)}
                        disabled={this.disabledScrollUp}
                        containerStyle="width: 60px; height: 60px;"
                    />
                </div>
                <div style="flex-grow: 1" />
                <div class="mfd-fms-bottom-button-row">
                    <div ref={this.returnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="RETURN"
                            onClick={() => {
                                this.props.fmService.resetRevisedWaypoint();
                                this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`);
                            }}
                        />
                    </div>
                    <div ref={this.tmpyFplnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
                        <Button
                            label="TMPY F-PLN"
                            onClick={async () => {
                                this.loadedFlightPlan.pendingAirways.finalize();
                                this.props.fmService.resetRevisedWaypoint();
                                this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`);
                            }}
                            buttonStyle="color: #ffff00;"
                        />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

interface AirwayLineProps extends ComponentProps {
    fmService: MfdFlightManagementService;
    pendingAirways: PendingAirways;
    fromFix: Fix;
    isFirstLine: boolean;
    nextLineCallback: (f: Fix) => void;
}

class AirwayLine extends DisplayComponent<AirwayLineProps> {
    private db = new NavigationDatabase(NavigationDatabaseBackend.Msfs);

    public viaField = Subject.create<string | undefined>(undefined);

    private viaFieldDisabled = Subject.create(false);

    public toField = Subject.create<string | undefined>(undefined);

    private toFieldDisabled = Subject.create(this.props.isFirstLine);

    render(): VNode {
        return (
            <div class="fr" style="justify-content: space-between; margin-top: 15px; margin-bottom: 15px;">
                <div class="fr" style="align-items: center;">
                    <div class="mfd-label" style="margin-right: 5px;">VIA</div>
                    <InputField<string>
                        dataEntryFormat={new AirwayFormat()}
                        dataHandlerDuringValidation={async (v) => {
                            if (!v) {
                                return false;
                            }

                            if (v === 'DCT' && this.props.isFirstLine === false) {
                                this.viaFieldDisabled.set(true);
                                return true;
                            }

                            const fixes = await this.db.searchAllFix(this.props.fromFix.ident);
                            if (fixes.length === 0) {
                                this.props.fmService.mfd.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                                return false;
                            }
                            let chosenFix = fixes[0];
                            if (fixes.length > 1) {
                                chosenFix = await this.props.fmService.mfd.deduplicateFacilities(fixes);
                            }

                            const airways = await this.db.searchAirway(v, chosenFix);
                            if (airways.length === 0) {
                                this.props.fmService.mfd.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                                return false;
                            }

                            const success = this.props.pendingAirways.thenAirway(airways[0]);
                            if (success === true) {
                                this.viaFieldDisabled.set(true);
                                this.toFieldDisabled.set(false);
                            } else {
                                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.notAllowed);
                            }
                            return success;
                        }}
                        canBeCleared={Subject.create(false)}
                        value={this.viaField}
                        disabled={this.viaFieldDisabled}
                        alignText="center"
                        errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                    />
                </div>
                <div class="fr" style="align-items: center;">
                    <div class="mfd-label" style="margin-right: 5px;">TO</div>
                    <InputField<string>
                        dataEntryFormat={new WaypointFormat()}
                        dataHandlerDuringValidation={async (v) => {
                            if (!v) {
                                return false;
                            }
                            if (this.viaField.get() === undefined) {
                                this.viaField.set('DCT');
                                this.viaFieldDisabled.set(true);
                            }

                            const fixes = await this.db.searchAllFix(v);
                            if (fixes.length === 0) {
                                this.props.fmService.mfd.showFmsErrorMessage(FmsErrorType.NotInDatabase);
                                return false;
                            }
                            let chosenFix = fixes[0];
                            if (fixes.length > 1) {
                                chosenFix = await this.props.fmService.mfd.deduplicateFacilities(fixes);
                            }

                            const success = this.props.pendingAirways.thenTo(chosenFix);
                            if (success === true) {
                                this.toFieldDisabled.set(true);
                                this.props.nextLineCallback(chosenFix);
                            } else {
                                this.props.fmService.mfd.addMessageToQueue(NXSystemMessages.noIntersectionFound);
                            }
                            return success;
                        }}
                        canBeCleared={Subject.create(false)}
                        value={this.toField}
                        disabled={this.toFieldDisabled}
                        alignText="center"
                        errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                    />
                </div>
            </div>
        );
    }
}

import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { HoldDistFormat, HoldTimeFormat, InboundCourseFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { HoldData, HoldType } from '@fmgc/flightplanning/data/flightplan';
import { TurnDirection } from '@flybywiresim/fbw-sdk';

interface MfdFmsFplnHoldProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnHold extends FmsPage<MfdFmsFplnHoldProps> {
    private holdType = Subject.create<string>('MODIFIED HOLD AT');

    private waypointIdent = Subject.create<string>('WAYPOINT');

    private inboundCourse = Subject.create<number>(undefined);

    private turnSelectedIndex = Subject.create<number>(undefined);

    private legDefiningParameterSelectedIndex = Subject.create<number>(undefined);

    private legTime = Subject.create<number>(undefined);

    private legTimeRef = FSComponent.createRef<HTMLDivElement>();

    private legDistance = Subject.create<number>(undefined);

    private legDistanceRef = FSComponent.createRef<HTMLDivElement>();

    private lastExitUtc = Subject.create<string>(undefined);

    private lastExitEfob = Subject.create<string>(undefined);

    private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    protected onNewData(): void {
        console.time('HOLD:onNewData');

        if (this.props.fmService.revisedWaypoint()) {
            const leg = this.loadedFlightPlan.legElementAt(this.props.fmService.revisedWaypointIndex.get());
            const hold = (leg.modifiedHold !== undefined) ? leg.modifiedHold : leg.defaultHold;
            if (hold !== undefined) {
                switch (hold.type) {
                case HoldType.Computed:
                    this.holdType.set('COMPUTED HOLD AT ');
                    break;
                case HoldType.Pilot:
                    this.holdType.set('MODIFIED HOLD AT ');
                    break;
                default:
                    this.holdType.set('');
                    break;
                }
                this.waypointIdent.set(leg.ident);
                this.inboundCourse.set(hold.inboundMagneticCourse);
                this.turnSelectedIndex.set(hold?.turnDirection === TurnDirection.Left ? 0 : 1);
                this.legDefiningParameterSelectedIndex.set(hold?.time !== undefined ? 0 : 1);
                this.legTime.set(hold?.time);
                this.legDistance.set(hold?.distance);

                this.lastExitUtc.set('--:--');
                this.lastExitEfob.set('--');
            }
        }

        console.timeEnd('HOLD:onNewData');
    }

    private async modifyHold() {
        console.log(this.inboundCourse.get());
        if (this.props.fmService.revisedWaypoint()) {
            const desiredHold: HoldData = {
                type: HoldType.Pilot,
                distance: this.legDefiningParameterSelectedIndex.get() === 0 ? undefined : this.legDistance.get(),
                time: this.legDefiningParameterSelectedIndex.get() === 0 ? this.legTime.get() : undefined,
                inboundMagneticCourse: this.inboundCourse.get(),
                turnDirection: this.turnSelectedIndex.get() === 0 ? TurnDirection.Left : TurnDirection.Right,
            };

            await this.props.fmService.flightPlanService.addOrEditManualHold(
                this.props.fmService.revisedWaypointIndex.get(),
                Object.assign({}, desiredHold),
                desiredHold,
                this.loadedFlightPlan.legElementAt(this.props.fmService.revisedWaypointIndex.get()).defaultHold,
                this.props.fmService.revisedWaypointPlanIndex.get(),
                this.props.fmService.revisedWaypointIsAltn.get(),
            );
            this.onNewData();
        }
    }

    private showTimeOrDist() {
        switch (this.legDefiningParameterSelectedIndex.get()) {
        case 0: // TIME
            this.legTimeRef.instance.style.visibility = 'visible';
            this.legDistanceRef.instance.style.visibility = 'hidden';
            break;
        case 1: // DIST
            this.legTimeRef.instance.style.visibility = 'hidden';
            this.legDistanceRef.instance.style.visibility = 'visible';
            break;
        default:
            this.legTimeRef.instance.style.visibility = 'hidden';
            this.legDistanceRef.instance.style.visibility = 'hidden';
            break;
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.tmpyActive.sub((v) => {
            this.returnButtonDiv.getOrDefault().style.visibility = (v ? 'hidden' : 'visible');
            this.tmpyInsertButtonDiv.getOrDefault().style.visibility = (v ? 'visible' : 'hidden');
        }, true));

        this.subs.push(this.legDefiningParameterSelectedIndex.sub(() => {
            this.showTimeOrDist();
            this.modifyHold();
        }));

        this.subs.push(this.inboundCourse.sub(() => this.modifyHold()));
        this.subs.push(this.turnSelectedIndex.sub(() => this.modifyHold()));
        this.subs.push(this.legTime.sub(() => this.modifyHold()));
        this.subs.push(this.legDistance.sub(() => this.modifyHold()));

        this.showTimeOrDist();
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div style="display: flex; flex-direction: row;">
                    <div class="mfd-fms-fpln-labeled-box-container" style="flex-grow: 1;">
                        <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
                            {this.holdType}
                            {' '}
                            <span class="mfd-label green bigger">{this.waypointIdent}</span>
                        </span>
                        <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">INBOUND CRS</span>
                        <div style="margin-left: 75px;">
                            <InputField<number>
                                value={this.inboundCourse}
                                dataEntryFormat={new InboundCourseFormat()}
                                tmpyActive={this.tmpyActive}
                                errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                            />
                        </div>
                        <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">TURN</span>
                        <div style="margin-left: 75px;">
                            <RadioButtonGroup
                                idPrefix="holdTurnRadio"
                                selectedIndex={this.turnSelectedIndex}
                                values={['LEFT', 'RIGHT']}
                                tmpyActive={this.tmpyActive}
                            />
                        </div>
                        <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">LEG DEFINING PARAMETER</span>
                        <div style="display: flex; flex-direction: row; margin-left: 75px;">
                            <RadioButtonGroup
                                idPrefix="holdDefiningParameterRadio"
                                selectedIndex={this.legDefiningParameterSelectedIndex}
                                values={['TIME', 'DIST']}
                                tmpyActive={this.tmpyActive}
                            />
                            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-left: 30px;">
                                <div ref={this.legTimeRef}>
                                    <InputField<number>
                                        dataEntryFormat={new HoldTimeFormat()}
                                        value={this.legTime}
                                        tmpyActive={this.tmpyActive}
                                        errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                    />
                                </div>
                                <div ref={this.legDistanceRef}>
                                    <InputField<number>
                                        dataEntryFormat={new HoldDistFormat()}
                                        value={this.legDistance}
                                        tmpyActive={this.tmpyActive}
                                        errorHandler={(e) => this.props.fmService.mfd.showFmsErrorMessage(e)}
                                    />
                                </div>
                            </div>
                        </div>
                        <span class="mfd-label" style="width: 100%; margin-top: 50px; padding-top: 50px; margin-bottom: 30px; border-top: 1px solid lightgrey;">
                            LAST EXIT (FOR EXTRA FUEL 0 AT ALTN)
                        </span>
                        <div style="display: grid; grid-template-columns: 20% 30% 30%; justify-content: center; align-items: center">
                            <div class="mfd-label">AT</div>
                            <div class="mfd-label" style="align-self: center;">UTC</div>
                            <div class="mfd-label">EFOB</div>
                            <div />
                            <div class="mfd-value-magenta">{this.lastExitUtc}</div>
                            <div class="mfd-label-value-container">

                                <span class="mfd-value-magenta">{this.lastExitEfob}</span>
                                <span class="mfd-label-unit mfd-unit-trailing">T</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; margin-top: 40px;">
                        <Button label="DATABASE" onClick={() => console.warn('DATABASE HOLD NOT IMPLEMENTED')} buttonStyle="padding: 20px; margin: 5px;" disabled={Subject.create(true)} />
                        <Button
                            label="COMPUTED"
                            onClick={() => {
                                if (this.props.fmService.revisedWaypoint()) {
                                    this.props.fmService.flightPlanService.revertHoldToComputed(
                                        this.props.fmService.revisedWaypointIndex.get(),
                                        this.props.fmService.revisedWaypointPlanIndex.get(),
                                        this.props.fmService.revisedWaypointIsAltn.get(),
                                    );
                                }
                            }}
                            buttonStyle="padding: 20px; margin: 5px;"
                        />
                    </div>
                </div>
                <div style="flex-grow: 1;" />
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <div ref={this.returnButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                        <Button
                            label="RETURN"
                            onClick={() => this.props.uiService.navigateTo('back')}
                        />
                    </div>
                    <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                        <Button
                            label="TMPY F-PLN"
                            onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/f-pln`)}
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

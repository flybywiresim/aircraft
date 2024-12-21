import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFpln.scss';
import './MfdFmsFplnHold.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { HoldDistFormat, HoldTimeFormat, InboundCourseFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { HoldData, HoldType } from '@fmgc/flightplanning/data/flightplan';
import { TurnDirection } from '@flybywiresim/fbw-sdk';

interface MfdFmsFplnHoldProps extends AbstractMfdPageProps {}

export class MfdFmsFplnHold extends FmsPage<MfdFmsFplnHoldProps> {
  private holdType = Subject.create<string>('MODIFIED HOLD AT');

  private waypointIdent = Subject.create<string>('WAYPOINT');

  private inboundCourse = Subject.create<number | null>(null);

  private turnSelectedIndex = Subject.create<number | null>(null);

  private legDefiningParameterSelectedIndex = Subject.create<number | null>(null);

  private legTime = Subject.create<number | null>(null);

  private legTimeRef = FSComponent.createRef<HTMLDivElement>();

  private legDistance = Subject.create<number | null>(null);

  private legDistanceRef = FSComponent.createRef<HTMLDivElement>();

  private lastExitUtc = Subject.create<string | null>(null);

  private lastExitEfob = Subject.create<string | null>(null);

  private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  protected onNewData(): void {
    const revWptIdx = this.props.fmcService.master?.revisedWaypointIndex.get();
    if (this.props.fmcService.master?.revisedWaypoint() && revWptIdx) {
      const leg = this.loadedFlightPlan?.legElementAt(revWptIdx);
      const hold = leg?.modifiedHold !== undefined ? leg.modifiedHold : leg?.defaultHold;
      if (hold) {
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
        this.waypointIdent.set(leg?.ident ?? '');
        this.inboundCourse.set(hold.inboundMagneticCourse ?? null);
        this.turnSelectedIndex.set(hold?.turnDirection === TurnDirection.Left ? 0 : 1);
        this.legDefiningParameterSelectedIndex.set(hold?.time !== undefined ? 0 : 1);
        this.legTime.set(hold?.time ?? null);
        this.legDistance.set(hold?.distance ?? null);

        this.lastExitUtc.set('--:--');
        this.lastExitEfob.set('--');
      }
    }
  }

  private async modifyHold() {
    const revWptIdx = this.props.fmcService.master?.revisedWaypointIndex.get();
    if (revWptIdx && this.props.fmcService.master?.revisedWaypoint()) {
      const desiredHold: HoldData = {
        type: HoldType.Pilot,
        distance: this.legDefiningParameterSelectedIndex.get() === 0 ? undefined : this.legDistance.get() ?? undefined,
        time: this.legDefiningParameterSelectedIndex.get() === 0 ? this.legTime.get() ?? undefined : undefined,
        inboundMagneticCourse: this.inboundCourse.get() ?? undefined,
        turnDirection: this.turnSelectedIndex.get() === 0 ? TurnDirection.Left : TurnDirection.Right,
      };

      const fallbackDefaultHold: HoldData = {
        type: HoldType.Database,
        distance: 1,
        time: 1,
        inboundMagneticCourse: 0,
        turnDirection: TurnDirection.Right,
      };

      await this.props.fmcService.master.flightPlanService.addOrEditManualHold(
        revWptIdx,
        { ...desiredHold },
        desiredHold,
        this.loadedFlightPlan?.legElementAt(revWptIdx).defaultHold ?? fallbackDefaultHold,
        this.props.fmcService.master.revisedWaypointPlanIndex.get() ?? undefined,
        this.props.fmcService.master.revisedWaypointIsAltn.get() ?? undefined,
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

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (this.returnButtonDiv.getOrDefault() && this.tmpyInsertButtonDiv.getOrDefault()) {
          this.returnButtonDiv.instance.style.visibility = v ? 'hidden' : 'visible';
          this.tmpyInsertButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
    );

    this.subs.push(
      this.legDefiningParameterSelectedIndex.sub(() => {
        this.showTimeOrDist();
        this.modifyHold();
      }),
    );

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
        <div class="fr">
          <div class="mfd-fms-fpln-labeled-box-container" style="flex-grow: 1;">
            <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
              {this.holdType} <span class="mfd-label green bigger">{this.waypointIdent}</span>
            </span>
            <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">
              INBOUND CRS
            </span>
            <div style="margin-left: 75px;">
              <InputField<number>
                value={this.inboundCourse}
                dataEntryFormat={new InboundCourseFormat()}
                tmpyActive={this.tmpyActive}
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">
              TURN
            </span>
            <div style="margin-left: 75px;">
              <RadioButtonGroup
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_holdTurnRadio`}
                selectedIndex={this.turnSelectedIndex}
                values={['LEFT', 'RIGHT']}
                color={this.tmpyActive.map((it) => (it ? 'yellow' : 'cyan'))}
              />
            </div>
            <span class="mfd-label" style="margin-top: 50px; margin-bottom: 20px;">
              LEG DEFINING PARAMETER
            </span>
            <div style="display: flex; flex-direction: row; margin-left: 75px;">
              <RadioButtonGroup
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_holdDefiningParameterRadio`}
                selectedIndex={this.legDefiningParameterSelectedIndex}
                values={['TIME', 'DIST']}
                color={this.tmpyActive.map((it) => (it ? 'yellow' : 'cyan'))}
              />
              <div class="mfd-fpln-hold-timedist-box">
                <div ref={this.legTimeRef}>
                  <InputField<number>
                    dataEntryFormat={new HoldTimeFormat()}
                    value={this.legTime}
                    tmpyActive={this.tmpyActive}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div ref={this.legDistanceRef}>
                  <InputField<number>
                    dataEntryFormat={new HoldDistFormat()}
                    value={this.legDistance}
                    tmpyActive={this.tmpyActive}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
            </div>
            <span class="mfd-label mfd-fpln-hold-last-exit-label">LAST EXIT (FOR EXTRA FUEL 0 AT ALTN)</span>
            <div class="mfd-fpln-hold-grid">
              <div class="mfd-label">AT</div>
              <div class="mfd-label" style="align-self: center;">
                UTC
              </div>
              <div class="mfd-label">EFOB</div>
              <div />
              <div class="mfd-value magenta">{this.lastExitUtc}</div>
              <div class="mfd-label-value-container">
                <span class="mfd-value magenta">{this.lastExitEfob}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
            </div>
          </div>
          <div class="fc" style="margin-top: 40px;">
            <Button
              label="DATABASE"
              onClick={() => console.warn('DATABASE HOLD NOT IMPLEMENTED')}
              buttonStyle="padding: 20px; margin: 5px;"
              disabled={Subject.create(true)}
            />
            <Button
              label="COMPUTED"
              onClick={() => {
                const revWptIdx = this.props.fmcService.master?.revisedWaypointIndex.get();
                if (revWptIdx && this.props.fmcService.master?.revisedWaypoint()) {
                  this.props.fmcService.master.flightPlanService.revertHoldToComputed(
                    revWptIdx,
                    this.props.fmcService.master.revisedWaypointPlanIndex.get() ?? undefined,
                    this.props.fmcService.master.revisedWaypointIsAltn.get() ?? undefined,
                  );
                }
              }}
              buttonStyle="padding: 20px; margin: 5px;"
            />
          </div>
        </div>
        <div style="flex-grow: 1;" />
        <div class="fr" style="justify-content: space-between;">
          <div
            ref={this.returnButtonDiv}
            class="mfd-fpln-hold-button-with-creative-class-name-which-is-as-long-as-style-attribute"
          >
            <Button
              label="RETURN"
              onClick={() => {
                this.props.fmcService.master?.resetRevisedWaypoint();
                this.props.mfd.uiService.navigateTo('back');
              }}
            />
          </div>
          <div
            ref={this.tmpyInsertButtonDiv}
            class="mfd-fpln-hold-button-with-creative-class-name-which-is-as-long-as-style-attribute"
          >
            <Button
              label="TMPY F-PLN"
              onClick={() => {
                this.props.fmcService.master?.resetRevisedWaypoint();
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
              }}
              buttonStyle="color: yellow"
            />
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}

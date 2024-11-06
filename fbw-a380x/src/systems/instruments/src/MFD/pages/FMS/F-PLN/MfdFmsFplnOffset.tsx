import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFpln.scss';
import './MfdFmsFplnOffset.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlanIndex } from '@fmgc/index';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { OffsetAngleFormat, OffsetDistFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';

interface MfdFmsFplnOffsetProps extends AbstractMfdPageProps {}

export class MfdFmsFplnOffset extends FmsPage<MfdFmsFplnOffsetProps> {
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private availableWaypoints = ArraySubject.create<string>([]);

  private availableWaypointsToLegIndex: number[] = [];

  private selectedStartWaypointIndex = Subject.create<number | null>(null);

  private selectedEndWaypointIndex = Subject.create<number | null>(null);

  private manualWptIdent: string | null = '';

  private utcEta = Subject.create<string>('--:--');

  private distToWpt = Subject.create<string>('---');

  private offsetInterceptAngle = Subject.create<number | null>(null);

  private offsetDist = Subject.create<number | null>(null);

  private OffsetLRIndex = Subject.create<number | null>(1);

  protected onNewData(): void {
    this.offsetInterceptAngle.set(30);
    this.offsetDist.set(5);
    this.OffsetLRIndex.set(0);
    // Use active FPLN for building the list (page only works for active anyways)
    const revWptIdx = this.props.fmcService.master?.revisedWaypointIndex.get();
    this.selectedStartWaypointIndex.set(revWptIdx! - 2);

    const activeFpln = this.props.fmcService.master?.flightPlanService.active;
    if (activeFpln) {
      this.availableWaypointsToLegIndex = [];
      const wpt = activeFpln.allLegs
        .slice(activeFpln.activeLegIndex, activeFpln.firstMissedApproachLegIndex)
        .map((el, idx) => {
          if (el instanceof FlightPlanLeg && el.isXF()) {
            this.availableWaypointsToLegIndex.push(idx + activeFpln.activeLegIndex);
            return el.ident;
          }
          return null;
        })
        .filter((el) => el !== null) as readonly string[];
      if (wpt) {
        this.availableWaypoints.set(wpt);
      }
    }

    // Existance of TMPY fpln tells us that an offset is pending
    if (this.loadedFlightPlanIndex.get() === FlightPlanIndex.Temporary) {
      // If waypoint was revised select revised wpt
      const revWpt = this.props.fmcService.master?.revisedWaypoint();
      if (revWpt) {
        const selectedLegIndex = this.availableWaypoints.getArray().findIndex((it) => it === revWpt.ident);
        if (selectedLegIndex !== -1) {
          this.selectedStartWaypointIndex.set(selectedLegIndex);
        }
      }

      // Manual waypoint was entered. In this case, force dropdown field to display wpt ident without selecting it
      if (this.manualWptIdent) {
        this.selectedStartWaypointIndex.set(null);
        this.dropdownMenuRef.instance.forceLabel(this.manualWptIdent);
      }

      //TODO Display ETA; target waypoint is now activeLeg termination in temporary fpln
      if (this.loadedFlightPlan?.activeLeg instanceof FlightPlanLeg) {
        // No predictions for temporary fpln atm, so only distance is displayed
        this.distToWpt.set(this.loadedFlightPlan?.activeLeg?.calculated?.cumulativeDistance?.toFixed(0) ?? '---');
      }
    }
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="fr">
          <div style="display: flex; justify-content:space-between;">
            <div class="mfd-fms-fpln-offset-waypoint-text-grid">
              <div>
                <div>
                  <span class="mfd-label">START WPT</span>
                </div>
                <div style="margin-top: 15px;">
                  <DropdownMenu
                    ref={this.dropdownMenuRef}
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_offsetStartDropdown`}
                    selectedIndex={this.selectedStartWaypointIndex}
                    values={this.availableWaypoints}
                    freeTextAllowed
                    containerStyle="width: 175px;"
                    alignLabels="flex-start"
                    numberOfDigitsForInputField={7}
                    tmpyActive={this.tmpyActive}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
              <div>
                <div>
                  <span class="mfd-label">END WPT</span>
                </div>
                <div style="margin-top: 15px;">
                  <DropdownMenu
                    ref={this.dropdownMenuRef}
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_offsetEndDropdown`}
                    selectedIndex={this.selectedEndWaypointIndex}
                    values={this.availableWaypoints}
                    freeTextAllowed
                    containerStyle="width: 175px;"
                    alignLabels="flex-start"
                    numberOfDigitsForInputField={7}
                    tmpyActive={this.tmpyActive}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
              <div style="grid-row-start: span 2; border-left: 2px solid lightgrey; margin-right: 10px;" />
              <div class="mfd-offset-dist-angle-input-grid">
                <div style="margin-bottom: 20px;">
                  <span class="mfd-label">INTERCEPT ANGLE</span>
                </div>
                <div>
                  <InputField<number>
                    dataEntryFormat={new OffsetAngleFormat()}
                    value={this.offsetInterceptAngle}
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="margin-bottom: 10px; padding-top: 80px;">
                  <span class="mfd-label">OFFSET DIST</span>
                </div>
                <div class="mfd-offset-dist-input-grid">
                  <div style="padding-top: 35px;">
                    <InputField<number>
                      dataEntryFormat={new OffsetDistFormat()}
                      value={this.offsetDist}
                      errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div>
                    <RadioButtonGroup
                      values={['LEFT', 'RIGHT']}
                      selectedIndex={this.OffsetLRIndex}
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_offsetDirectLeftRight`}
                      additionalVerticalSpacing={15}
                      color={Subject.create('green')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

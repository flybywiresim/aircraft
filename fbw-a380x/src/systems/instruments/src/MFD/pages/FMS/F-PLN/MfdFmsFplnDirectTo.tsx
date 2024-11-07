import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFplnDirectTo.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlanIndex, WaypointEntryUtils } from '@fmgc/index';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { ADIRS } from 'instruments/src/MFD/shared/Adirs';

interface MfdFmsFplnDirectToProps extends AbstractMfdPageProps {}

enum DirectToOption {
  DIRECT = 0,
  DIRECT_WITH_ABEAM = 1,
  CRS_IN = 2,
  CRS_OUT = 3,
}

export class MfdFmsFplnDirectTo extends FmsPage<MfdFmsFplnDirectToProps> {
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private availableWaypoints = ArraySubject.create<string>([]);

  private availableWaypointsToLegIndex: number[] = [];

  private selectedWaypointIndex = Subject.create<number | null>(null);

  private manualWptIdent: string | null = '';

  private utcEta = Subject.create<string>('--:--');

  private distToWpt = Subject.create<string>('---');

  private directToOption = Subject.create<DirectToOption | null>(DirectToOption.DIRECT);

  private eraseButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private returnButtonDiv = FSComponent.createRef<HTMLDivElement>();

  private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

  protected onNewData(): void {
    // Use active FPLN for building the list (page only works for active anyways)
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

    // Existance of TMPY fpln is indicator for pending direct to revision
    if (this.loadedFlightPlanIndex.get() === FlightPlanIndex.Temporary) {
      // If waypoint was revised, select revised wpt
      const revWpt = this.props.fmcService.master?.revisedWaypoint();
      if (revWpt) {
        const selectedLegIndex = this.availableWaypoints.getArray().findIndex((it) => it === revWpt.ident);
        if (selectedLegIndex !== -1) {
          this.selectedWaypointIndex.set(selectedLegIndex);
        }
      }

      // Manual waypoint was entered. In this case, force dropdown field to display wpt ident without selecting it
      if (this.manualWptIdent) {
        this.selectedWaypointIndex.set(null);
        this.dropdownMenuRef.instance.forceLabel(this.manualWptIdent);
      }

      // TODO Display ETA; target waypoint is now activeLeg termination in temporary fpln
      if (this.loadedFlightPlan?.activeLeg instanceof FlightPlanLeg) {
        // No predictions for temporary fpln atm, so only distance is displayed
        this.distToWpt.set(this.loadedFlightPlan?.activeLeg?.calculated?.cumulativeDistance?.toFixed(0) ?? '---');
      }
    }
  }

  private async onDropdownModified(idx: number, text: string): Promise<void> {
    if (this.props.fmcService.master?.flightPlanService.hasTemporary) {
      await this.props.fmcService.master.flightPlanService.temporaryDelete();
      this.props.fmcService.master.resetRevisedWaypoint();
    }

    if (idx >= 0) {
      const legIndex = this.availableWaypointsToLegIndex[idx];
      this.props.fmcService.master?.setRevisedWaypoint(legIndex, FlightPlanIndex.Active, false);
      if (legIndex !== undefined) {
        this.selectedWaypointIndex.set(idx);
        this.manualWptIdent = null;
        const trueTrack = ADIRS.getTrueTrack();
        await this.props.fmcService.master?.flightPlanService.directToLeg(
          this.props.fmcService.master.navigation.getPpos() ?? { lat: 0, long: 0 },
          trueTrack?.isNormalOperation() ? trueTrack.value : 0,
          legIndex,
          this.directToOption.get() === DirectToOption.DIRECT_WITH_ABEAM,
          FlightPlanIndex.Active,
        );
      }
    } else if (this.props.fmcService.master) {
      const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmcService.master, text, true, undefined);
      if (wpt) {
        this.manualWptIdent = wpt.ident;
        await this.props.fmcService.master.flightPlanService.directToWaypoint(
          this.props.fmcService.master.navigation.getPpos() ?? { lat: 0, long: 0 },
          SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
          wpt,
          this.directToOption.get() === DirectToOption.DIRECT_WITH_ABEAM,
          FlightPlanIndex.Active,
        );
      }
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.onNewData();

    this.subs.push(
      this.tmpyActive.sub((v) => {
        if (
          this.eraseButtonDiv.getOrDefault() &&
          this.returnButtonDiv.getOrDefault() &&
          this.tmpyInsertButtonDiv.getOrDefault()
        ) {
          this.eraseButtonDiv.instance.style.display = v ? 'block' : 'none';
          this.returnButtonDiv.instance.style.display = v ? 'none' : 'block';
          this.tmpyInsertButtonDiv.instance.style.visibility = v ? 'visible' : 'hidden';
        }
      }, true),
    );
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="fr">
          <div style="flex: 1">
            <div class="fc">
              <div class="mfd-fms-direct-to-wpt-row">
                <span class="mfd-label">DIRECT TO</span>
                <div class="mfd-fms-direct-to-dropdown-div">
                  <DropdownMenu
                    ref={this.dropdownMenuRef}
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_directToDropdown`}
                    selectedIndex={this.selectedWaypointIndex}
                    values={this.availableWaypoints}
                    freeTextAllowed
                    containerStyle="width: 175px;"
                    alignLabels="flex-start"
                    onModified={(i, text) => {
                      if (i !== null) {
                        this.onDropdownModified(i, text);
                      }
                    }}
                    numberOfDigitsForInputField={7}
                    tmpyActive={this.tmpyActive}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
              <div class="mfd-fms-direct-to-wpt-info">
                <div class="mfd-fms-direct-to-utc-label">
                  <span class="mfd-label">UTC</span>
                </div>
                <div class="mfd-fms-direct-to-utc-value">
                  <span
                    class={{
                      'mfd-value': true,
                      bigger: true,
                      'mfd-fms-yellow-text': this.tmpyActive,
                    }}
                  >
                    {this.utcEta}
                  </span>
                </div>
                <div />
                <div class="mfd-fms-direct-to-utc-label">
                  <span class="mfd-label">DIST</span>
                </div>
                <div class="mfd-fms-direct-to-utc-value">
                  <span
                    class={{
                      'mfd-value': true,
                      bigger: true,
                      'mfd-fms-yellow-text': this.tmpyActive,
                    }}
                  >
                    {this.distToWpt}
                  </span>
                </div>
                <div>
                  <span class="mfd-label-unit mfd-unit-trailing">NM</span>
                </div>
              </div>
            </div>
          </div>
          <div style="flex: 1">
            <div class="mfd-fms-direct-to-options-box">
              <span class="mfd-label">OPTIONS</span>
              <div class="mfd-fms-direct-to-options">
                <RadioButtonGroup
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_directToOptionsRadio`}
                  values={['DIRECT', 'DIRECT WITH ABEAM', 'CRS IN', 'CRS OUT']}
                  valuesDisabled={Subject.create([false, true, true, true])}
                  selectedIndex={this.directToOption}
                  color={this.tmpyActive.map((it) => (it ? 'yellow' : 'cyan'))}
                />
              </div>
            </div>
          </div>
        </div>
        <div style="flex-grow: 1;" />
        <div class="mfd-fms-bottom-button-row">
          <div ref={this.eraseButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
            <Button
              label="ERASE<br />DIR TO*"
              onClick={async () => {
                await this.props.fmcService.master?.flightPlanService.temporaryDelete();
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
              }}
              buttonStyle="color: #e68000;"
            />
          </div>
          <div ref={this.returnButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
            <Button
              label="RETURN"
              onClick={() =>
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`)
              }
            />
          </div>
          <div ref={this.tmpyInsertButtonDiv} class="mfd-fms-direct-to-erase-return-btn">
            <Button
              label="INSERT<br />DIR TO*"
              onClick={async () => {
                SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
                this.props.fmcService.master?.flightPlanService.temporaryInsert();
                this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
              }}
              buttonStyle="color: #e68000;"
            />
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}

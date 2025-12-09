import { DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { ObservableFlightPlanManager } from '@fmgc/flightplanning/ObservableFlightPlanManager';
import { FmcServiceInterface } from '../../FMC/FmcServiceInterface';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { MfdDisplayInterface } from '../../MFD';

export interface FlightPlanFooterProps {
  bus: EventBus;

  mfd: FmsDisplayInterface & MfdDisplayInterface;

  fmcService: FmcServiceInterface;
}

export class FlightPlanFooter extends DisplayComponent<FlightPlanFooterProps> {
  private readonly flightPlanManager = new ObservableFlightPlanManager(
    this.props.bus,
    this.props.fmcService.master!.flightPlanService,
  );

  public render(): VNode | null {
    return (
      <div class="fr" style="justify-content: space-between;">
        <div
          class="mfd-fpln-hold-button-with-creative-class-name-which-is-as-long-as-style-attribute"
          style={{ visibility: this.flightPlanManager.temporaryPlanExists.map((it) => (it ? 'hidden' : 'visible')) }}
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
          class="mfd-fpln-hold-button-with-creative-class-name-which-is-as-long-as-style-attribute"
          style={{ visibility: this.flightPlanManager.temporaryPlanExists.map((it) => (it ? 'visible' : 'hidden')) }}
        >
          <Button
            label="TMPY F-PLN"
            onClick={() => {
              this.props.fmcService.master?.resetRevisedWaypoint();
              this.props.mfd.uiService.navigateTo(`fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln`);
            }}
            buttonStyle="color: #ffd200;"
          />
        </div>
      </div>
    );
  }
}

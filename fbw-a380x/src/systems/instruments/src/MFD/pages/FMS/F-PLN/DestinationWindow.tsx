import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';

interface DestinationWindowProps extends ComponentProps {
  fmcService: FmcServiceInterface;
  flightPlanInterface: FlightPlanInterface;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  visible: Subject<boolean>;
}
export class DestinationWindow extends DisplayComponent<DestinationWindowProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly identRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly newDest = Subject.create<string | null>(null);

  private onModified(newDest: string | null): void {
    if (newDest) {
      const revWpt = this.props.fmcService.master.revisedLegIndex.get();
      if (newDest.length === 4 && revWpt) {
        this.props.flightPlanInterface.newDest(
          revWpt,
          newDest,
          this.props.fmcService.master.revisedLegPlanIndex.get() ?? undefined,
          this.props.fmcService.master.revisedLegIsAltn.get() ?? undefined,
        );
        this.props.fmcService.master.acInterface.updateFmsData();
      }
      this.props.visible.set(false);
      this.newDest.set('');
      this.props.fmcService.master.resetRevisedWaypoint();
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.visible.sub((val) => {
        if (this.topRef.getOrDefault()) {
          this.topRef.instance.style.display = val ? 'block' : 'none';
          this.newDest.set('');
        }
      }, true),
    );

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.revisedLegIndex.sub(() => {
          if (this.props.fmcService.master.revisedWaypoint()) {
            this.identRef.instance.innerText = this.props.fmcService.master.revisedWaypoint()?.ident ?? '';
          }
        }),
      );
    }
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.topRef} style="position: relative;">
        <div class="mfd-dialog mfd-fms-new-dest-box">
          <div class="mfd-fms-new-dest-box-inner">
            <span class="mfd-label">
              NEW DEST FROM{' '}
              <span ref={this.identRef} class="mfd-value bigger">
                {this.props.fmcService.master.revisedWaypoint()?.ident ?? ''}
              </span>
            </span>
            <div style="align-self: center; margin-top: 50px;">
              <InputField<string>
                dataEntryFormat={new AirportFormat()}
                dataHandlerDuringValidation={async (icao) => this.onModified(icao)}
                mandatory={Subject.create(false)}
                canBeCleared={Subject.create(true)}
                inactive={Subject.create(false)}
                value={this.newDest}
                alignText="center"
                errorHandler={(e) => this.props.mfd.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
          </div>
          <div class="fr" style="justify-content: space-between">
            <Button
              label="CANCEL"
              onClick={() => {
                Coherent.trigger('UNFOCUS_INPUT_FIELD');
                this.props.fmcService.master.resetRevisedWaypoint();
                this.props.visible.set(false);
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

import {
  ArraySubject,
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  SubscribableArray,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmsError } from '@fmgc/FmsError';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';

export type NextWptInfo = {
  ident: string;
  originalLegIndex: number;
};
interface InsertNextWptFromWindowProps extends ComponentProps {
  fmcService: FmcServiceInterface;
  flightPlanInterface: FlightPlanInterface;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  availableWaypoints: SubscribableArray<NextWptInfo>;
  visible: Subject<boolean>;
  contentContainerStyle?: string;
  captOrFo: 'CAPT' | 'FO';
}
export class InsertNextWptFromWindow extends DisplayComponent<InsertNextWptFromWindowProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly identRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly coordinatesRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly nextWpt = Subject.create<string>('');

  private readonly selectedWaypointIndex = Subject.create<number | null>(null);

  private readonly availableWaypointsString = ArraySubject.create<string>([]);

  private async onModified(idx: number | null, text: string): Promise<void> {
    const revWptPlanIndex = this.props.fmcService.master.revisedLegPlanIndex.get();
    if (!this.props.fmcService.master || revWptPlanIndex == null) {
      return;
    }

    if (idx !== null && idx >= 0) {
      const wptInfo = this.props.availableWaypoints.get(idx);
      const revWpt = this.props.fmcService.master.revisedLegIndex.get();
      const fpln = this.props.fmcService.master.revisedLegIsAltn.get()
        ? this.props.flightPlanInterface.get(revWptPlanIndex).alternateFlightPlan
        : this.props.flightPlanInterface.get(revWptPlanIndex);
      const wptToInsert = fpln?.legElementAt(wptInfo.originalLegIndex).definition.waypoint;
      if (
        this.props.availableWaypoints.get(idx) &&
        fpln?.hasElement(wptInfo.originalLegIndex) &&
        fpln.elementAt(wptInfo.originalLegIndex).isDiscontinuity === false &&
        wptToInsert &&
        revWpt
      ) {
        this.selectedWaypointIndex.set(idx);
        this.props.visible.set(false);
        await this.props.flightPlanInterface.nextWaypoint(
          revWpt,
          wptToInsert,
          this.props.fmcService.master.revisedLegPlanIndex.get() ?? undefined,
          this.props.fmcService.master.revisedLegIsAltn.get() ?? undefined,
        );
      }
    } else {
      try {
        const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmcService.master, text, true, undefined);
        const revWpt = this.props.fmcService.master.revisedLegIndex.get();
        if (wpt && revWpt) {
          await this.props.flightPlanInterface.nextWaypoint(
            revWpt,
            wpt,
            this.props.fmcService.master.revisedLegPlanIndex.get() ?? undefined,
            this.props.fmcService.master.revisedLegIsAltn.get() ?? undefined,
          );
        }
      } catch (msg: unknown) {
        if (msg instanceof FmsError) {
          this.props.fmcService.master.showFmsErrorMessage(msg.type);
        }
      }
      this.props.visible.set(false);
    }
    this.props.fmcService.master.resetRevisedWaypoint();
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.visible.sub((val) => {
        if (this.topRef.getOrDefault()) {
          this.topRef.instance.style.display = val ? 'block' : 'none';
          this.selectedWaypointIndex.set(null);
          this.nextWpt.set('');
        }
      }, true),
    );

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.revisedLegIndex.sub((wptIdx) => {
          if (wptIdx && this.props.fmcService.master.revisedWaypoint()) {
            const fpln = this.props.flightPlanInterface.get(
              this.props.fmcService.master.revisedLegPlanIndex.get() ?? FlightPlanIndex.Active,
            );

            if (
              fpln.elementAt(wptIdx)?.isDiscontinuity === false &&
              this.identRef.getOrDefault() &&
              this.coordinatesRef.getOrDefault()
            ) {
              const wpt = fpln.legElementAt(wptIdx);
              this.identRef.instance.innerText = wpt.ident;
              this.selectedWaypointIndex.set(null);

              if (wpt.definition.waypoint) {
                this.coordinatesRef.instance.innerText = coordinateToString(wpt.definition.waypoint.location, false);
              }
            }
          }
        }),
      );
    }

    this.subs.push(
      this.props.availableWaypoints.sub((idx, type, item, arr) => {
        this.availableWaypointsString.set(arr.map((it) => it.ident));
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.topRef} style="position: relative;">
        <div class="mfd-dialog mfd-fms-insert-next-wpt-box" style={`${this.props.contentContainerStyle ?? ''}`}>
          <div class="mfd-fms-insert-next-wpt-box-inner">
            <span class="mfd-label">
              INSERT NEXT WPT FROM <span ref={this.identRef} class="mfd-value bigger" />
            </span>
            <span style="margin-left: 50px; margin-top: 10px;">
              <span ref={this.coordinatesRef} class="mfd-value bigger" />
            </span>
            <div style="margin-left: 50px; margin-top: 10px;">
              <DropdownMenu
                idPrefix={`${this.props.captOrFo}_MFD_insertNextWptDropdown`}
                selectedIndex={this.selectedWaypointIndex}
                values={this.availableWaypointsString}
                freeTextAllowed
                containerStyle="width: 175px;"
                alignLabels="flex-start"
                onModified={(i, text) => this.onModified(i, text)}
                numberOfDigitsForInputField={7}
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

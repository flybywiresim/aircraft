import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { WaypointEntryUtils } from '@fmgc/flightplanning/new/WaypointEntryUtils';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/FlightManagementService';
import { FlightPlanIndex } from '@fmgc/index';

interface InsertNextWptFromWindowProps extends ComponentProps {
    fmService: MfdFlightManagementService;
    revisedWaypointIndex: Subscribable<number>;
    planIndex: Subscribable<FlightPlanIndex>;
    altn: Subscribable<boolean>;
    availableWaypoints: SubscribableArray<string>;
    visible: Subject<boolean>;
    contentContainerStyle?: string;
}
export class InsertNextWptFromWindow extends DisplayComponent<InsertNextWptFromWindowProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private identRef = FSComponent.createRef<HTMLSpanElement>();

    private coordinatesRef = FSComponent.createRef<HTMLSpanElement>();

    private nextWpt = Subject.create<string>('');

    private selectedWaypointIndex = Subject.create<number>(0);

    private async onModified(idx: number, text: string): Promise<void> {
        if (idx >= 0) {
            if (this.props.availableWaypoints.get(idx)) {
                this.selectedWaypointIndex.set(idx);
                this.props.visible.set(false);
                await this.props.fmService.flightPlanService.nextWaypoint(
                    this.props.revisedWaypointIndex.get() + idx,
                    this.props.fmService.flightPlanService.get(this.props.planIndex.get()).legElementAt(this.props.revisedWaypointIndex.get()).definition.waypoint,
                    this.props.planIndex.get(),
                    this.props.altn.get(),
                );
            }
        } else {
            const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmService.mfd, text);
            this.props.visible.set(false);
            await this.props.fmService.flightPlanService.nextWaypoint(this.props.revisedWaypointIndex.get(), wpt, this.props.planIndex.get(), this.props.altn.get());
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.visible.sub((val) => {
            this.topRef.getOrDefault().style.display = val ? 'block' : 'none';
            this.selectedWaypointIndex.set(null);
            this.nextWpt.set('');
        }, true));

        this.subs.push(this.props.revisedWaypointIndex.sub((wptIdx) => {
            const wpt = this.props.fmService.flightPlanService.get(this.props.planIndex.get()).legElementAt(wptIdx);
            this.identRef.instance.innerText = wpt.ident;
            this.coordinatesRef.instance.innerText = coordinateToString(wpt.definition.waypoint.location, false);
            this.selectedWaypointIndex.set(null);
        }));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div ref={this.topRef} style="position: relative;">
                <div
                    class="mfd-dialog"
                    style={`${this.props.contentContainerStyle ?? ''}; left: 175px; top: 50px; width: 500px; height: 625px; overflow: visible;
                    display: flex; flex-direction: column; justify-content: space-between;`}
                >
                    <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding-top: 0px; padding-left: 10px;">
                        <span class="mfd-label">
                            INSERT NEXT WPT FROM
                            {' '}
                            <span ref={this.identRef} class="mfd-value-green bigger">
                                {this.props.fmService.flightPlanService.get(this.props.planIndex?.get())?.legElementAt(this.props.revisedWaypointIndex.get()).definition.waypoint.ident ?? ''}
                            </span>
                        </span>
                        <span style="margin-left: 50px; margin-top: 10px;">
                            <span ref={this.coordinatesRef} class="mfd-value-green bigger" />
                        </span>
                        <div style="margin-left: 50px; margin-top: 10px;">
                            <DropdownMenu
                                idPrefix="insertNextWptDropdown"
                                selectedIndex={this.selectedWaypointIndex}
                                values={this.props.availableWaypoints}
                                freeTextAllowed
                                containerStyle="width: 175px;"
                                alignLabels="flex-start"
                                onModified={(i, text) => this.onModified(i, text)}
                                numberOfDigitsForInputField={7}
                            />
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <Button label="CANCEL" onClick={() => this.props.visible.set(false)} />
                    </div>
                </div>
            </div>
        );
    }
}

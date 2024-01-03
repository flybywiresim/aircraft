import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, Subject, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { WaypointEntryUtils } from '@fmgc/flightplanning/new/WaypointEntryUtils';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/MfdFlightManagementService';

export type NextWptInfo = {
    ident: string;
    originalLegIndex: number;
};
interface InsertNextWptFromWindowProps extends ComponentProps {
    fmService: MfdFlightManagementService;
    availableWaypoints: SubscribableArray<NextWptInfo>;
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

    private availableWaypointsString = ArraySubject.create<string>([]);

    private async onModified(idx: number, text: string): Promise<void> {
        if (idx >= 0) {
            const wptInfo = this.props.availableWaypoints.get(idx);
            const fpln = this.props.fmService.revisedWaypointIsAltn.get()
                ? this.props.fmService.flightPlanService.get(this.props.fmService.revisedWaypointPlanIndex.get()).alternateFlightPlan
                : this.props.fmService.flightPlanService.get(this.props.fmService.revisedWaypointPlanIndex.get());
            if (this.props.availableWaypoints.get(idx) && fpln.elementAt(wptInfo.originalLegIndex).isDiscontinuity === false) {
                this.selectedWaypointIndex.set(idx);
                this.props.visible.set(false);
                console.log(fpln.legElementAt(wptInfo.originalLegIndex).definition.waypoint);
                await this.props.fmService.flightPlanService.nextWaypoint(
                    this.props.fmService.revisedWaypointIndex.get(),
                    fpln.legElementAt(wptInfo.originalLegIndex).definition.waypoint,
                    this.props.fmService.revisedWaypointPlanIndex.get(),
                    this.props.fmService.revisedWaypointIsAltn.get(),
                );
            }
        } else {
            const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmService.mfd, text, true, undefined);
            await this.props.fmService.flightPlanService.nextWaypoint(
                this.props.fmService.revisedWaypointIndex.get(),
                wpt,
                this.props.fmService.revisedWaypointPlanIndex.get(),
                this.props.fmService.revisedWaypointIsAltn.get(),
            );
            this.props.visible.set(false);
        }
        this.props.fmService.resetRevisedWaypoint();
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.visible.sub((val) => {
            this.topRef.getOrDefault().style.display = val ? 'block' : 'none';
            this.selectedWaypointIndex.set(undefined);
            this.nextWpt.set('');
        }, true));

        this.subs.push(this.props.fmService.revisedWaypointIndex.sub((wptIdx) => {
            if (this.props.fmService.revisedWaypoint) {
                const fpln = this.props.fmService.flightPlanService.get(this.props.fmService.revisedWaypointPlanIndex.get());

                if (fpln.elementAt(wptIdx)?.isDiscontinuity === false) {
                    const wpt = fpln.legElementAt(wptIdx);
                    this.identRef.instance.innerText = wpt.ident;
                    this.coordinatesRef.instance.innerText = coordinateToString(wpt.definition.waypoint.location, false);
                    this.selectedWaypointIndex.set(undefined);
                }
            }
        }));

        this.subs.push(this.props.availableWaypoints.sub((idx, type, item, arr) => {
            this.availableWaypointsString.set(arr.map((it) => it.ident));
        }, true));
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
                            <span ref={this.identRef} class="mfd-value-green bigger" />
                        </span>
                        <span style="margin-left: 50px; margin-top: 10px;">
                            <span ref={this.coordinatesRef} class="mfd-value-green bigger" />
                        </span>
                        <div style="margin-left: 50px; margin-top: 10px;">
                            <DropdownMenu
                                idPrefix="insertNextWptDropdown"
                                selectedIndex={this.selectedWaypointIndex}
                                values={this.availableWaypointsString}
                                freeTextAllowed
                                containerStyle="width: 175px;"
                                alignLabels="flex-start"
                                onModified={(i, text) => this.onModified(i, text)}
                                numberOfDigitsForInputField={7}
                            />
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <Button
                            label="CANCEL"
                            onClick={() => {
                                Coherent.trigger('UNFOCUS_INPUT_FIELD');
                                this.props.visible.set(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from 'instruments/src/MFD/dev-data/FlightPlanInterfaceMockup';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';

interface InsertNextWptFromWindowProps extends ComponentProps {
    revisedWaypoint: Subscribable<FlightPlanLeg>;
    availableWaypoints: SubscribableArray<string>;
    visible: Subscribable<boolean>;
    cancelAction: () => void;
    confirmAction: (nextWpt: string) => void;
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

    private onModified(idx: number, text: string): void {
        if (idx > 0) {
            console.log(`NextWPT: ${idx}`);
            if (this.props.availableWaypoints.get(idx)) {
                this.selectedWaypointIndex.set(idx);

                // Consider having no confirm action, but handling the flight plan actions in here
                // this.props.confirmAction(this.props.availableWaypoints.get(idx));
                // this.nextWpt.set('');
            }
        } else {
            console.log(`NextWPT: ${text}`);
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.visible.sub((val) => {
            this.topRef.getOrDefault().style.display = val ? 'block' : 'none';
            this.nextWpt.set('');
        }, true));

        this.subs.push(this.props.revisedWaypoint.sub((wpt) => {
            this.identRef.instance.innerText = wpt.ident;
            this.coordinatesRef.instance.innerText = coordinateToString(wpt.definition.waypoint.location, false);
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
                    class="MFDDialog"
                    style={`${this.props.contentContainerStyle ?? ''}; left: 175px; top: 50px; width: 500px; height: 625px;
                    display: flex; flex-direction: column; justify-content: space-between;`}
                >
                    <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding-top: 0px; padding-left: 10px;">
                        <span class="MFDLabel">
                            INSERT NEXT WPT FROM
                            {' '}
                            <span ref={this.identRef} class="MFDGreenValue bigger">{this.props.revisedWaypoint.get()?.ident ?? ''}</span>
                        </span>
                        <span style="margin-left: 50px; margin-top: 10px;">
                            <span ref={this.coordinatesRef} class="MFDGreenValue bigger" />
                        </span>
                        <div style="margin-left: 50px; margin-top: 10px;">
                            <DropdownMenu
                                idPrefix="insertNextWptDropdown"
                                selectedIndex={this.selectedWaypointIndex}
                                values={this.props.availableWaypoints}
                                freeTextAllowed
                                containerStyle="width: 300px;"
                                alignLabels="flex-start"
                                onModified={(i, text) => this.onModified(i, text)}
                                numberOfDigitsForInputField={14} // Workaround for now: Overflow not yet implemented, so make it extra large
                            />
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <Button label="CANCEL" onClick={() => this.props.cancelAction()} />
                    </div>
                </div>
            </div>
        );
    }
}

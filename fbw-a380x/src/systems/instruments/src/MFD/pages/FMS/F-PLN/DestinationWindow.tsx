import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import '../../common/style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/FlightManagementService';

interface DestinationWindowProps extends ComponentProps {
    fmService: MfdFlightManagementService;
    visible: Subject<boolean>;
    contentContainerStyle?: string;
}
export class DestinationWindow extends DisplayComponent<DestinationWindowProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private identRef = FSComponent.createRef<HTMLSpanElement>();

    private newDest = Subject.create<string>('');

    private onModified(newDest: string): void {
        if (newDest.length === 4) {
            this.props.fmService.flightPlanService.newDest(
                this.props.fmService.revisedWaypointIndex.get(),
                newDest,
                this.props.fmService.revisedWaypointPlanIndex.get(),
                this.props.fmService.revisedWaypointIsAltn.get(),
            );
            this.props.visible.set(false);
            this.newDest.set('');
            this.props.fmService.resetRevisedWaypoint();
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.visible.sub((val) => {
            this.topRef.getOrDefault().style.display = val ? 'block' : 'none';
            this.newDest.set('');
        }, true));

        this.subs.push(this.props.fmService.revisedWaypointIndex.sub(() => {
            if (this.props.fmService.revisedWaypoint()) {
                this.identRef.instance.innerText = this.props.fmService.revisedWaypoint().ident;
            }
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
                    style={`${this.props.contentContainerStyle ?? ''}; left: 195px; top: 225px; width: 500px; height: 300px;
                    display: flex; flex-direction: column; justify-content: space-between;`}
                >
                    <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding-top: 40px; padding-left: 15px;">
                        <span class="mfd-label">
                            NEW DEST FROM
                            {' '}
                            <span ref={this.identRef} class="mfd-value-green bigger">{this.props.fmService.revisedWaypoint()?.ident ?? ''}</span>
                        </span>
                        <div style="align-self: center; margin-top: 50px;">
                            <InputField<string>
                                dataEntryFormat={new AirportFormat()}
                                mandatory={Subject.create(false)}
                                canBeCleared={Subject.create(true)}
                                onModified={(val) => this.onModified(val)}
                                value={this.newDest}
                                alignText="center"
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

import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { FlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';

export abstract class FmsPage<T extends AbstractMfdPageProps> extends DisplayComponent<T> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    protected subs = [] as Subscription[];

    private newDataIntervalId: NodeJS.Timer;

    protected activePageTitle = Subject.create<string>('');

    public loadedFlightPlan: FlightPlan;

    protected loadedFlightPlanIndex = Subject.create<FlightPlanIndex>(FlightPlanIndex.Active);

    protected currentFlightPlanVersion: number = 0;

    protected tmpyActive = Subject.create<boolean>(false);

    protected secActive = Subject.create<boolean>(false);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.activePageTitle.set(`${val.category.toUpperCase()}/${this.props.pageTitle}`);
        }, true));

        // Check if flight plan changed using flight plan sync bus events
        const flightPlanSyncSub = this.props.bus.getSubscriber<FlightPlanSyncEvents>();

        this.subs.push(flightPlanSyncSub.on('flightPlanManager.create').handle(() => {
            this.onFlightPlanChanged();
        }));

        this.subs.push(flightPlanSyncSub.on('flightPlanManager.delete').handle((data) => {
            if (data.planIndex === this.loadedFlightPlan.index) {
                this.onFlightPlanChanged();
            }
        }));

        this.subs.push(flightPlanSyncSub.on('flightPlanManager.deleteAll').handle(() => {
            this.onFlightPlanChanged();
        }));

        this.subs.push(flightPlanSyncSub.on('flightPlanManager.swap').handle((data) => {
            if (data.planIndex === this.loadedFlightPlan.index || data.targetPlanIndex === this.loadedFlightPlan.index) {
                this.onFlightPlanChanged();
            }
        }));

        this.subs.push(flightPlanSyncSub.on('flightPlanManager.copy').handle((data) => {
            if (data.planIndex === this.loadedFlightPlan.index || data.targetPlanIndex === this.loadedFlightPlan.index) {
                this.onFlightPlanChanged();
            }
        }));

        this.onFlightPlanChanged();
        this.onNewData();
        this.newDataIntervalId = setInterval(() => this.checkIfNewData(), 500);
    }

    protected checkIfNewData() {
        // Check for current flight plan, whether it has changed (TODO switch to Subscribable in the future)
        if (this.loadedFlightPlan.version !== this.currentFlightPlanVersion) {
            this.onNewData();
            this.currentFlightPlanVersion = this.loadedFlightPlan.version;
        }
    }

    protected onFlightPlanChanged() {
        switch (this.props.uiService.activeUri.get().category) {
        case 'active':
            this.loadedFlightPlan = this.props.fmService.flightPlanService.activeOrTemporary;
            this.loadedFlightPlanIndex.set(this.props.fmService.flightPlanService.hasTemporary ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
            this.secActive.set(false);
            this.tmpyActive.set(this.props.fmService.flightPlanService.hasTemporary);
            break;
        case 'sec1':
            this.loadedFlightPlan = this.props.fmService.flightPlanService.secondary(1);
            this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
            this.secActive.set(true);
            this.tmpyActive.set(false);
            break;
        case 'sec2':
            this.loadedFlightPlan = this.props.fmService.flightPlanService.secondary(2);
            this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 1);
            this.secActive.set(true);
            this.tmpyActive.set(false);
            break;
        case 'sec3':
            this.loadedFlightPlan = this.props.fmService.flightPlanService.secondary(3);
            this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 2);
            this.secActive.set(true);
            this.tmpyActive.set(false);
            break;

        default:
            this.loadedFlightPlan = this.props.fmService.flightPlanService.activeOrTemporary;
            break;
        }
        this.onNewData();
        this.currentFlightPlanVersion = this.loadedFlightPlan.version;
    }

    protected abstract onNewData();

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        clearInterval(this.newDataIntervalId);

        super.destroy();
    }

    render(): VNode {
        return (
            <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={this.tmpyActive} />
        );
    }
}

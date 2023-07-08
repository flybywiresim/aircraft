import { ArraySubject, DisplayComponent, FSComponent, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

interface MfdFmsHeaderProps extends MfdComponentProps {
    activeFmsSource: Subscribable<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>;
    callsign: Subscribable<string>;
}
export class FmsHeader extends DisplayComponent<MfdFmsHeaderProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private availableSystems = ArraySubject.create([this.props.activeFmsSource.get(), 'ATCCOM', 'SURV', 'FCU BKUP']);

    private sysSelectorSelectedIndex = Subject.create(0);

    private activeIsSelected = Subject.create(false);

    private positionIsSelected = Subject.create(false);

    private secIndexIsSelected = Subject.create(false);

    private dataIsSelected = Subject.create(false);

    public changeSystem(selectedSysIndex: number) {
        this.sysSelectorSelectedIndex.set(selectedSysIndex);

        switch (selectedSysIndex) {
        case 0: // FMS
            this.props.navigateTo('fms/active/init');
            break;
        case 1: // ATCCOM
            this.props.navigateTo('atccom/connect');
            break;
        case 2: // SURV
            this.props.navigateTo('surv/controls');
            break;
        case 3: // FCU BKUP
            this.props.navigateTo('fcubkup/afs');
            break;

        default:
            this.props.navigateTo('fms/active/init');
            break;
        }
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.activeFmsSource.sub((val) => {
            this.availableSystems.removeAt(0);
            this.availableSystems.insert(val, 0);
        }, true));

        this.subs.push(this.props.activeUri.sub((val) => {
            switch (val.sys) {
            case 'fms':
                this.sysSelectorSelectedIndex.set(0);
                break;
            case 'atccom':
                this.sysSelectorSelectedIndex.set(1);
                break;
            case 'surv':
                this.sysSelectorSelectedIndex.set(2);
                break;
            case 'fcubkup':
                this.sysSelectorSelectedIndex.set(3);
                break;

            default:
                this.sysSelectorSelectedIndex.set(0);
                break;
            }

            this.activeIsSelected.set(val.category === 'active');
            this.positionIsSelected.set(val.category === 'position');
            this.secIndexIsSelected.set(val.category === 'sec' || val.category === 'sec1' || val.category === 'sec2' || val.category === 'sec3');
            this.dataIsSelected.set(val.category === 'data');
        }, true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <DropdownMenu
                        values={this.availableSystems}
                        selectedIndex={this.sysSelectorSelectedIndex}
                        idPrefix="sysSelectorDropdown"
                        freeTextAllowed={false}
                        onModified={(val) => this.changeSystem(val)}
                        containerStyle="width: 25%;"
                        alignLabels="flex-start"
                    />
                    <span class="MFDLabel" style="width: 25%; text-align: left; padding: 8px 10px 0px 10px;">{this.props.callsign}</span>
                </div>
                <div style="display: flex; flex-direction: row;">
                    <PageSelectorDropdownMenu
                        isActive={this.activeIsSelected}
                        label="ACTIVE"
                        menuItems={[
                            { label: 'F-PLN', action: () => this.props.navigateTo('fms/active/f-pln') },
                            { label: 'PERF', action: () => this.props.navigateTo('fms/active/perf') },
                            { label: 'FUEL&LOAD', action: () => this.props.navigateTo('fms/active/fuel-load') },
                            { label: 'WIND', action: () => this.props.navigateTo('fms/active/wind') },
                            { label: 'INIT', action: () => this.props.navigateTo('fms/active/init') }]}
                        idPrefix="pageSelectorActive"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.positionIsSelected}
                        label="POSITION"
                        menuItems={[
                            { label: 'MONITOR', action: () => this.props.navigateTo('fms/position/monitor') },
                            { label: 'REPORT', action: () => this.props.navigateTo('fms/position/report') },
                            { label: 'NAVAIDS', action: () => this.props.navigateTo('fms/position/navaids') },
                            { label: 'IRS', action: () => this.props.navigateTo('fms/position/irs') },
                            { label: 'GPS', action: () => this.props.navigateTo('fms/position/gps') }]}
                        idPrefix="pageSelectorPosition"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.secIndexIsSelected}
                        label="SEC INDEX"
                        menuItems={[
                            { label: 'SEC 1', action: () => this.props.navigateTo('fms/sec1/init') },
                            { label: 'SEC 2', action: () => this.props.navigateTo('fms/sec2/init') },
                            { label: 'SEC 3', action: () => this.props.navigateTo('fms/sec3/init') }]}
                        idPrefix="pageSelectorSecIndex"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.dataIsSelected}
                        label="DATA"
                        menuItems={[
                            { label: 'STATUS', action: () => this.props.navigateTo('fms/data/status') },
                            { label: 'WAYPOINT', action: () => this.props.navigateTo('fms/data/waypoint') },
                            { label: 'NAVAID', action: () => this.props.navigateTo('fms/data/navaid') },
                            { label: 'ROUTE', action: () => this.props.navigateTo('fms/data/route') },
                            { label: 'AIRPORT', action: () => this.props.navigateTo('fms/data/airport') },
                            { label: 'PRINTER', action: () => this.props.navigateTo('fms/data/printer') }]}
                        idPrefix="pageSelectorData"
                        containerStyle="flex: 1"
                    />
                </div>
            </>
        );
    }
}

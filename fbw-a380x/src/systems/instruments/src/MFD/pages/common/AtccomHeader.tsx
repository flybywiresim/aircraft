import { ArraySubject, DisplayComponent, FSComponent, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

interface MfdAtccomHeaderProps extends MfdComponentProps {
    activeFmsSource: Subscribable<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>;
}
export class AtccomHeader extends DisplayComponent<MfdAtccomHeaderProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private availableSystems = ArraySubject.create([this.props.activeFmsSource.get(), 'ATCCOM', 'SURV', 'FCU BKUP']);

    private sysSelectorSelectedIndex = Subject.create(0);

    private connectIsSelected = Subject.create(false);

    private requestIsSelected = Subject.create(false);

    private reportModifyIsSelected = Subject.create(false);

    private msgRecordIsSelected = Subject.create(false);

    private atisIsSelected = Subject.create(false);

    private emerIsSelected = Subject.create(false);

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

            this.connectIsSelected.set(val.category === 'connect');
            this.requestIsSelected.set(val.category === 'request');
            this.reportModifyIsSelected.set(val.category === 'report-modify');
            this.msgRecordIsSelected.set(val.category === 'msg-record');
            this.atisIsSelected.set(val.category === 'atis');
            this.emerIsSelected.set(val.category === 'emer');
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
                <div style="display: flex; flex-direction: row;">
                    <DropdownMenu
                        values={this.availableSystems}
                        selectedIndex={this.sysSelectorSelectedIndex}
                        idPrefix="sysSelectorDropdown"
                        onChangeCallback={(val) => this.changeSystem(val)}
                        containerStyle="width: 25%;"
                        alignLabels="left"
                    />
                </div>
                <div style="display: flex; flex-direction: row;">
                    <PageSelectorDropdownMenu
                        isActive={this.connectIsSelected}
                        label="CONNECT"
                        menuItems={[
                            { label: 'NOTIFICATION', action: () => this.props.navigateTo('atccom/connect/notification') },
                            { label: 'CONNECTION STATUS', action: () => this.props.navigateTo('atccom/connect/conn-status') },
                            { label: 'MAX UPLINK DELAY', action: () => this.props.navigateTo('atccom/connect/max-uplink-delay') }]}
                        idPrefix="pageSelectorConnect"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.requestIsSelected}
                        label="REQUEST"
                        menuItems={[{ label: '', action: () => this.props.navigateTo('atccom/request') }]}
                        idPrefix="pageSelectorRequest"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.reportModifyIsSelected}
                        label="REPORTY & MODIFY"
                        menuItems={[
                            { label: 'POSITION', action: () => this.props.navigateTo('atccom/report-modify/position') },
                            { label: 'MODIFY', action: () => this.props.navigateTo('atccom/report-modify/modify') },
                            { label: 'OTHER REPORTS', action: () => this.props.navigateTo('atccom/report-modify/other-reports') },
                        ]}
                        idPrefix="pageSelectorReportModify"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.msgRecordIsSelected}
                        label="MSG RECORD"
                        menuItems={[{ label: '', action: () => this.props.navigateTo('atccom/msg-record') }]}
                        idPrefix="pageSelectorMsgRecord"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.atisIsSelected}
                        label="ATIS"
                        menuItems={[{ label: '', action: () => this.props.navigateTo('atccom/atis') }]}
                        idPrefix="pageSelectorAtis"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.emerIsSelected}
                        label="EMER"
                        menuItems={[{ label: '', action: () => this.props.navigateTo('atccom/emer') }]}
                        idPrefix="pageSelectorEmer"
                        containerStyle="flex: 1"
                    />
                </div>
            </>
        );
    }
}

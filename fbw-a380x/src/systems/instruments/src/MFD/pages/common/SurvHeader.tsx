import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractHeader } from 'instruments/src/MFD/pages/common/AbstractHeader';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

/*
 * Complete header for the SURV system
 */
export class SurvHeader extends AbstractHeader {
    private controlsIsSelected = Subject.create(false);

    private statSwitchIsSelected = Subject.create(false);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.controlsIsSelected.set(val.category === 'controls');
            this.statSwitchIsSelected.set(val.category === 'status-switching');
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
                    <span class="mfd-label" style="width: 25%; text-align: left; padding: 8px 10px 0px 10px;">{this.props.callsign}</span>
                </div>
                <div style="display: flex; flex-direction: row; width: 100%">
                    <PageSelectorDropdownMenu
                        isActive={this.controlsIsSelected}
                        label="CONTROLS"
                        menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('surv/controls') }]}
                        idPrefix="pageSelectorControls"
                        containerStyle="width: 25%"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.statSwitchIsSelected}
                        label="STATUS & SWITCHING"
                        menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('surv/status-switching') }]}
                        idPrefix="pageSelectorStatSwitch"
                        containerStyle="width: 50%"
                    />
                </div>
            </>
        );
    }
}

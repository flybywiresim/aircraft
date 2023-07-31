import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractHeader } from 'instruments/src/MFD/pages/common/AbstractHeader';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

/*
 * Complete header for the FCU BKUP system
 */
export class FcuBkupHeader extends AbstractHeader {
    private afsIsSelected = Subject.create(false);

    private efisIsSelected = Subject.create(false);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.afsIsSelected.set(val.category === 'afs');
            this.efisIsSelected.set(val.category === 'efis');
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
                <div style="display: flex; flex-direction: row; width: 50%">
                    <PageSelectorDropdownMenu
                        isActive={this.afsIsSelected}
                        label="AFS CP"
                        menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('fcubkup/afs') }]}
                        idPrefix="pageSelectorAfs"
                        containerStyle="flex: 1"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.efisIsSelected}
                        label="EFIS CP"
                        menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('fcubkup/efis') }]}
                        idPrefix="pageSelectorEfis"
                        containerStyle="flex: 1"
                    />
                </div>
            </>
        );
    }
}

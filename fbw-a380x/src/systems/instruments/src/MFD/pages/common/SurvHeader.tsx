import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractHeader } from 'instruments/src/MFD/pages/common/AbstractHeader';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

/*
 * Complete header for the SURV system
 */
export class SurvHeader extends AbstractHeader {
    private controlsIsSelected = Subject.create(false);

    private statSwitchIsSelected = Subject.create(false);

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.mfd.uiService.activeUri.sub((val) => {
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
                {super.render()}
                <div class="mfd-header-page-select-row">
                    <PageSelectorDropdownMenu
                        isActive={this.controlsIsSelected}
                        label="CONTROLS"
                        menuItems={[{ label: '', action: () => this.props.mfd.uiService.navigateTo('surv/controls') }]}
                        idPrefix="pageSelectorControls"
                        containerStyle="width: 25%"
                    />
                    <PageSelectorDropdownMenu
                        isActive={this.statSwitchIsSelected}
                        label="STATUS & SWITCHING"
                        menuItems={[{ label: '', action: () => this.props.mfd.uiService.navigateTo('surv/status-switching') }]}
                        idPrefix="pageSelectorStatSwitch"
                        containerStyle="width: 50%"
                    />
                </div>
            </>
        );
    }
}

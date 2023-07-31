import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MFD/pages/common/Button';

export class Footer extends DisplayComponent<AbstractMfdPageProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <div style="display: flex; border-top: 2px solid $display-mfd-dark-grey; padding: 5px;">
                <Button label="MSG<br />LIST" onClick={() => this.props.uiService.navigateTo(`fms/${this.props.uiService.activeUri.get().category}/msg-list`)} />
            </div>
        );
    }
}

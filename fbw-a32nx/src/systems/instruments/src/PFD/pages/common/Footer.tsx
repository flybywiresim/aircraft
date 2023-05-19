import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { Button } from 'instruments/src/PFD/pages/common/Button';

export class Footer extends DisplayComponent<MfdComponentProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <div style="display: flex; border-top: 2px solid $display-mfd-dark-grey; padding: 5px;">
                <Button onClick={() => console.log('MSG LIST')}>
                    MSG
                    <br />
                    LIST
                </Button>
            </div>
        );
    }
}

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { MFDComponentProps } from 'instruments/src/PFD/MFD';
import { Button } from 'instruments/src/PFD/MFD-common/Button';

export class Footer extends DisplayComponent<MFDComponentProps> {
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <div style="display: flex; border-top: 2px solid $display-mfd-dark-grey; padding: 5px;">
                <Button>
                    MSG
                    <br />
                    LIST
                </Button>
            </div>
        );
    }
}

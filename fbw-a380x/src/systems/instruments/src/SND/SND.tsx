// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

import './style.scss';


interface SNDProps extends ComponentProps {

}

export class PFDComponent extends DisplayComponent<SNDProps> {

    constructor(props: SNDProps) {
        super(props);
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
          <></>
        );
    }
}

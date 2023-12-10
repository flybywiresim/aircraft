import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class ATC extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">ATC</span></div>
        );
    }
}

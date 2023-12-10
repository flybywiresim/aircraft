import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Ground extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Ground</span></div>
        );
    }
}

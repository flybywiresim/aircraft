import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Performance extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Performance</span></div>
        );
    }
}

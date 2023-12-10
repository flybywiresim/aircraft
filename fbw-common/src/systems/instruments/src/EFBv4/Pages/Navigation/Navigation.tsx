import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Navigation extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Navigation</span></div>
        );
    }
}

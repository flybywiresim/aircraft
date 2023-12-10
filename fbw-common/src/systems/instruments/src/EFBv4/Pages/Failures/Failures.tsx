import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Failures extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Failures</span></div>
        );
    }
}

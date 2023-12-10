import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Presets extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Presets</span></div>
        );
    }
}

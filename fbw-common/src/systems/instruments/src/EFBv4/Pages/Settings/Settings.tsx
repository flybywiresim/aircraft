import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Settings extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Settings</span></div>
        );
    }
}

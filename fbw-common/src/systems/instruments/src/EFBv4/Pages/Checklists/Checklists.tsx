import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class Checklists extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><span class="text-3xl">Checklists</span></div>
        );
    }
}

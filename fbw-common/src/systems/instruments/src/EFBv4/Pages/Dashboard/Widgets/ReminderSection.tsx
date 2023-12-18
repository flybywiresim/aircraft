import {DisplayComponent, FSComponent, VNode} from "@microsoft/msfs-sdk";

export class RemindersSection extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="flex flex-col border-b-2 border-gray-700 pb-6">
                {/** There was a <Link /> here, im not sure why * */}
                {this.props.children}
            </div>
        );
    }
}
import { DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray, VNode } from 'msfssdk';
import './common.scss';

interface DropdownMenuProps {
    values: SubscribableArray<string>;
    selectedIndex: Subscribable<number>;
    useNewStyle?: boolean;
}
export class DropdownMenu extends DisplayComponent<DropdownMenuProps> {
    private label = Subject.create<string>('NOT SET');

    constructor(props: DropdownMenuProps) {
        super(props);

        this.label.set(this.props.values.get(this.props.selectedIndex.get()));
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.values.sub((value) => {
            this.label.set(value[this.props.selectedIndex.get()]);
        });

        this.props.selectedIndex.sub((value) => {
            this.label.set(this.props.values.get(value));
        });
    }

    render(): VNode {
        return (
            <div class="MFDDropdownOuter">
                <div class={`MFDDropdownInner${this.props.useNewStyle ? 'V2' : ''}`}>
                    <span class={`MFDDropdownLabel${this.props.useNewStyle ? 'V2' : ''}`}>
                        {this.label}
                    </span>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; width: 25px;">
                    <svg height="10" width="10">
                        <polygon points="0,0 10,0 5,10" style="fill: white" />
                    </svg>
                </div>
            </div>
        );
    }
}

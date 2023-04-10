import { DisplayComponent, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface SysSelectorDropdownMenuProps {
    values: Subscribable<string[]>;
    selectedIndex: Subscribable<number>;
}
export class SysSelectorDropdownMenu extends DisplayComponent<SysSelectorDropdownMenuProps> {
    private sysLabel = Subject.create<string>('X');

    constructor(props: SysSelectorDropdownMenuProps) {
        super(props);

        this.sysLabel.set(this.props.values.get()[this.props.selectedIndex.get()]);
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.values.sub((value) => {
            this.sysLabel.set(value[this.props.selectedIndex.get()]);
        });

        this.props.selectedIndex.sub((value) => {
            this.sysLabel.set(this.props.values.get()[value]);
        });
    }

    render(): VNode {
        return (
            <div class="MFDSysSelectorOuter">
                <div style="background-color: #040405; display: flex; flex: 4; margin: 4px;">
                    <span class="MFDSysSelectorLabel">
                        {this.sysLabel}
                    </span>
                </div>
                <div style="display: flex; flex: 1; justify-content: center;">
                    <span style="color: white; align-self: center;">
                        <svg height="10" width="10">
                            <polygon points="0,0 10,0 5,10" style="fill: white" />
                        </svg>
                    </span>
                </div>
            </div>
        );
    }
}

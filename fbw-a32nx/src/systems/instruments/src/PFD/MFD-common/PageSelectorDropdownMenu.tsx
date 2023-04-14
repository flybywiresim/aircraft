import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface PageSelectorDropdownMenuProps extends ComponentProps {
    isActive: Subscribable<boolean>;
}
export class PageSelectorDropdownMenu extends DisplayComponent<PageSelectorDropdownMenuProps> {
    render(): VNode {
        return (
            <div class="MFDPageSelectorOuter">
                <div style="display: flex; flex: 8; justify-content: center; hover:background-color: cyan;">
                    <span class={`MFDPageSelectorLabel ${this.props.isActive.get() === true ? 'active' : ''}`}>
                        {this.props.children}
                    </span>
                </div>
                <div style="display: flex;">
                    <span style="padding: 8px;">
                        <svg height="15" width="15">
                            <polygon points="0,0 15,0 7.5,15" style="fill: white" />
                        </svg>
                    </span>
                </div>
            </div>
        );
    }
}

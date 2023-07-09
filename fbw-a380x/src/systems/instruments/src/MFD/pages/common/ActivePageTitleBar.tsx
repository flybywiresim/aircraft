import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ActivePageTitleBarProps extends ComponentProps {
    activePage: Subscribable<string>;
    offset: Subscribable<string>;
    eoIsActive: Subscribable<boolean>;
    tmpyIsActive: Subscribable<boolean>;
}
export class ActivePageTitleBar extends DisplayComponent<ActivePageTitleBarProps> {
    render(): VNode {
        return (
            <div style="display: flex;">
                <div style="flex: 10; background-color: #a0a0a0; padding: 3px 10px 3px 7px;">
                    <span class="MFDLabel" style="color: #222222; font-size: 28px;">
                        {this.props.activePage}
                        {this.props.offset.get() !== '' ? `     OFFSET${this.props.offset.get()}` : ''}
                    </span>
                </div>
                <div style="width: 70px; background-color: #a0a0a0; margin-left: 2px; display: flex; justify-content: center; align-items: center;">
                    {(this.props.eoIsActive.get() === true) && <span class="MFDLabel" style="background-color: orange; color: #222222; font-size: 26px; padding: 2px;">EO</span>}
                </div>
                <div style="width: 100px; background-color: #a0a0a0; margin-left: 2px; display: flex; justify-content: center; align-items: center;">
                    {(this.props.tmpyIsActive.get() === true) && <span class="MFDLabel" style="background-color: yellow; color: #222222; font-size: 26px; padding: 2px;">TMPY</span>}
                </div>
            </div>
        );
    }
}

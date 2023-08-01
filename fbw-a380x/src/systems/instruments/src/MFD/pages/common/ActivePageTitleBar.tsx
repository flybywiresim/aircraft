import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ActivePageTitleBarProps extends ComponentProps {
    activePage: Subscribable<string>;
    offset: Subscribable<string>;
    eoIsActive: Subscribable<boolean>;
    tmpyIsActive: Subscribable<boolean>;
}

/*
 * Displays the title bar, with optional markers for lateral offsets, engine out and temporary flight plan
 */
export class ActivePageTitleBar extends DisplayComponent<ActivePageTitleBarProps> {
    render(): VNode {
        return (
            <div class="mfd-title-bar-container">
                <div class="mfd-title-bar-title">
                    <span class="mfd-label mfd-title-bar-title-label">
                        {this.props.activePage}
                        {this.props.offset.get() !== '' ? `     OFFSET${this.props.offset.get()}` : ''}
                    </span>
                </div>
                <div class="mfd-title-bar-eo-section">
                    {(this.props.eoIsActive.get() === true) && <span class="mfd-label mfd-title-bar-eo-label">EO</span>}
                </div>
                <div class="mfd-title-bar-tmpy-section">
                    {(this.props.tmpyIsActive.get() === true) && <span class="mfd-label mfd-title-bar-tmpy-label">TMPY</span>}
                </div>
            </div>
        );
    }
}

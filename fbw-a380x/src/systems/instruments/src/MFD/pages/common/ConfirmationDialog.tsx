import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';

interface ConfirmationDialogProps extends ComponentProps {
    visible: Subscribable<boolean>;
    cancelAction: () => void;
    confirmAction: () => void;
    contentContainerStyle?: string;
}

/*
 * Popup dialog for actions needing confirmation (e.g. DERATED TO)
 */
export class ConfirmationDialog extends DisplayComponent<ConfirmationDialogProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.visible.sub((val) => this.topRef.getOrDefault().style.display = val ? 'block' : 'none', true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div ref={this.topRef} style="position: relative;">
                <div class="MFDDialog" style={`${this.props.contentContainerStyle ?? ''} display: flex; flex-direction: column; justify-content: space-between`}>
                    <div style="display: flex; justify-content: center; align-items: flex-start; padding-top: 20px;">
                        <span class="MFDLabel">{this.props.children}</span>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <Button label="CANCEL" onClick={() => this.props.cancelAction()} />
                        <Button label="CONFIRM *" onClick={() => this.props.confirmAction()} buttonStyle="padding-right: 6px;" />
                    </div>
                </div>
            </div>
        );
    }
}

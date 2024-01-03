/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, SubscribableArray, SubscribableArrayEventType, Subscription, VNode } from '@microsoft/msfs-sdk';

import './MfdMsgList.scss';
import { AbstractMfdPageProps, FmsErrorMessage } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';

interface MfdMsgListProps extends AbstractMfdPageProps {
    visible: Subject<boolean>;
    messages: SubscribableArray<FmsErrorMessage>;
}

export class MfdMsgList extends DisplayComponent<MfdMsgListProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private msgListContainer = FSComponent.createRef<HTMLDivElement>();

    protected onNewData: () => {};

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.messages.sub((idx, type, item, arr) => {
            if (arr.length > 5) {
                console.warn('More than 5 FMS messages, truncating.');
            }

            // Updating container children
            // TODO check if more sanity checks required on index and length
            if (type === SubscribableArrayEventType.Cleared) {
                while (this.msgListContainer.instance.firstChild) {
                    this.msgListContainer.instance.removeChild(this.msgListContainer.instance.firstChild);
                }
            } else if (type === SubscribableArrayEventType.Removed) {
                this.msgListContainer.instance.removeChild(this.msgListContainer.instance.children[idx]);

                // Display previously truncated message
                if (arr.length >= 5) {
                    FSComponent.render(<div class="mfd-label msg-list-element">{arr[4]}</div>, this.msgListContainer.instance);
                }
            } else if (type === SubscribableArrayEventType.Added) {
                // Add element
                // Limitation: Can only add elements at the end of the list, have to figure out how to insert after specific child
                if (Array.isArray(item) === true) {
                    const itemArr = item as readonly FmsErrorMessage[];
                    itemArr.forEach((el) => {
                        console.log(el);
                        FSComponent.render(<div class="mfd-label msg-list-element">{el.message}</div>, this.msgListContainer.instance);
                    });
                } else {
                    const it = item as FmsErrorMessage;
                    FSComponent.render(<div class="mfd-label msg-list-element">{it.message}</div>, this.msgListContainer.instance);
                }
            }
        }, true));
        this.subs.push(this.props.visible.sub((vis) => this.topRef.getOrDefault().style.display = vis ? 'block' : 'none', true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div ref={this.topRef} class="mfd-fms-fpln-dialog-outer">
                <div class="mfd-fms-fpln-dialog-inner">
                    <ActivePageTitleBar activePage={Subject.create('MESSAGE LIST')} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                    {/* begin page content */}
                    <div class="mfd-page-container">
                        <div ref={this.msgListContainer} class="mfd-msg-list-element-container" />
                        <div style="flex-grow: 1;" />
                        <div style="display: flex; justify-content: flex-start;">
                            <Button label="CLOSE" onClick={() => this.props.visible.set(false)} />
                        </div>
                    </div>
                    {/* end page content */}
                </div>
            </div>
        );
    }
}

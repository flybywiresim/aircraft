/* eslint-disable jsx-a11y/label-has-associated-control */

import { FSComponent, SubscribableArray, SubscribableArrayEventType, VNode } from '@microsoft/msfs-sdk';

import './msg_list.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';

interface MfdMsgListProps extends AbstractMfdPageProps {
    messages: SubscribableArray<string>;
}

export class MfdMsgList extends FmsPage<MfdMsgListProps> {
    private msgListContainer = FSComponent.createRef<HTMLDivElement>();

    protected onNewData: () => null;

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
                    const itemArr = item as readonly string[];
                    itemArr.forEach((el) => {
                        console.log(el);
                        FSComponent.render(<div class="mfd-label msg-list-element">{el}</div>, this.msgListContainer.instance);
                    });
                } else {
                    FSComponent.render(<div class="mfd-label msg-list-element">{item}</div>, this.msgListContainer.instance);
                }
            }
        }, true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <>
                {super.render()}
                {/* begin page content */}
                <div class="mfd-page-container">
                    <div ref={this.msgListContainer} class="mfd-msg-list-element-container" />
                    <div style="flex-grow: 1;" />
                    <div style="display: flex; justify-content: flex-start;">
                        <Button label="CLOSE" onClick={() => this.props.uiService.navigateTo('back')} />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} fmService={this.props.fmService} />
            </>
        );
    }
}

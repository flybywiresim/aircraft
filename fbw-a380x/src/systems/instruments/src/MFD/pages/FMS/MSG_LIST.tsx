/* eslint-disable jsx-a11y/label-has-associated-control */

import { DisplayComponent, FSComponent, Subject, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';

interface MfdMsgListProps extends MfdComponentProps {
    messages: SubscribableArray<string>;
}

export class MfdMsgList extends DisplayComponent<MfdMsgListProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.messages.sub((idx, type, item, arr) => {
            if (arr.length > 5) {
                console.warn('More than 5 FMS messages, truncating.');
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
                <ActivePageTitleBar activePage={Subject.create('MESSAGES LIST')} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer">
                    <div style="margin: 75px; border-top: 2px solid white;">
                        {this.props.messages.getArray().map((val, idx) => {
                            if (idx > 4) {
                                return <></>;
                            }

                            return (<div class="MFDLabel" style="font-size: 26px; height: 80px; padding: 5px; border-bottom: 2px solid white;">{val}</div>);
                        })}
                    </div>
                    <div style="flex-grow: 1;" />
                    <div style="display: flex; justify-content: flex-start;">
                        <Button label="CLOSE" onClick={() => this.props.navigateTo('back')} />
                    </div>
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

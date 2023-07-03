/* eslint-disable jsx-a11y/label-has-associated-control */

import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdComponentProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TriangleDown, TriangleUp } from 'instruments/src/MFD/pages/common/shapes';

interface MfdFmsFplnProps extends MfdComponentProps {
    instrument: BaseInstrument;
}

export class MfdFmsFpln extends DisplayComponent<MfdFmsFplnProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/F-PLN');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/F-PLN');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/F-PLN');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/F-PLN');
                break;

            default:
                this.activePageTitle.set('ACTIVE/F-PLN');
                break;
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
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={Subject.create(false)} />
                {/* begin page content */}
                <div class="MFDPageContainer">
                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 5px; border-bottom: 1px solid lightgrey;">
                        <div style="display: flex; width: 25%; justify-content: flex-start; align-items: center; padding-left: 3px;">
                            <span class="MFDLabel">FROM</span>
                        </div>
                        <div style="display: flex; width: 11.5%; justify-content: center; align-items: center;">
                            <span class="MFDLabel">TIME</span>
                        </div>
                        <div style="display: flex; width: 40.5%; justify-content: center; align-items: center; padding-bottom: 2px;">
                            <Button
                                onClick={() => console.log('SPD ALT')}
                                buttonStyle="margin-right: 5px; width: 258px; height: 43px;"
                                idPrefix="efobtwindbtn"
                                menuItems={[{ action: () => console.log('EFOB'), label: 'EFOB&nbsp;T.WIND' }]}
                            >
                                <div style="flex: 1; display: flex; flex-direction: row; justify-content: space-between;">
                                    <span style="text-align: center; vertical-align: center; padding-left: 20px;">
                                        SPD
                                    </span>
                                    <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                                        ALT
                                    </span>
                                    <span style="display: flex; align-items: center; justify-content: center;"><TriangleDown /></span>
                                </div>
                            </Button>
                        </div>
                        <div style="display: flex; width: 8%; justify-content: center; align-items: center;">
                            <span class="MFDLabel">TRK</span>
                        </div>
                        <div style="display: flex; width: 8%; justify-content: center; align-items: center;">
                            <span class="MFDLabel">DIST</span>
                        </div>
                        <div style="display: flex; width: 7%; justify-content: flex-end; align-items: center;">
                            <span class="MFDLabel">FPA</span>
                        </div>
                    </div>
                    {[...Array(9).keys()].map(() => <FplnSpecialLine>DISCONTINUITY</FplnSpecialLine>)}
                    <div style="flex-grow: 1;" />
                    {/* fill space vertically */}
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid lightgrey;">
                        <Button onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/init`)} buttonStyle="font-size: 30px; width: 150px; margin-right: 5px;">
                            WSSS
                        </Button>
                        <span class="MFDLabel">20:08</span>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel">74.5</span>
                            <span class="MFDUnitLabel trailingUnit">T</span>
                        </div>
                        <div class="MFDLabelValueContainer">
                            <span class="MFDLabel">6009</span>
                            <span class="MFDUnitLabel trailingUnit">NM</span>
                        </div>
                        <div style="display: flex; flex-direction: row; margin-top: 5px; margin-bottom: 5px;">
                            <IconButton icon="double-down" containerStyle="width: 60px; height: 60px;" />
                            <IconButton icon="double-up" disabled={Subject.create(true)} containerStyle="width: 60px; height: 60px;" />
                            <Button
                                onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln/arrival`)}
                                buttonStyle="height: 60px; margin-right: 5px; padding: auto 15px auto 15px;"
                            >
                                DEST
                            </Button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 0px 0px 5px 0px; border-top: 1px solid lightgrey; padding-top: 10px;">
                        <Button onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/init`)} buttonStyle="width: 125px;">
                            INIT
                        </Button>
                        <Button onClick={() => console.log('F_PLN INFO')} buttonStyle="padding-right: 5px;">
                            <div style="flex: 1; display: flex; flex-direction: row; justify-content: space-between;">
                                <span style="text-align: center; vertical-align: center; padding-left: 5px; padding-right: 10px;">
                                    F-PLN INFO
                                </span>
                                <span style="display: flex; align-items: center; justify-content: center;"><TriangleUp /></span>
                            </div>
                        </Button>
                        <Button onClick={() => this.props.navigateTo(`fms/${this.props.activeUri.get().category}/f-pln/direct-to`)} buttonStyle="margin-right: 5px;">
                            DIR TO
                        </Button>
                    </div>
                    {/* end page content */}
                </div>
                <Footer bus={this.props.bus} activeUri={this.props.activeUri} navigateTo={this.props.navigateTo} />
            </>
        );
    }
}

class FplnSpecialLine extends DisplayComponent<ComponentProps> {
    render() {
        return (
            <div class="MFDFplnLine" style="font-size: 30px;">
                - - - - - -
                <span style="margin: 0px 15px 0px 15px;">{this.props.children}</span>
                - - - - - -
            </div>
        );
    }
}

/*
Header
25% FROM
11.5% TIME
40.5% SPD ALT BUTTON
8% TRK
8% DIST
7% FPA

Content
25% FROM
11.5% TIME
32.5% SPD ALT
8% LINES
8% TRK
8% DIST
7% FPA

72px line height
*/

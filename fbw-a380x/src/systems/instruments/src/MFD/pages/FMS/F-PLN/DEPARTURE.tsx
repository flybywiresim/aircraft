import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';

interface MfdFmsFplnDepProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnDep extends DisplayComponent<MfdFmsFplnDepProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private tmpyActive = Subject.create<boolean>(false);

    private secIsActive = Subject.create<boolean>(false);

    private secActive = Subject.create<boolean>(false);

    private fromIcao = Subject.create<string>('');

    private rwyIdent = Subject.create<string>('');

    private rwyLength = Subject.create<string>('');

    private rwyCrs = Subject.create<string>('');

    private rwyEoSid = Subject.create<string>('');

    private rwyFreq = Subject.create<string>('');

    private rwySid = Subject.create<string>('');

    private rwyTrans = Subject.create<string>('');

    private rwyOptions = Subject.create<ButtonMenuItem[]>([]);

    private sidDisabled = Subject.create<boolean>(false);

    private sidOptions = Subject.create<ButtonMenuItem[]>([]);

    private transDisabled = Subject.create<boolean>(false);

    private transOptions = Subject.create<ButtonMenuItem[]>([]);

    private tmpyInsertButtonDiv = FSComponent.createRef<HTMLDivElement>();

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            switch (val.category) {
            case 'active':
                this.activePageTitle.set('ACTIVE/F-PLN/DEPARTURE');
                break;
            case 'sec1':
                this.activePageTitle.set('SEC1/F-PLN/DEPARTURE');
                break;
            case 'sec2':
                this.activePageTitle.set('SEC2/F-PLN/DEPARTURE');
                break;
            case 'sec3':
                this.activePageTitle.set('SEC3/F-PLN/DEPARTURE');
                break;

            default:
                this.activePageTitle.set('ACTIVE/F-PLN/DEPARTURE');
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
                <ActivePageTitleBar activePage={this.activePageTitle} offset={Subject.create('')} eoIsActive={Subject.create(false)} tmpyIsActive={this.tmpyActive} />
                {/* begin page content */}
                <div class="mfd-fms-fpln-labeled-box-container">
                    <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
                        SELECTED DEPARTURE
                    </span>
                    <div class="mfd-fms-fpln-label-bottom-space" style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 3; display: flex; flex-direction: row; align-items: center;">
                            <span class="mfd-label mfd-spacing-right">FROM</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.fromIcao}
                            </span>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyIdent}
                            </span>
                        </div>
                        <div style="flex: 1.3; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">LENGTH</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyLength}
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">FT</span>
                            </div>
                        </div>
                        <div style="flex: 0.7; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">CRS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyCrs}
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">°</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 0.25; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">EOSID</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyEoSid}
                            </span>
                        </div>
                        <div style="flex: 0.3; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">FREQ/CHAN</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyActive,
                                'mfd-value-sec': this.secActive,
                            }}
                            >
                                {this.rwyFreq}
                            </span>
                        </div>
                        <div style="flex: 0.25; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">SID</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwySid}
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">TRANS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyActive,
                                    'mfd-value-sec': this.secActive,
                                }}
                                >
                                    {this.rwyTrans}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; margin-left: 50px;">
                    <Button
                        label="RWY"
                        onClick={() => null}
                        buttonStyle="width: 250px;"
                        idPrefix="f-pln-dep-rwy-btn"
                        menuItems={this.rwyOptions}
                    />
                    <div style="width: 100px;" />
                    <Button
                        label="SID"
                        onClick={() => null}
                        disabled={this.sidDisabled}
                        buttonStyle="width: 140px;"
                        idPrefix="f-pln-dep-sid-btn"
                        menuItems={this.sidOptions}
                    />
                    <div style="width: 50px;" />
                    <Button
                        label="TRANS"
                        onClick={() => null}
                        disabled={this.transDisabled}
                        buttonStyle="width: 130px;"
                        idPrefix="f-pln-dep-trans-btn"
                        menuItems={this.transOptions}
                    />
                </div>
                <div style="flex-grow: 1;" />
                <div ref={this.tmpyInsertButtonDiv} style="display: flex; justify-content: flex-end; padding: 2px;">
                    <Button label="TMPY F-PLN" onClick={() => this.tmpyActive.set(false)} buttonStyle="color: yellow" />
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} />
            </>
        );
    }
}

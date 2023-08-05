import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './f-pln.scss';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { Button } from 'instruments/src/MFD/pages/common/Button';

interface MfdFmsFplnArrProps extends AbstractMfdPageProps {
}

export class MfdFmsFplnArr extends DisplayComponent<MfdFmsFplnArrProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private activePageTitle = Subject.create<string>('');

    private tmpyIsActive = Subject.create<boolean>(false);

    private secIsActive = Subject.create<boolean>(false);

    private apprDisabled = Subject.create<boolean>(false);

    private viaDisabled = Subject.create<boolean>(false);

    private starDisabled = Subject.create<boolean>(false);

    private transDisabled = Subject.create<boolean>(false);

    private update(): void {
        // ...
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.uiService.activeUri.sub((val) => {
            this.activePageTitle.set(`${val.category.toUpperCase()}/F-PLN/ARRIVAL`);
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
                <div class="mfd-fms-fpln-labeled-box-container">
                    <span class="mfd-label mfd-spacing-right mfd-fms-fpln-labeled-box-label">
                        SELECTED ARRIVAL
                    </span>
                    <div class="mfd-fms-fpln-label-bottom-space" style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 0.2; display: flex; flex-direction: row; align-items: center;">
                            <span class="mfd-label mfd-spacing-right">TO</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyIsActive.get(),
                                'mfd-value-sec': this.secIsActive.get(),
                            }}
                            >
                                WSSS
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">LS</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyIsActive.get(),
                                'mfd-value-sec': this.secIsActive.get(),
                            }}
                            >
                                ICC
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">RWY</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    20C
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">LENGTH</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    13000
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">FT</span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">CRS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    203
                                </span>
                                <span class="mfd-label-unit mfd-unit-trailing">°</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: center;">
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">APPR</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyIsActive.get(),
                                'mfd-value-sec': this.secIsActive.get(),
                            }}
                            >
                                ILS20C
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">FREQ/CHAN</span>
                            <span class={{
                                'mfd-value-green': true,
                                'mfd-value-tmpy': this.tmpyIsActive.get(),
                                'mfd-value-sec': this.secIsActive.get(),
                            }}
                            >
                                109.70
                            </span>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">VIA</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    NONE
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">STAR</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    VJR1B
                                </span>
                            </div>
                        </div>
                        <div style="flex: 0.2; display: flex; flex-direction: column;">
                            <span class="mfd-label mfd-fms-fpln-label-bottom-space">TRANS</span>
                            <div>
                                <span class={{
                                    'mfd-value-green': true,
                                    'mfd-value-tmpy': this.tmpyIsActive.get(),
                                    'mfd-value-sec': this.secIsActive.get(),
                                }}
                                >
                                    NONE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <Button
                        label="RWY"
                        onClick={() => null}
                        buttonStyle="width: 190px;"
                        idPrefix="f-pln-arr-rwy-btn"
                        menuItems={Subject.create([{
                            label: '01 3200M',
                            action: () => null,
                        },
                        {
                            label: '16 1700M',
                            action: () => null,
                        },
                        ])}
                    />
                    <Button
                        label="APPR"
                        onClick={() => null}
                        disabled={this.apprDisabled}
                        buttonStyle="width: 160px;"
                        idPrefix="f-pln-arr-appr-btn"
                        menuItems={Subject.create([{
                            label: 'NONE',
                            action: () => null,
                        },
                        {
                            label: 'AFRI5A',
                            action: () => null,
                        },
                        {
                            label: 'AFRI5H',
                            action: () => null,
                        },
                        {
                            label: 'AMOL5A',
                            action: () => null,
                        },
                        {
                            label: 'AMOL5H',
                            action: () => null,
                        },
                        {
                            label: 'ANET5H',
                            action: () => null,
                        },
                        {
                            label: 'DEPE5A',
                            action: () => null,
                        },
                        {
                            label: 'DEPE5H',
                            action: () => null,
                        },
                        {
                            label: 'FINO5A',
                            action: () => null,
                        },
                        {
                            label: 'FINO5H',
                            action: () => null,
                        },
                        {
                            label: 'FIST5A',
                            action: () => null,
                        },
                        {
                            label: 'FIST5H',
                            action: () => null,
                        },
                        {
                            label: 'TEST1',
                            action: () => null,
                        },
                        {
                            label: 'TEST2',
                            action: () => null,
                        },
                        ])}
                    />
                    <Button
                        label="VIA"
                        onClick={() => null}
                        disabled={this.viaDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-via-btn"
                        menuItems={Subject.create([{
                            label: 'NONE',
                            action: () => null,
                        },
                        ])}
                    />
                    <Button
                        label="STAR"
                        onClick={() => null}
                        disabled={this.starDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-star-btn"
                        menuItems={Subject.create([{
                            label: 'NONE',
                            action: () => null,
                        },
                        ])}
                    />
                    <Button
                        label="TRANS"
                        onClick={() => null}
                        disabled={this.transDisabled}
                        buttonStyle="width: 125px;"
                        idPrefix="f-pln-arr-trans-btn"
                        menuItems={Subject.create([{
                            label: 'NONE',
                            action: () => null,
                        },
                        ])}
                    />
                </div>
                <div style="flex-grow: 1;" />
                <div style="display: flex; justify-content: flex-end; padding: 2px;">
                    <Button label="TMPY F-PLN" onClick={() => null} buttonStyle="color: yellow" />
                </div>
                {/* end page content */}
                <Footer bus={this.props.bus} uiService={this.props.uiService} flightPlanService={this.props.flightPlanService} />
            </>
        );
    }
}

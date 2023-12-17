// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { t } from '../../Components/LocalizedText';

export interface FlightWidgetProps {
    pongText: Subscribable<string>;
}

export class FlightWidget extends DisplayComponent<FlightWidgetProps> {
    private readonly languageButtonRefs = [
        FSComponent.createRef<HTMLButtonElement>(),
        FSComponent.createRef<HTMLButtonElement>(),
    ];

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.languageButtonRefs[0].instance.addEventListener('click', () => this.handleChangeLanguage('en'));
        this.languageButtonRefs[1].instance.addEventListener('click', () => this.handleChangeLanguage('ko'));
    }

    private readonly handleChangeLanguage = (langCode: string): void => {
        NXDataStore.set('EFB_LANGUAGE', langCode);
    }

    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="mb-4 flex flex-row items-center justify-between">
                    <h1 class="font-bold">{t('Dashboard.YourFlight.Title')}</h1>
                </div>
                <div class="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                    <button type="button" ref={this.languageButtonRefs[0]} class="bg-cyan px-5 py-2.5">Set language to English</button>
                    <button type="button" ref={this.languageButtonRefs[1]} class="bg-cyan px-5 py-2.5">Set language to Korean</button>
                    <span class="text-2xl text-red">{this.props.pongText}</span>
                </div>
            </div>
        );
    }
}

export class RemindersWidget extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="flex flex-row items-center justify-between space-x-3">
                    <h1 class="font-bold">{t('Dashboard.ImportantInformation.Title')}</h1>
                </div>
                <div class="relative mt-4 h-content-section-reduced w-full rounded-lg border-2 border-theme-accent p-6">
                    <div />
                </div>
            </div>
        );
    }
}

export interface DashboardProps {
    pongText: Subscribable<string>;
}

export class Dashboard extends DisplayComponent<DashboardProps> {
    render(): VNode {
        return (
            <div class="flex w-full space-x-8">
                <FlightWidget pongText={this.props.pongText} />
                <RemindersWidget />
            </div>
        );
    }
}

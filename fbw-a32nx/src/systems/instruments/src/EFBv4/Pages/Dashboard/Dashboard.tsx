import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { t } from '../../shared/translation';

export class FlightWidget extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="mb-4 flex flex-row items-center justify-between">
                    <h1 class="font-bold">{t('Dashboard.YourFlight.Title')}</h1>
                </div>
                <div class="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                    <div />
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

export class Dashboard extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="flex w-full space-x-8">
                <FlightWidget />
                <RemindersWidget />
            </div>
        );
    }
}

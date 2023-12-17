import {
    DisplayComponent,
    FSComponent,
    VNode,
    ComponentProps,
    EventBus,
    Subscribable,
    ConsumerSubject,
    Subject,
    MappedSubject,
} from '@microsoft/msfs-sdk';
import { EFBSimvars } from '../../../../../../../fbw-a32nx/src/systems/instruments/src/EFBv4/EFBSimvarPublisher';
import { LocalizedString } from '../shared/translation';
import { PageEnum } from '../shared/common';
import { Pager } from '../Pages/Pages';
import { busContext } from '../Contexts';

const BATTERY_LEVEL_WARNING = 8;
const BATTERY_LEVEL_0 = 13;
const BATTERY_LEVEL_1 = 37;
const BATTERY_LEVEL_2 = 62;
const BATTERY_LEVEL_3 = 87;
const BATTERY_ICON_SIZE = 28;

export class QuickControls extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div>
                <i class="bi-gear text-[26px] text-inherit" />
            </div>
        );
    }
}

interface BatteryStatusIconProps extends ComponentProps {
    batteryLevel: Subscribable<number>,
    isCharging: Subscribable<boolean>,
}

export class BatteryIcon extends DisplayComponent<BatteryStatusIconProps> {
    private readonly batteryStatus: Subscribable<PageEnum.BatteryLevel>;

    constructor(props: BatteryStatusIconProps) {
        super(props);

        this.batteryStatus = MappedSubject.create(([batteryLevel, isCharging]) => {
            if (isCharging) {
                return PageEnum.BatteryLevel.Charging;
            }

            if (batteryLevel < PageEnum.BatteryLevel.Warning) {
                return PageEnum.BatteryLevel.Warning;
            }

            if (batteryLevel < PageEnum.BatteryLevel.Low) {
                return PageEnum.BatteryLevel.Low;
            }

            if (batteryLevel < PageEnum.BatteryLevel.LowMedium) {
                return PageEnum.BatteryLevel.LowMedium;
            }

            if (batteryLevel < PageEnum.BatteryLevel.Medium) {
                return PageEnum.BatteryLevel.Medium;
            }

            if (batteryLevel < PageEnum.BatteryLevel.HighMedium) {
                return PageEnum.BatteryLevel.HighMedium;
            }

            return PageEnum.BatteryLevel.Full;
        }, this.props.batteryLevel, this.props.isCharging);
    }

    render(): VNode {
        return (
            <Pager
                pages={[
                    [PageEnum.BatteryLevel.Charging, <i class="bi-battery-charging text-[35px] !text-green-700 text-inherit" />],
                    [PageEnum.BatteryLevel.Warning, <i class="bi-battery text-[35px] !text-utility-red" />],
                    [PageEnum.BatteryLevel.Low, <i class="bi-battery text-[35px] !text-white text-inherit" />],
                    [PageEnum.BatteryLevel.LowMedium, <i class="bi-battery text-[35px] !text-white text-inherit" />],
                    [PageEnum.BatteryLevel.Medium, <i class="bi-battery-half text-[35px] !text-white text-inherit" />],
                    [PageEnum.BatteryLevel.HighMedium, <i class="bi-battery-half text-[35px] !text-white text-inherit" />],
                    [PageEnum.BatteryLevel.Full, <i class="bi-battery-full text-[35px] !text-white text-inherit" />],
                ]}
                activePage={this.batteryStatus}
            />
        );
    }
}

interface BatteryProps extends ComponentProps {
    batteryLevel: Subscribable<number>,
    isCharging: Subscribable<boolean>,
}

export class Battery extends DisplayComponent<BatteryProps> {
    private readonly activeClass = this.props.batteryLevel.map((value) => `w-12 text-right ${value < BATTERY_LEVEL_WARNING ? 'text-utility-red' : 'text-theme-text'}`)

    render(): VNode {
        return (
            <div class="flex items-center space-x-4">
                <p class={this.activeClass}>
                    {this.props.batteryLevel.map((value) => Math.round(value))}
                    %
                </p>
                <BatteryIcon batteryLevel={this.props.batteryLevel} isCharging={this.props.isCharging} />
            </div>
        );
    }
}

interface StatusbarProps extends ComponentProps {
    batteryLevel: Subscribable<number>,
    isCharging: Subscribable<boolean>,
}

export class Statusbar extends DisplayComponent<StatusbarProps, [EventBus]> {
    public override contextType = [busContext] as const;

    private readonly currentUTC = ConsumerSubject.create(null, 0);

    private readonly currentLocalTime = ConsumerSubject.create(null, 0);

    private readonly dayOfWeek = ConsumerSubject.create(null, 0);

    private readonly monthOfYear = ConsumerSubject.create(null, 0);

    private readonly dayOfMonth = ConsumerSubject.create(null, 0);

    private readonly dayName: LocalizedString = LocalizedString.create('StatusBar.Sun');

    private readonly monthName: LocalizedString = LocalizedString.create('StatusBar.Jan');

    private readonly timezones: Subject<string> = Subject.create('utc');

    private readonly timeFormat: Subject<string> = Subject.create('24');

    private readonly timeDisplayed = MappedSubject.create(([currentUTC, currentLocalTime, timezones, timeFormat]) => {
        const getZuluFormattedTime = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}Z`;
        const getLocalFormattedTime = (seconds: number) => {
            if (timeFormat === '24') {
                return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}`;
            }
            const hours = Math.floor(seconds / 3600) % 12;
            const minutes = Math.floor((seconds % 3600) / 60);
            const ampm = Math.floor(seconds / 3600) >= 12 ? 'pm' : 'am';
            return `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
        };

        const currentUTCString = getZuluFormattedTime(currentUTC);
        const currentLocalTimeString = getLocalFormattedTime(currentLocalTime);

        if (timezones === 'utc') {
            return currentUTCString;
        } if (timezones === 'local') {
            return currentLocalTimeString;
        }
        return `${currentUTCString} / ${currentLocalTimeString}`;
    }, this.currentUTC, this.currentLocalTime, this.timezones, this.timeFormat);

    private readonly simBridgeConnected: Subject<boolean> = Subject.create(false);

    private readonly wifiClass = this.simBridgeConnected.map((value) => `bi-${value ? 'wifi' : 'wifi-off'} text-inherit text-[26px]`);

    private get bus() {
        return this.getContext(busContext).get();
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.bus.getSubscriber<EFBSimvars>();
        this.currentUTC.setConsumer(sub.on('currentUTC'));
        this.currentLocalTime.setConsumer(sub.on('currentLocalTime'));
        this.dayOfWeek.setConsumer(sub.on('dayOfWeek'));
        this.monthOfYear.setConsumer(sub.on('monthOfYear'));
        this.dayOfMonth.setConsumer(sub.on('dayOfMonth'));
        this.dayOfWeek.setConsumer(sub.on('dayOfWeek'));

        this.dayOfWeek.sub((value) => {
            this.dayName.set([
                'StatusBar.Sun',
                'StatusBar.Mon',
                'StatusBar.Tue',
                'StatusBar.Wed',
                'StatusBar.Thu',
                'StatusBar.Fri',
                'StatusBar.Sat',
            ][value]);
        }, true);

        this.monthOfYear.sub((value) => {
            this.monthName.set([
                'StatusBar.Jan',
                'StatusBar.Feb',
                'StatusBar.Mar',
                'StatusBar.Apr',
                'StatusBar.May',
                'StatusBar.Jun',
                'StatusBar.Jul',
                'StatusBar.Aug',
                'StatusBar.Sep',
                'StatusBar.Oct',
                'StatusBar.Nov',
                'StatusBar.Dec',
            ][value - 1]);
        }, true);
    }

    render(): VNode {
        return (
            <div class="fixed z-30 flex h-10 w-full items-center justify-between bg-theme-statusbar px-6 text-lg font-medium leading-none text-theme-text">
                <p>
                    {this.dayName}
                    {' '}
                    {this.monthName}
                    {' '}
                    {this.dayOfMonth.map((value) => value.toFixed())}
                </p>

                <div class="absolute inset-x-0 mx-auto flex w-min flex-row items-center justify-center space-x-4">
                    <p>{this.timeDisplayed}</p>
                </div>

                <div class="flex items-center gap-4">
                    <QuickControls />
                    <i class={this.wifiClass} />
                    <Battery batteryLevel={this.props.batteryLevel} isCharging={this.props.isCharging} />
                </div>
            </div>
        );
    }
}

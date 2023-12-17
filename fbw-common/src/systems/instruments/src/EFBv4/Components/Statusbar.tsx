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
import { t } from './LocalizedText';
import { LocalizedString } from '../shared/translation';
import { Button } from './Button';
import {PageEnum} from "../shared/common";
import { Pager, Pages } from '../Pages/Pages';

const BATTERY_LEVEL_WARNING = 8;
const BATTERY_LEVEL_0 = 13;
const BATTERY_LEVEL_1 = 37;
const BATTERY_LEVEL_2 = 62;
const BATTERY_LEVEL_3 = 87;
const BATTERY_ICON_SIZE = 28;

interface StatusbarProps extends ComponentProps {
    bus: EventBus;
    batteryLevel: Subscribable<number>,
    isCharging: Subscribable<boolean>,
}

interface BatteryProps extends ComponentProps {
    batteryLevel: Subscribable<number>,
    isCharging: Subscribable<boolean>,
}

export class QuickControls extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div>
                <i class="bi-gear text-inherit text-[26px]" />
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

        }, this.props.batteryLevel, this.props.isCharging)
    }

    render(): VNode {
        return (
            <Pager pages={[
                [PageEnum.BatteryLevel.Charging, <i class="bi-battery-charging text-inherit text-[35px] !text-green-700" />],
                [PageEnum.BatteryLevel.Warning, <i class="bi-battery text-[35px] !text-utility-red" />],
                [PageEnum.BatteryLevel.Low, <i class="bi-battery text-inherit text-[35px] !text-white" />],
                [PageEnum.BatteryLevel.LowMedium, <i class="bi-battery text-inherit text-[35px] !text-white" />],
                [PageEnum.BatteryLevel.Medium, <i class="bi-battery-half text-inherit text-[35px] !text-white" />],
                [PageEnum.BatteryLevel.HighMedium, <i class="bi-battery-half text-inherit text-[35px] !text-white" />],
                [PageEnum.BatteryLevel.Full, <i class="bi-battery-full text-inherit text-[35px] !text-white" />],

            ]}
                   activePage={this.batteryStatus}
            />
        );
    }
}

export class Battery extends DisplayComponent<BatteryProps> {
    private readonly activeClass = this.props.batteryLevel.map((value) => {
        return `w-12 text-right ${value < BATTERY_LEVEL_WARNING ? 'text-utility-red' : 'text-theme-text'}`;
    })

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

export class Statusbar extends DisplayComponent<StatusbarProps> {
    private readonly currentUTC: Subscribable<number>;

    private readonly currentLocalTime: Subscribable<number>;

    private readonly dayOfWeek: Subscribable<number>;

    private readonly monthOfYear: Subscribable<number>;

    private readonly dayOfMonth: Subscribable<number>;

    private readonly dayName: LocalizedString = LocalizedString.create('StatusBar.Sun');

    private readonly monthName: LocalizedString = LocalizedString.create('StatusBar.Jan');

    private readonly timezones: Subject<string> = Subject.create('utc');

    private readonly timeFormat: Subject<string> = Subject.create('24');

    private readonly timeDisplayed: Subscribable<string>;

    private readonly simBridgeConnected: Subject<boolean> = Subject.create(false);

    private readonly wifiClass: Subscribable<string>;

    constructor(props: StatusbarProps) {
        super(props);

        const sub = this.props.bus.getSubscriber<EFBSimvars>();
        this.currentUTC = ConsumerSubject.create(sub.on('currentUTC'), 0);
        this.currentLocalTime = ConsumerSubject.create(sub.on('currentLocalTime'), 0);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);
        this.monthOfYear = ConsumerSubject.create(sub.on('monthOfYear'), 1);
        this.dayOfMonth = ConsumerSubject.create(sub.on('dayOfMonth'), 1);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);

        this.timeDisplayed = MappedSubject.create(([currentUTC, currentLocalTime, timezones, timeFormat]) => {
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
            } else if (timezones === 'local') {
                return currentLocalTimeString;
            } else {
                return `${currentUTCString} / ${currentLocalTimeString}`;
            }
        }, this.currentUTC, this.currentLocalTime, this.timezones, this.timeFormat);

        this.wifiClass = this.simBridgeConnected.map((value) => `bi-${value ? 'wifi' : 'wifi-off'} text-inherit text-[26px]`);
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

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

import React from 'react';
import { IconBattery, IconBattery1, IconBattery2, IconBattery3, IconBattery4, IconBatteryCharging } from '@tabler/icons';

type BatteryStatusProps = {
    batteryLevel: number;
    isCharging: boolean;
};

const BATTERY_LEVEL_WARNING = 8;
const BATTERY_LEVEL_0 = 13;
const BATTERY_LEVEL_1 = 37;
const BATTERY_LEVEL_2 = 62;
const BATTERY_LEVEL_3 = 87;
const BATTERY_ICON_SIZE = 28;

export const BatteryStatus = ({ batteryLevel, isCharging }: BatteryStatusProps) => (
    <div className="flex items-center space-x-4">
        <text
            className={`w-12 text-right ${batteryLevel < BATTERY_LEVEL_WARNING ? 'text-red-500' : 'text-white'}`}
        >
            {Math.round(batteryLevel)}
            %
        </text>
        <BatteryStatusIcon batteryLevel={batteryLevel} isCharging={isCharging} />
    </div>
);

const BatteryStatusIcon = ({ batteryLevel, isCharging }: BatteryStatusProps) => {
    if (isCharging) {
        return <IconBatteryCharging size={BATTERY_ICON_SIZE} color="green" />;
    }

    if (batteryLevel < BATTERY_LEVEL_0) {
        return <IconBattery size={BATTERY_ICON_SIZE} color={batteryLevel < BATTERY_LEVEL_WARNING ? 'red' : 'white'} />;
    }

    if (batteryLevel < BATTERY_LEVEL_1) {
        return <IconBattery1 size={BATTERY_ICON_SIZE} />;
    }

    if (batteryLevel < BATTERY_LEVEL_2) {
        return <IconBattery2 size={BATTERY_ICON_SIZE} />;
    }

    if (batteryLevel < BATTERY_LEVEL_3) {
        return <IconBattery3 size={BATTERY_ICON_SIZE} />;
    }

    return <IconBattery4 size={BATTERY_ICON_SIZE} />;
};

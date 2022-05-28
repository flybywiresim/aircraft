import React from 'react';
import { Battery, BatteryCharging, BatteryFull, BatteryHalf } from 'react-bootstrap-icons';

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
        <p className={`w-12 text-right ${batteryLevel < BATTERY_LEVEL_WARNING ? 'text-utility-red' : 'text-theme-text'}`}>
            {Math.round(batteryLevel)}
            %
        </p>
        <BatteryStatusIcon batteryLevel={batteryLevel} isCharging={isCharging} />
    </div>
);

const BatteryStatusIcon = ({ batteryLevel, isCharging }: BatteryStatusProps) => {
    if (isCharging) {
        return <BatteryCharging size={BATTERY_ICON_SIZE} color="green" />;
    }

    if (batteryLevel < BATTERY_LEVEL_0) {
        return <Battery size={BATTERY_ICON_SIZE} className={batteryLevel < BATTERY_LEVEL_WARNING ? 'text-utility-red' : 'text-white'} />;
    }

    if (batteryLevel < BATTERY_LEVEL_1) {
        return <Battery size={BATTERY_ICON_SIZE} />;
    }

    if (batteryLevel < BATTERY_LEVEL_2) {
        return <BatteryHalf size={BATTERY_ICON_SIZE} />;
    }

    if (batteryLevel < BATTERY_LEVEL_3) {
        return <BatteryHalf size={BATTERY_ICON_SIZE} />;
    }

    return <BatteryFull size={BATTERY_ICON_SIZE} />;
};

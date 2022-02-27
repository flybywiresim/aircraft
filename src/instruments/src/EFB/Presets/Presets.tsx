import React from 'react';
import { LightPresets } from './Widgets/LightPresets';
import { AircraftPresets } from './Widgets/AircraftPresets';

export const Presets = () => (
    <div className="flex space-x-8 w-full">
        <LightPresets />
        <AircraftPresets />
    </div>
);

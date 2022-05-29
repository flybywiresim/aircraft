import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';

export const Dashboard = () => (
    <div className="flex space-x-8 w-full">
        <FlightWidget />
        <RemindersWidget />
    </div>
);

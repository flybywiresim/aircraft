import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';

export const Dashboard = () => (
    <div className="w-full">
        <h1 className="mb-4 font-bold">Dashboard</h1>

        <div className="flex space-x-6 w-full h-efb">
            <FlightWidget />

            <RemindersWidget />
        </div>
    </div>
);

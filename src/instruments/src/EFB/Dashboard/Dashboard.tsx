import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';

export const Dashboard = () => (
    <div className="w-full">
        <h1 className="font-bold">Dashboard</h1>

        <div className="flex mt-4 space-x-6 w-full h-efb">
            <FlightWidget />

            <RemindersWidget />
        </div>
    </div>
);

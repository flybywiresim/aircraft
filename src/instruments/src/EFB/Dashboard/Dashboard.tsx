import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';

export const Dashboard = () => (
    <div className="w-full">
        <h1 className="font-bold">Dashboard</h1>

        <div className="flex mt-4 w-full h-efb">
            <FlightWidget />

            <div className="overflow-hidden p-6 w-1/2 h-full rounded-lg border-2 border-theme-accent">
                <RemindersWidget />
            </div>
        </div>
    </div>
);

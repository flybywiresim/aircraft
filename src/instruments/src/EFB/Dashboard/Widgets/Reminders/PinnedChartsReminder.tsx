import React from 'react';
import { useAppSelector } from '../../../Store/store';
import { PinnedChartCard } from '../../../Navigation/Pages/PinnedChartsPage';
import { RemindersSection } from './RemindersSection';

export const PinnedChartsReminder = () => {
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

    return (
        <RemindersSection title="Pinned Charts" pageLinkPath="/navigation">
            <div className="grid grid-cols-2">
                {[...pinnedCharts].sort((a, b) => b.timeAccessed - a.timeAccessed).map((pinnedChart, index) => (
                    <PinnedChartCard pinnedChart={pinnedChart} className={`${index && index % 2 !== 0 && 'ml-4'} mt-4`} />
                ))}
            </div>

            {!pinnedCharts.length && (
                <h1 className="m-auto my-4 font-bold opacity-60">No Pinned Charts</h1>
            )}
        </RemindersSection>
    );
};

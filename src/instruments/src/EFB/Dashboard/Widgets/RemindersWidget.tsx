import React, { FC } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { A320Failure } from '@flybywiresim/failures';
import { Link } from 'react-router-dom';
import { usePersistentProperty } from '@instruments/common/persistence';
import { setChartId, setChartLinks, setChartName, setIcao, setTabIndex, setChartRotation, setChartDimensions } from '../../Store/features/navigationPage';
import { useNavigraph } from '../../ChartsApi/Navigraph';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { WeatherWidget } from './WeatherWidget';

export const RemindersWidget = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);
    const navigraph = useNavigraph();
    const dispatch = useAppDispatch();
    const [, setChartSource] = usePersistentProperty('EFB_CHART_SOURCE');

    const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);

    return (
        <div className="p-6 w-full rounded-lg border-2 border-theme-accent">
            <ScrollableContainer height={51}>
                <div className="flex flex-col space-y-4">
                    <RemindersSection title="Weather" noLink>
                        <div className="space-y-6">
                            <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
                            <div className="w-full h-1 bg-theme-accent rounded-full" />
                            <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
                        </div>
                    </RemindersSection>
                    {navigraph.hasToken && (
                        <RemindersSection title="Pinned Charts" pageLinkPath="/navigation">
                            <div className="grid grid-cols-2">
                                {pinnedCharts.map((chart, index) => (
                                    <Link
                                        to="/navigation"
                                        className={`flex flex-col flex-wrap p-2 mt-4 bg-theme-accent rounded-md ${index && index % 2 !== 0 && 'ml-4'}`}
                                        onClick={() => {
                                            setChartSource('NAVIGRAPH');
                                            dispatch(setChartDimensions({ width: undefined, height: undefined }));
                                            dispatch(setChartLinks({ light: '', dark: '' }));
                                            dispatch(setChartName(chart.chartName));
                                            dispatch(setChartId(chart.chartId));
                                            dispatch(setIcao(chart.icao));
                                            dispatch(setTabIndex(chart.tabIndex));
                                            dispatch(setChartRotation(0));
                                        }}
                                    >
                                        <h2 className="font-bold">{chart.icao}</h2>
                                        <span className="mt-2 font-inter">{chart.title}</span>
                                        <IconArrowRight className="ml-auto text-theme-highlight" />
                                    </Link>
                                ))}
                            </div>
                            {!pinnedCharts.length && (
                                <h1 className="m-auto my-4 font-bold opacity-60">No Pinned Charts</h1>
                            )}
                        </RemindersSection>
                    )}
                    <RemindersSection title="Maintenance" pageLinkPath="/failures">
                        <div className="flex flex-row flex-wrap">
                            {Array
                                .from(activeFailures)
                            // Sorts the failures by name length, greatest to least
                                .sort((a, b) => (allFailures.find((f) => f.identifier === b)?.name ?? '').length - (allFailures.find((f) => f.identifier === a)?.name ?? '').length)
                                .map((failure) => (
                                    <ActiveFailureReminder name={allFailures.find((it) => it.identifier === failure)?.name ?? '<unknown>'} />
                                ))}
                            {!activeFailures.size && (
                                <h1 className="m-auto my-4 font-bold opacity-60">No Active Failures</h1>
                            )}
                        </div>
                    </RemindersSection>
                    <RemindersSection title="Checklists" pageLinkPath="/checklists" />
                </div>
            </ScrollableContainer>
        </div>
    );
};

interface RemindersSectionProps {
    title: string,
    pageLinkPath?: string,
    noLink?: boolean
}

const RemindersSection: FC<RemindersSectionProps> = ({ title, children, pageLinkPath, noLink }) => (
    <div className="flex flex-col pb-6 border-b-2 border-gray-700">
        <div className="flex flex-row justify-between items-center mb-2">
            <h2 className="font-medium">{title}</h2>

            {!noLink && (
                <Link to={pageLinkPath} className="flex items-center text-theme-highlight border-b-2 border-theme-highlight opacity-80 hover:opacity-100 transition duration-100">
                    <span className="font-bold text-theme-highlight font-manrope">Go to Page</span>

                    <IconArrowRight className="fill-current" />
                </Link>
            )}
        </div>

        {children}
    </div>
);

interface ActiveFailureReminderProps {
    name: string,
}

const ActiveFailureReminder: FC<ActiveFailureReminderProps> = ({ name }) => (
    <div className="flex flex-col flex-wrap p-2 mt-4 mr-4 bg-theme-highlight rounded-md border-2 border-theme-highlight">
        <h3 className="font-bold text-black">Active Failure</h3>
        <span className="mt-2 text-black font-inter">{name}</span>
        <span className="ml-auto text-black">
            <IconArrowRight />
        </span>
    </div>
);

const InopEquipmentReminder: FC = () => (
    <div className="flex flex-col flex-wrap p-2 mr-4 w-48 rounded-md border-2 border-theme-highlight">
        <h3 className="font-bold text-theme-highlight">INOP Equipment</h3>
        <span className="mt-2 text-theme-highlight font-inter">FD 2</span>
        <span className="ml-auto text-theme-highlight">
            <IconArrowRight />
        </span>
    </div>
);

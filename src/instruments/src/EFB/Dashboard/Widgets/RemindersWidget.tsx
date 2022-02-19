import React, { FC, useState } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { A320Failure } from '@flybywiresim/failures';
import { Link } from 'react-router-dom';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ArrowDown, ArrowUp, Check, PencilFill } from 'react-bootstrap-icons';
import {
    setChartId,
    setChartLinks,
    setChartName,
    setIcao,
    setTabIndex,
    setChartRotation,
    setChartDimensions,
    editPinnedChart,
} from '../../Store/features/navigationPage';
import { useNavigraph } from '../../ChartsApi/Navigraph';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { WeatherWidget } from './WeatherWidget';
import {
    areAllChecklistItemsCompleted, TrackingChecklist,
    getChecklistCompletion,
    setSelectedChecklistIndex,
} from '../../Store/features/checklists';

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

const WeatherReminder = () => {
    const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);

    return (
        <RemindersSection title="Weather" noLink>
            <div className="space-y-6">
                <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
                <div className="w-full h-1 bg-theme-accent rounded-full" />
                <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
            </div>
        </RemindersSection>
    );
};

const PinnedChartsReminder = () => {
    const dispatch = useAppDispatch();
    const [, setChartSource] = usePersistentProperty('EFB_CHART_SOURCE');
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);
    const navigraph = useNavigraph();

    // if (!navigraph.hasToken) return null;

    return (
        <RemindersSection title="Pinned Charts" pageLinkPath="/navigation">
            <div className="grid grid-cols-2">
                {/* A spread here is necessary to make Redux not kill itself */}
                {[...pinnedCharts].sort((a, b) => b.timeAccessed - a.timeAccessed).map(({
                    chartId,
                    chartName,
                    icao,
                    tabIndex,
                    title,
                }, index) => (
                    <Link
                        to="/navigation/navigraph"
                        className={`flex flex-col flex-wrap p-2 mt-4 bg-theme-accent rounded-md ${index && index % 2 !== 0 && 'ml-4'}`}
                        onClick={() => {
                            setChartSource('NAVIGRAPH');
                            dispatch(setChartDimensions({ width: undefined, height: undefined }));
                            dispatch(setChartLinks({ light: '', dark: '' }));
                            dispatch(setChartName(chartName));
                            dispatch(setChartId(chartId));
                            dispatch(setIcao(icao));
                            dispatch(setTabIndex(tabIndex));
                            dispatch(setChartRotation(0));
                            dispatch(editPinnedChart({
                                chartId,
                                timeAccessed: new Date().getTime(),
                            }));
                        }}
                    >
                        <h2 className="font-bold">{icao}</h2>
                        <span className="mt-2 font-inter">{title}</span>
                        <IconArrowRight className="mt-auto ml-auto text-theme-highlight" />
                    </Link>
                ))}
            </div>
            {!pinnedCharts.length && (
                <h1 className="m-auto my-4 font-bold opacity-60">No Pinned Charts</h1>
            )}
        </RemindersSection>
    );
};

const MaintenanceReminder = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();

    return (
        <RemindersSection title="Maintenance" pageLinkPath="/failures">
            <div className="flex flex-row flex-wrap">
                {Array
                    .from(activeFailures)
                    // Sorts the failures by name length, greatest to least
                    .sort((a, b) => (allFailures.find((f) => f.identifier === b)?.name ?? '').length - (allFailures.find((f) => f.identifier === a)?.name ?? '').length)
                    .map((failure) => (
                        <ActiveFailureReminder
                            name={allFailures.find((it) => it.identifier === failure)?.name ?? '<unknown>'}
                        />
                    ))}
                {!activeFailures.size && (
                    <h1 className="m-auto my-4 font-bold opacity-60">No Active Failures</h1>
                )}
            </div>
        </RemindersSection>
    );
};

interface ChecklistReminderWidgetProps {
    checklist: TrackingChecklist,
    checklistIndex: number
}

const ChecklistReminderWidget = ({ checklist, checklistIndex }: ChecklistReminderWidgetProps) => {
    const dispatch = useAppDispatch();

    let color = 'text-theme-highlight';

    if (areAllChecklistItemsCompleted(checklistIndex)) {
        if (checklist.markedCompleted) {
            color = 'text-colors-lime-400';
        } else {
            color = 'text-colors-orange-400';
        }
    }

    return (
        <Link
            to="/checklists"
            className={`relative overflow-hidden flex flex-col flex-wrap px-2 pt-3 pb-2 mt-4 bg-theme-accent rounded-md 
            ${checklistIndex && checklistIndex % 2 !== 0 && 'ml-4'}
            ${color}
            `}
            onClick={() => {
                dispatch(setSelectedChecklistIndex(checklistIndex));
            }}
        >
            <div className="absolute top-0 left-0 flex-row w-full h-2 text-current bg-theme-secondary">
                <div
                    className="h-full text-current bg-current"
                    style={{
                        width: `${getChecklistCompletion(checklistIndex) * 100}%`,
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>

            <h2 className="font-bold">{checklist.name}</h2>

            {checklist.markedCompleted ? (
                <Check className="mt-auto ml-auto text-colors-lime-400" size={28} />
            ) : (
                <IconArrowRight className="mt-auto ml-auto text-current" />
            )}
        </Link>
    );
};

const ChecklistsReminder = () => {
    const { checklists } = useAppSelector((state) => state.trackingChecklists);

    return (
        <RemindersSection title="Checklists" pageLinkPath="/checklists">
            <div className="grid grid-cols-2">
                {checklists.map((checklist, clIndex) => (
                    <ChecklistReminderWidget checklist={checklist} checklistIndex={clIndex} />
                ))}
            </div>
        </RemindersSection>
    );
};

type ReminderKey = 'Weather' | 'Pinned Charts' | 'Maintenance' | 'Checklists';

const REMINDERS = new Map<ReminderKey, JSX.Element>([
    ['Weather', <WeatherReminder />],
    ['Pinned Charts', <PinnedChartsReminder />],
    ['Maintenance', <MaintenanceReminder />],
    ['Checklists', <ChecklistsReminder />],
]);

interface ReminderKeyEditCardProps {
    reminderKey: ReminderKey;
    index: number;
    setter: (destIndex: number) => void;
    keyArrLen: number;
}

const ReminderKeyEditCard = ({ reminderKey, setter, index, keyArrLen }: ReminderKeyEditCardProps) => (
    <div className="flex flex-row justify-between items-center p-4 w-full bg-theme-accent rounded-md">
        <h1>{reminderKey}</h1>
        <div className="flex flex-row">
            <div className="w-10">
                <ArrowUp
                    size={25}
                    onClick={() => {
                        if (index === 0) {
                            setter(keyArrLen - 1);
                        } else {
                            setter(index - 1);
                        }
                    }}
                />
            </div>
            <div className="w-10">
                <ArrowDown
                    size={25}
                    onClick={() => {
                        if (index === keyArrLen - 1) {
                            setter(0);
                        } else {
                            setter(index + 1);
                        }
                    }}
                />
            </div>
        </div>
    </div>
);

export const RemindersWidget = () => {
    const [orderedReminderKeys, setOrderedReminderKeys] = usePersistentProperty(
        'REMINDER_WIDGET_ORDERED_KEYS',
        'Weather,Pinned Charts,Maintenance,Checklists',
    );
    const reminderKeyArr = orderedReminderKeys.split(',') as ReminderKey[];

    const [reorderMode, setReorderMode] = useState(false);

    const arrayMove = (element: ReminderKey, toIndex: number) => {
        reminderKeyArr.splice(reminderKeyArr.indexOf(element), 1);
        reminderKeyArr.splice(toIndex, 0, element);

        return reminderKeyArr.toString();
    };

    return (
        <div className="w-full">
            <div className="flex flex-row justify-between items-center space-x-3">
                <h1 className="font-bold">Important Information</h1>
                <PencilFill
                    className={`transition duration-100 ${reorderMode && 'text-theme-highlight'}`}
                    size={25}
                    onClick={() => setReorderMode((old) => !old)}
                />
            </div>
            <div className="relative p-6 mt-4 w-full h-efb rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={51}>
                    <div className="flex flex-col space-y-4">
                        {reminderKeyArr.map((key) => REMINDERS.get(key))}
                    </div>
                </ScrollableContainer>
                <div className={`absolute inset-0 z-40 transition duration-100 ${reorderMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-theme-body opacity-80" />
                    <div className="absolute inset-0">
                        <ScrollableContainer height={51}>
                            <div className="p-6 space-y-4">
                                {reminderKeyArr.map((key, index) => (
                                    <ReminderKeyEditCard
                                        reminderKey={key}
                                        keyArrLen={reminderKeyArr.length}
                                        setter={(index) => setOrderedReminderKeys(arrayMove(key, index))}
                                        index={index}
                                        key={key}
                                    />
                                ))}
                            </div>
                        </ScrollableContainer>
                    </div>
                </div>
            </div>
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

const InopEquipmentReminder: FC = () => (
    <div className="flex flex-col flex-wrap p-2 mr-4 w-48 rounded-md border-2 border-theme-highlight">
        <h3 className="font-bold text-theme-highlight">INOP Equipment</h3>
        <span className="mt-2 text-theme-highlight font-inter">FD 2</span>
        <span className="ml-auto text-theme-highlight">
            <IconArrowRight />
        </span>
    </div>
);

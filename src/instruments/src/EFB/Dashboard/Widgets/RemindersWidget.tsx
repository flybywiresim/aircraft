import React, { FC, useEffect, useState } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { Link, useHistory } from 'react-router-dom';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ArrowDown, ArrowUp, Check, PencilFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { AtaChapterNumber } from '@shared/ata';
import { findLatestSeenPathname } from '../../Utils/routing';
import { setSearchQuery } from '../../Store/features/failuresPage';
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
import { getRelevantChecklistIndices } from '../../Checklists/Checklists';
import { PinnedChartCard } from '../../Navigation/Pages/PinnedChartsPage';

interface ActiveFailureReminderProps {
    ata?: AtaChapterNumber;
    name: string;
}

const ActiveFailureReminder: FC<ActiveFailureReminderProps> = ({ ata, name }) => {
    const dispatch = useAppDispatch();
    const history = useHistory();

    return (
        <div
            className="flex flex-col flex-wrap p-2 mt-4 mr-4 rounded-md border-2 bg-theme-highlight border-theme-highlight"
            onClick={() => {
                dispatch(setSearchQuery(name.toUpperCase()));

                const lastFailurePath = findLatestSeenPathname(history, '/failures');

                if (!ata) {
                    history.push('/failures/compact');
                }

                if (!lastFailurePath || lastFailurePath.includes('comfort')) {
                    history.push(`/failures/comfort/${ata}`);
                } else {
                    history.push('/failures/compact');
                }
            }}
        >
            <h3 className="font-bold text-black">Active Failure</h3>
            <span className="mt-2 text-black font-inter">{name}</span>
            <span className="ml-auto text-black">
                <IconArrowRight />
            </span>
        </div>
    );
};

const WeatherReminder = () => {
    const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);

    return (
        <RemindersSection title="Weather" noLink>
            <div className="space-y-6">
                <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
                <div className="w-full h-1 rounded-full bg-theme-accent" />
                <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
            </div>
        </RemindersSection>
    );
};

const PinnedChartsReminder = () => {
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

    const navigraph = useNavigraph();

    // if (!navigraph.hasToken) return null;

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

const MaintenanceReminder = () => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();

    return (
        <RemindersSection title="Maintenance" pageLinkPath="/failures">
            <div className="flex flex-row flex-wrap">
                {Array
                    .from(activeFailures)
                    // Sorts the failures by name length, greatest to least
                    .sort((a, b) => (allFailures.find((f) => f.identifier === b)?.name ?? '').length - (allFailures.find((f) => f.identifier === a)?.name ?? '').length)
                    .map((failureIdentifier) => {
                        const failure = allFailures.find((it) => it.identifier === failureIdentifier);

                        return (
                            <ActiveFailureReminder
                                ata={failure?.ata}
                                name={failure?.name ?? '<unknown>'}
                            />
                        );
                    })}
                {!activeFailures.size && (
                    <h1 className="m-auto my-4 font-bold opacity-60">No Active Failures</h1>
                )}
            </div>
        </RemindersSection>
    );
};

interface ChecklistReminderWidgetProps {
    checklist: TrackingChecklist;
    checklistIndex: number;
    className?: string;
}

const ChecklistReminderWidget = ({ checklist, checklistIndex, className }: ChecklistReminderWidgetProps) => {
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
            className={`relative overflow-hidden flex flex-col flex-wrap px-2 pt-3 pb-2 mt-4 bg-theme-accent rounded-md ${color} ${className}`}
            onClick={() => {
                dispatch(setSelectedChecklistIndex(checklistIndex));
            }}
        >
            <div className="absolute top-0 left-0 flex-row w-full h-1.5 text-current bg-theme-secondary">
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

    const relevantChecklistIndices = getRelevantChecklistIndices();
    const [relevantChecklists, setRelevantChecklists] = useState([...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)));

    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 1000);

    useEffect(() => {
        setRelevantChecklists([...checklists].filter((_, clIndex) => relevantChecklistIndices.includes(clIndex)));
    }, [flightPhase]);

    return (
        <RemindersSection title="Checklists" pageLinkPath="/checklists">
            {relevantChecklists.length ? (
                <div className="grid grid-cols-2">
                    {relevantChecklists.map((checklist, index) => (
                        <ChecklistReminderWidget
                            checklist={checklist}
                            checklistIndex={checklists.findIndex((cl) => cl.name === checklist.name)}
                            className={`${index && index % 2 !== 0 && 'ml-4'}`}
                        />
                    ))}
                </div>
            ) : (
                <h1 className="m-auto my-4 font-bold opacity-60">No Relevant Checklists</h1>
            )}
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
    <div className="flex flex-row justify-between items-center p-4 w-full rounded-md bg-theme-accent">
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

    /**
     * Let's check for any missing keys in the saved list in case more widgets get added in the future.
     */
    useEffect(() => {
        Array.from(REMINDERS.keys()).forEach((key) => {
            if (!reminderKeyArr.includes(key)) {
                setOrderedReminderKeys(`${orderedReminderKeys},${key}`);
            }
        });
    }, []);

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
            <div className="relative p-6 mt-4 w-full rounded-lg border-2 h-content-section-reduced border-theme-accent">
                <ScrollableContainer height={51}>
                    <div className="flex flex-col space-y-4">
                        {reminderKeyArr.map((key) => REMINDERS.get(key))}
                    </div>
                </ScrollableContainer>
                <div className={`absolute inset-0 z-40 transition duration-100 ${reorderMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 opacity-80 bg-theme-body" />
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
                <Link to={pageLinkPath} className="flex items-center border-b-2 opacity-80 hover:opacity-100 transition duration-100 text-theme-highlight border-theme-highlight">
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

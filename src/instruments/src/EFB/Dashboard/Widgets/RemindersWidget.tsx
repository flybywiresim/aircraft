import React, { useEffect, useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ArrowDown, ArrowUp, PencilFill } from 'react-bootstrap-icons';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { WeatherReminder } from './Reminders/WeatherReminder';
import { PinnedChartsReminder } from './Reminders/PinnedChartsReminder';
import { MaintenanceReminder } from './Reminders/MaintenanceReminder';
import { ChecklistsReminder } from './Reminders/ChecklistsReminder';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

type ReminderKey = 'Weather' | 'Pinned Charts' | 'Maintenance' | 'Checklists';

const REMINDERS = new Map<ReminderKey, JSX.Element>([
    ['Weather', <WeatherReminder key="weather" />],
    ['Pinned Charts', <PinnedChartsReminder key="pinnedCharts" />],
    ['Maintenance', <MaintenanceReminder key="maintenance" />],
    ['Checklists', <ChecklistsReminder key="checklists" />],
]);

const TRANSLATIONS = new Map<ReminderKey, string>([
    ['Weather', 'Dashboard.ImportantInformation.Weather.Title'],
    ['Pinned Charts', 'Dashboard.ImportantInformation.PinnedCharts.Title'],
    ['Maintenance', 'Dashboard.ImportantInformation.Maintenance.Title'],
    ['Checklists', 'Dashboard.ImportantInformation.Checklists.Title'],
]);

interface ReminderKeyEditCardProps {
    reminderText: string;
    index: number;
    setter: (destIndex: number) => void;
    keyArrLen: number;
}

const ReminderKeyEditCard = ({ reminderText, setter, index, keyArrLen }: ReminderKeyEditCardProps) => (
    <div className="flex flex-row justify-between items-center p-4 w-full bg-theme-accent rounded-md">
        <h1>{reminderText}</h1>
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
        [...REMINDERS.keys()].toString(),
    );
    const reminderKeyArr = orderedReminderKeys.split(',') as ReminderKey[];

    /**
     * Let's check for any missing keys in the saved list in case more widgets get added in the future.
     */
    useEffect(() => {
        [...REMINDERS.keys()].forEach((key) => {
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
        <div className="w-1/2">
            <div className="flex flex-row justify-between items-center space-x-3">
                <h1 className="font-bold">{t('Dashboard.ImportantInformation.Title')}</h1>
                <TooltipWrapper text={t('Dashboard.ImportantInformation.TT.RearrangeWidgets')}>
                    <PencilFill
                        className={`transition duration-100 ${reorderMode && 'text-theme-highlight'}`}
                        size={25}
                        onClick={() => setReorderMode((old) => !old)}
                    />
                </TooltipWrapper>
            </div>
            <div className="relative p-6 mt-4 w-full h-content-section-reduced rounded-lg border-2 border-theme-accent">
                <ScrollableContainer height={51}>
                    <div className="flex flex-col space-y-4">
                        {reminderKeyArr.map((key) => REMINDERS.get(key))}
                    </div>
                </ScrollableContainer>
                <div className={`absolute inset-0 z-30 transition duration-100 ${reorderMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-theme-body opacity-80" />
                    <div className="absolute inset-0">
                        <ScrollableContainer innerClassName="p-6 space-y-4" height={51}>
                            {reminderKeyArr.map((key, index) => (
                                <ReminderKeyEditCard
                                    reminderText={t(TRANSLATIONS.get(key)!)}
                                    keyArrLen={reminderKeyArr.length}
                                    setter={(index) => setOrderedReminderKeys(arrayMove(key, index))}
                                    index={index}
                                    key={key}
                                />
                            ))}
                        </ScrollableContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

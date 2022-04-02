import React, { useEffect, useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ArrowDown, ArrowUp, PencilFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { WeatherReminder } from './Reminders/WeatherReminder';
import { PinnedChartsReminder } from './Reminders/PinnedChartsReminder';
import { MaintenanceReminder } from './Reminders/MaintenanceReminder';
import { ChecklistsReminder } from './Reminders/ChecklistsReminder';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

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

    const { t } = useTranslation();

    return (
        <div className="w-full">
            <div className="flex flex-row justify-between items-center space-x-3">
                <h1 className="font-bold">{t('Dashboard.ImportantInformation')}</h1>

                <TooltipWrapper text="Rearrange Widgets">
                    <PencilFill
                        className={`transition duration-100 ${reorderMode && 'text-theme-highlight'}`}
                        size={25}
                        onClick={() => setReorderMode((old) => !old)}
                    />
                </TooltipWrapper>
            </div>
            <div className="relative p-6 mt-4 w-full rounded-lg border-2 h-content-section-reduced border-theme-accent">
                <ScrollableContainer height={51}>
                    <div className="flex flex-col space-y-4">
                        {reminderKeyArr.map((key) => REMINDERS.get(key))}
                    </div>
                </ScrollableContainer>
                <div className={`absolute inset-0 z-30 transition duration-100 ${reorderMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 opacity-80 bg-theme-body" />
                    <div className="absolute inset-0">
                        <ScrollableContainer innerClassName="p-6 space-y-4" height={51}>
                            {reminderKeyArr.map((key, index) => (
                                <ReminderKeyEditCard
                                    reminderKey={key}
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

import React, { useState } from 'react';
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons';
import { checklists } from './data';
import { Navbar } from '../Components/Navbar';
import { useSessionStorage } from '../../Common/hooks';

export const CheckLists: React.FC = () => {
    const initialiseChecks = (() => {
        const checks = {};
        for (let i = 0; i < checklists.length; i++) {
            checks[i] = {};
        }
        return checks;
    })();

    const [currentCheckList, setCurrentCheckList] = useState(0);
    const [checks, setChecks] = useSessionStorage('checks', initialiseChecks);

    return (
        <div>
            <h1 className="text-3xl pt-6 text-white">Check Lists</h1>
            <Navbar tabs={checklists.map(({ name }) => name)} onSelected={(index) => setCurrentCheckList(index)} />
            <div className="mt-6 text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 text-lg font-mono font-thin w-1/2">
                {
                    checklists[currentCheckList].items.map((item, index) => {
                        switch (item.type) {
                        case 'step':
                            return (
                                <CheckListItem
                                    {...item}
                                    key={item}
                                    isChecked={checks[currentCheckList][index]}
                                    onChecked={() => {
                                        const newMarks = { ...checks };
                                        newMarks[currentCheckList][index] = !newMarks[currentCheckList][index];
                                        setChecks(newMarks);
                                    }}
                                />
                            );

                        case 'note':
                            return (<CheckListNote key={item} {...item} />);

                        case 'the-line':
                            return (<CheckListTheLine key={item} />);

                        default: return false;
                        }
                    })
                }
            </div>
        </div>
    );
};

const CheckMark: React.FC<{isChecked: boolean}> = ({ isChecked }) => {
    if (isChecked) {
        return (<IconCircleCheck className="ml-2" size={32} color="#00b341" stroke={1} strokeLinejoin="miter" />);
    }
    return (<IconCircleDashed className="ml-2" size={32} color="white" stroke={1} strokeLinejoin="miter" />);
};

type CheckListItemProps = {
    description: string
    expectedResult: string
    isChecked: boolean
    detailNotes: Array<string>
    onChecked: () => void
}

const CheckListItem: React.FC<CheckListItemProps> = ({ description, detailNotes = [], expectedResult, isChecked, onChecked }) => (
    <div className="py-3">
        <div className="flex justify-between items-start" onClick={onChecked}>
            <div className="flex-none">
                {description}
            </div>
            <div className="flex-1 overflow-clip overflow-hidden">
                {'.'.repeat(320)}
            </div>
            <div className="flex flex-none items-top">
                <div>
                    {expectedResult}
                </div>
                <div>
                    <CheckMark isChecked={isChecked} />
                </div>
            </div>
        </div>
        {detailNotes.length > 0 && (
            <ul className="list-dash">
                {detailNotes.map((detailNote) => (
                    <li key={detailNote}>
                        {`- ${detailNote}`}
                    </li>
                ))}
            </ul>
        )}
    </div>
);

const CheckListNote: React.FC<{note: string}> = ({ note }) => (
    <div>
        {note}
    </div>
);

const CheckListTheLine: React.FC = () => (
    <div className="h-1 bg-white my-2" />
);

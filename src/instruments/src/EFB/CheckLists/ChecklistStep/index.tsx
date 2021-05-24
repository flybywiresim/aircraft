import React from 'react';
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons';

export type ChecklistStepProps = {
    description: string
    expectedResult: string
    isChecked: boolean
    isDisabled: boolean
    detailNotes: Array<string>
    onChecked: () => void
}

const CheckMark: React.FC<{isChecked: boolean}> = ({ isChecked }) => {
    if (isChecked) {
        return (<IconCircleCheck className="ml-2" size={32} color="#00b341" stroke={1} strokeLinejoin="miter" />);
    }
    return (<IconCircleDashed className="ml-2" size={32} color="white" stroke={1} strokeLinejoin="miter" />);
};

const ChecklistStep: React.FC<ChecklistStepProps> = ({ description, detailNotes = [], expectedResult, isChecked, isDisabled, onChecked }) => (
    <div className="py-3">
        <div className="flex justify-between items-start" onClick={() => !isDisabled && onChecked()}>
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

export default ChecklistStep;

import React from 'react';

export type ChecklistNoteType = {
    note: string
}

const ChecklistNote: React.FC<ChecklistNoteType> = ({ note }) => (
    <div>
        {note}
    </div>
);

export default ChecklistNote;

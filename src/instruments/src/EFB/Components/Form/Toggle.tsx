import React from 'react';

export type ToggleProps = { value: boolean, onToggle: (value: boolean) => void; };

export const Toggle: React.FC<ToggleProps> = ({ value, onToggle }) => (
    <div
        onClick={() => onToggle(!value)}
        className={`w-12 h-6 px-1 ${value ? 'bg-blue-darker' : 'bg-blue-dark'} rounded-full flex flex-row items-center`}
    >
        <div
            className={`w-5 h-5 ${value ? 'bg-blue-light-contrast' : 'bg-gray-400'} rounded-full transition-colors transition-transform ${value ? 'transform translate-x-5' : ''}`}
        />
    </div>
);

import React, { FC, MouseEventHandler } from 'react';

export interface FailureButtonProps {
    name: string;
    isActive: boolean;
    isChanging: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
    className: string;
    highlightedTerm?: string;
}

export const FailureButton: FC<FailureButtonProps> = ({ name, isActive, isChanging, onClick, className, highlightedTerm }: FailureButtonProps) => {
    let color = 'border-0';
    if (!isChanging) {
        color = isActive ? 'border-utility-red' : 'border-utility-green';
    }

    return (
        <button
            onClick={onClick}
            type="button"
            disabled={isChanging}
            className={`flex rounded-md border-t-4 bg-theme-accent px-2 pt-3 pb-2 text-left ${color} ${className}`}
        >
            {highlightedTerm ? (
                <h2>
                    {name.substring(0, name.indexOf(highlightedTerm))}
                    <span className="text-2xl underline">{highlightedTerm}</span>
                    {name.substring(name.indexOf(highlightedTerm) + highlightedTerm.length)}
                </h2>
            ) : (
                <h2>{name}</h2>
            )}
        </button>
    );
};

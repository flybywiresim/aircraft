import React from 'react';

type OutputDisplayProps = {
    label: string,
    value: string | number,
    error?: boolean,
    reverse?: boolean
};

const OutputDisplay = (props: OutputDisplayProps) => (
    <div className="mx-2 flex-1">
        <div className="flex justify-center text-center items-center mx-6 my-2">{props.label}</div>
        <div className="flex justify-center items-center">
            <input disabled className={`w-24 px-3 py-1.5 text-lg rounded disabled text-center ${props.error ? 'error' : ''}`} value={props.value} />
        </div>
    </div>
);

export default OutputDisplay;

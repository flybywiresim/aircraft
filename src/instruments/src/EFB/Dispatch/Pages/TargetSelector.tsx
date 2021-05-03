import React from 'react';
import { ProgressBar } from '../../Components/Progress/Progress';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import { Slider } from '../../Components/Form/Slider';

interface StationSelectorProps {
    name: string;
    placeholder: string;
    max: number;
    value: string;
    completed: number;
    onChange: (value: any) => void;
}

const TargetSelector = (props: StationSelectorProps) => {
    const {
        name,
        placeholder,
        max,
        value,
        completed,
        onChange,
    } = props;
    return (
        <>
            <h3 className="font-medium">{name}</h3>
            <div className="flex mt-n5">
                <div className="fuel-progress">
                    <Slider
                        min={0}
                        max={max}
                        value={parseInt(value)}
                        onInput={onChange}
                        className="w-48"
                    />
                </div>
                <div className="station-input pad50 ml-4 mt-4">
                    <SimpleInput
                        label=""
                        noLeftMargin
                        placeholder={placeholder}
                        number
                        min={0}
                        max={max}
                        value={value}
                        onChange={onChange}
                    />
                    <div className="total-label">
                        /
                        {max}
                    </div>
                </div>
            </div>
            <span className="fuel-content-label">Current:</span>
            <div className="flex mt-n5 current-fuel-line">
                <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={completed} />
                <div className="fuel-label">
                    <label className="fuel-content-label" htmlFor="fuel-label">
                        100
                        {' '}
                        /
                        {' '}
                        {max}
                    </label>
                </div>
            </div>
        </>
    );
};

export default TargetSelector;

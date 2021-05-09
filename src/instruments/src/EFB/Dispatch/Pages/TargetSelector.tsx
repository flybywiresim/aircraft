import React from 'react';
import { ProgressBar } from '../../Components/Progress/Progress';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import { Slider } from '../../Components/Form/Slider';

interface StationSelectorProps {
    name: string;
    placeholder: string;
    max: number;
    value: number;
    current: number;
    onChange: (value: any) => void;
}

const TargetSelector = (props: StationSelectorProps) => {
    const {
        name,
        placeholder,
        max,
        value,
        current,
        onChange,
    } = props;
    return (
        <>
            <h3 className="text-xl font-medium flex items-center">{name}</h3>
            <div className="flex mt-n5 items-center content-center">
                <div className="flex fuel-progress">
                    <Slider
                        min={0}
                        max={max}
                        value={value}
                        onInput={onChange}
                        className="w-48"
                    />
                </div>
                <div className="flex station-input pad50 ml-4 mt-4 relative">
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
            <h3 className="text-sm font-medium flex items-center">Current:</h3>
            <div className="flex mt-n5 current-fuel-line">
                <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(current / max) * 100} />
                <div className="fuel-label">
                    <label className="fuel-content-label" htmlFor="fuel-label">
                        {current}
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

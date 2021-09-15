import React, { useEffect, useState } from 'react';
import { lineColors, lineSides } from '../../Lines/LineProps';
import { fieldProperties } from '../Interactive/InteractiveSplitField';
import '../../../styles.scss';

type SplitFieldProps = {
    side: lineSides,
    slashColor: lineColors
    properties: fieldProperties
}
const SplitField: React.FC<SplitFieldProps> = ({ side, slashColor, properties }) => {
    const [lVal, setLVal] = useState(properties.lValue);
    const [rVal, setRVal] = useState(properties.rValue);

    useEffect(() => {
        setLVal(properties.lValue);
        setRVal(properties.rValue);
    }, [properties.lValue, properties.rValue]);
    return (
        <p className={`line ${side}`}>
            <span className={`${properties.lColour} ${properties.lSide} ${properties.lSize}`}>{lVal ?? properties.lNullValue}</span>
            <span className={`${slashColor}`}>/</span>
            <span className={`${properties.rColour} ${properties.rSide} ${properties.rSize}`}>{rVal ?? properties.rNullValue}</span>
        </p>
    );
};

export default SplitField;

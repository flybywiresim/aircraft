import React, { useEffect, useState } from 'react';
import { lineColors, lineSides } from '../../Lines/LineProps';
import { fieldProperties } from '../Interactive/InteractiveSplitField';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LineSelectField } from '../Interactive/LineSelectField';
import '../../../styles.scss';

type SplitFieldProps = {
    /** which side to align this field */
    side: lineSides,
    /** The color of the slash in the split */
    slashColor: lineColors
    /** The properties making up the details of each split */
    properties: fieldProperties
}

/** A non-interactive split field, similiar to LineSelectField
 * @see {@link LineSelectField}
 */
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

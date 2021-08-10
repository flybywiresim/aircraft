import React from 'react';
import { lineColors, lineSides } from '../../../Lines/LineProps';
import { fieldProperties } from '../../Interactive/InteractiveSplitField';
import '../../../styles.scss';

type SplitFieldProps = {
    side: lineSides,
    slashColor: lineColors
    properties: fieldProperties
}
const SplitField: React.FC<SplitFieldProps> = ({ side, slashColor, properties }) => (
    <p className={`line ${side}`}>
        <span className={`${properties.lColour} ${properties.lSide} ${properties.lSize}`}>{properties.lValue}</span>
        <span className={`${slashColor}`}>/</span>
        <span className={`${properties.rColour} ${properties.rSide} ${properties.rSize}`}>{properties.rValue}</span>
    </p>
);

export default SplitField;

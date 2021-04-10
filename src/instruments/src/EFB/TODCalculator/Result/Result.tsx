import React from 'react';
import { connect } from 'react-redux';
import { round, isNil, toNumber, last } from 'lodash';
import { TOD_CALCULATOR_REDUCER } from '../../Store';
import { setTodData } from '../../Store/action-creator/tod-calculator';
import TODCalculator from '../../Service/TODCalculator';
import Card from '../../Components/Card/Card';
import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType.enum';

const Result = ({ currentAltitude, targetAltitude, calculation, groundSpeed, ...props }) => {
    const todCalculator = new TODCalculator(toNumber(currentAltitude), toNumber(targetAltitude), groundSpeed);
    const currentGroundSpeed = last(groundSpeed).groundSpeed;

    if (isNil(calculation.type)) {
        return null;
    }

    const results = ({
        [TOD_CALCULATION_TYPE.DISTANCE]: [
            {
                headerText: 'Desired vertical speed',
                footerText: '',
                unit: 'ft/min',
                calculate: () => round(todCalculator.calculateVS(calculation.input)),
            },
            {
                headerText: 'Desired descend angle',
                footerText: '',
                unit: 'degrees',
                calculate: () => -round(todCalculator.calculateDegree(calculation.input), 1),
            },
        ],
        [TOD_CALCULATION_TYPE.VERTICAL_SPEED]: [
            {
                headerText: 'Start your descent about',
                footerText: 'before target',
                unit: 'NM',
                calculate: () => round(todCalculator.calculateDistance(Math.abs(calculation.input), 'FTM')),
            },
        ],
        [TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE]: [
            {
                headerText: 'Start your descent about',
                footerText: 'before target',
                unit: 'NM',
                calculate: () => round(todCalculator.calculateDistance(Math.abs(calculation.input), 'DEGREE')),
            },
        ],
    }[calculation.type]);

    const inputDataValid = targetAltitude !== '' && currentAltitude !== '' && (targetAltitude < currentAltitude) && targetAltitude >= 0 && calculation.input !== '' && currentGroundSpeed > 0;

    const calculationValid = (value) => !Number.isNaN(value) && Number.isFinite(value);

    const calculations = results.map(({ calculate }) => calculate());
    const validCalculations = calculations.filter((value) => calculationValid(value));

    if (inputDataValid && validCalculations.length > 0) {
        return (
            <Card title="Result" childrenContainerClassName="flex-1 flex flex-col justify-center px-0" {...props}>
                {results.map(({ headerText, footerText, calculate, unit }) => {
                    const calculation = calculate();

                    if (calculationValid(calculation)) {
                        return (
                            <div className="flex flex-col items-center justify-center mb-10 last:mb-0">
                                <h1 className="text-white font-medium mb-4 text-2xl">{headerText}</h1>

                                <span className="text-white text-6xl whitespace-nowrap">
                                    {calculation}
                                    {' '}
                                    {unit}
                                </span>

                                {!!footerText && <span className="text-white font-medium mt-4 text-2xl">{footerText}</span>}
                            </div>
                        );
                    }

                    return <></>;
                })}
            </Card>
        );
    }

    return null;
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { currentAltitude, targetAltitude, calculation, groundSpeed } }) => ({ currentAltitude, targetAltitude, calculation, groundSpeed }),
    { setTodData },
)(Result);

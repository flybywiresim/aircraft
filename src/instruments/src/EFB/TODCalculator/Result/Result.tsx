import React from 'react';
import { round, isNil, toNumber, last } from 'lodash';
import TODCalculator from '../../Service/TODCalculator';
import Card from '../../UtilComponents/Card/Card';
import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType';
import { useAppSelector } from '../../Store/store';

const Result = ({ className }: {className: string}) => {
    const calculationInput = useAppSelector((state) => state.todCalculator.calculation.input) ?? 0;
    const calculationType = useAppSelector((state) => state.todCalculator.calculation.type) ?? TOD_CALCULATION_TYPE.DISTANCE;
    const targetAltitude = useAppSelector((state) => state.todCalculator.targetAltitude) ?? 0;
    const groundSpeed = useAppSelector((state) => state.todCalculator.groundSpeed) ?? 0;
    const currentAltitude = useAppSelector((state) => state.todCalculator.currentAltitude) ?? 0;

    const todCalculator = new TODCalculator(toNumber(currentAltitude), toNumber(targetAltitude), groundSpeed);
    const currentGroundSpeed = last(groundSpeed).groundSpeed;

    if (isNil(calculationType)) {
        return null;
    }

    const results = ({
        [TOD_CALCULATION_TYPE.DISTANCE]: [
            {
                headerText: 'Desired vertical speed',
                footerText: '',
                unit: 'ft/min',
                calculate: () => round(todCalculator.calculateVS(calculationInput)),
            },
            {
                headerText: 'Desired descend angle',
                footerText: '',
                unit: 'degrees',
                calculate: () => -round(todCalculator.calculateDegree(calculationInput), 1),
            },
        ],
        [TOD_CALCULATION_TYPE.VERTICAL_SPEED]: [
            {
                headerText: 'Start your descent about',
                footerText: 'before target',
                unit: 'NM',
                calculate: () => round(todCalculator.calculateDistance(Math.abs(calculationInput), 'FTM')),
            },
        ],
        [TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE]: [
            {
                headerText: 'Start your descent about',
                footerText: 'before target',
                unit: 'NM',
                calculate: () => round(todCalculator.calculateDistance(Math.abs(calculationInput), 'DEGREE')),
            },
        ],
    }[calculationType]);

    const inputDataValid = targetAltitude !== '' && currentAltitude !== '' && (targetAltitude < currentAltitude) && targetAltitude >= 0 && calculationInput !== '' && currentGroundSpeed > 0;

    const calculationValid = (value) => !Number.isNaN(value) && Number.isFinite(value);

    const calculations = results.map(({ calculate }) => calculate());
    const validCalculations = calculations.filter((value) => calculationValid(value));

    if (inputDataValid && validCalculations.length > 0) {
        return (
            <Card title="Result" childrenContainerClassName="flex-1 flex flex-col justify-center px-0" className={className}>
                {results.map(({ headerText, footerText, calculate, unit }) => {
                    const calculation = calculate();

                    if (calculationValid(calculation)) {
                        return (
                            <div className="flex flex-col justify-center items-center mb-10 last:mb-0">
                                <h1 className="mb-4 text-2xl font-medium ">{headerText}</h1>

                                <span className="text-6xl whitespace-nowrap">
                                    {calculation}
                                    {' '}
                                    {unit}
                                </span>

                                {!!footerText && <span className="mt-4 text-2xl font-medium ">{footerText}</span>}
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

export default Result;

/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

import '../../Assets/Performance.scss';

export type DistanceLabel = {
    distance: number,
    label: string,
    type: LabelType
}

export enum LabelType {
    Main,
    Asda,
    Toda
}

type RunwayVisualizationProps = {
    mainLength?: number,
    asda?: number,
    toda?: number,
    labels?: DistanceLabel[],
    runwayNumber?: number,
    stopMargin?: number
};

const RunwayVisualizationWidget = (props: RunwayVisualizationProps) => {
    function maxDist(): number {
        const distances = props.labels?.map((label) => label.distance) ?? [];

        return Math.max(props.mainLength ?? 0, props.asda ?? 0, props.toda ?? 0, ...distances);
    }

    function getStopMarginLabelHeightPercentage(): number {
        if (!props.stopMargin) return 0;

        return (Math.abs(props.stopMargin) / maxDist()) * 100;
    }

    function getLabelBottomPercentage(label: DistanceLabel): number {
        return (label.distance / maxDist()) * 100;
    }

    function mainHeightPercentage(): number {
        const mainLength = props.mainLength ?? 0;
        const maximumDist = maxDist();

        if (mainLength === 0 || maximumDist === 0) {
            return 100;
        }
        const percentage = (mainLength / maxDist()) * 100;

        return Math.max(percentage, 20);
    }

    function asdaHeightPercentage(): number {
        const asda = props.asda ?? 0;
        const mainLength = props.mainLength ?? 0;

        return Math.max(((asda - mainLength) / maxDist()) * 100, 0);
    }

    function todaHeightPercentage(): number {
        const toda = props.toda ?? 0;
        const asda = props.asda ?? 0;

        return Math.max(((toda - asda) / maxDist()) * 100, 0);
    }

    function isLabelOverDistance(label: DistanceLabel): boolean {
        switch (label.type) {
        case LabelType.Asda:
            return label.distance > (props.asda ?? 0);
        case LabelType.Toda:
            return label.distance > (props.toda ?? 0);
        default:
            return label.distance > (props.mainLength ?? 0);
        }
    }

    function runwayLengthLabel(): JSX.Element {
        return (
            <div className=" absolute top-1/2 -right-3 transform -rotate-90 translate-x-1/2">
                { props.mainLength ?? 0 }
                m
            </div>
        );
    }

    function stopMarginLabel(): JSX.Element | undefined {
        if (props.stopMargin) {
            return (
                <div
                    className={`text-center ml-1 pl-2 flex flex-col justify-center relative ${props.stopMargin > 0 ? 'text-green-500' : 'text-red-500'}`}
                    style={{
                        height: `${getStopMarginLabelHeightPercentage()}%`,
                        top: `${100 - (mainHeightPercentage() + asdaHeightPercentage())}%`,
                        transform: `translateY(${props.stopMargin < 0 ? '-100%' : '0'})`,
                    }}
                >
                    <div>
                        Stop Margin
                    </div>
                    <div>
                        { Math.round(props.stopMargin)}
                        m
                    </div>
                    <div className={`border-l-4 h-full absolute top-0 left-0 ${props.stopMargin > 0 ? 'border-green-500' : 'border-red-500'}`} />
                </div>
            );
        }
        return undefined;
    }

    function runwayNumber(): JSX.Element | undefined {
        if (props.runwayNumber) {
            const paddedNumber = props.runwayNumber.toString().padStart(2, '0');
            return (
                <div className="absolute bottom-20 left-1/2 text-4xl opacity-40 transform -translate-x-1/2 runway-id">{paddedNumber}</div>
            );
        }
        return undefined;
    }

    function labels(): JSX.Element[] {
        const elements: JSX.Element[] = [];

        for (const label of props.labels ?? []) {
            const bottomPercentage = getLabelBottomPercentage(label);

            const closestLabel = (props.labels ?? []).reduce((a, b) => {
                if (a.label === label.label) return b;
                if (b.label === label.label) return a;

                return Math.abs(getLabelBottomPercentage(b) - bottomPercentage) < Math.abs(getLabelBottomPercentage(a) - bottomPercentage) ? b : a;
            });

            const showText = (Math.abs(getLabelBottomPercentage(closestLabel) - bottomPercentage) > 5);

            elements.push(
                (
                    <div
                        className={`w-32 h-1 bg-white  absolute left-1/2 transform -translate-x-1/2 ${
                            (isLabelOverDistance(label)) ? 'error-label' : ''}`}
                        style={{ bottom: `${bottomPercentage}%` }}
                    >

                        {showText && (
                            <div className="absolute -top-0.5 w-full text-center transform -translate-y-full">
                                {label.label}
                                {' '}
                                { Math.round(label.distance) }
                                m
                            </div>
                        )}

                    </div>),
            );
        }

        return elements;
    }

    return (
        <div className="flex px-10 h-full">
            <div className="flex relative flex-col h-full">
                <div className="flex-grow bg-red-900 opacity-30" />
                <div className="bg-green-200 opacity-50" style={{ height: `${todaHeightPercentage()}%` }} />
                <div className="bg-gray-700 opacity-50" style={{ height: `${asdaHeightPercentage()}%` }} />
                <div
                    className="relative w-40 bg-black"
                    style={{ height: `${mainHeightPercentage()}%` }}
                >
                    {runwayLengthLabel()}
                    <div className="absolute left-0 w-1 h-full bg-white opacity-30" />
                    <div className="absolute right-0 w-1 h-full bg-white opacity-30" />
                    <div className="flex absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-5 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                        <div className="w-2 h-14 bg-white opacity-30" />
                    </div>
                    <div className="overflow-hidden relative h-full">
                        <div className="absolute bottom-40 left-1/2 w-1.5 h-20 bg-white opacity-30 transform -translate-x-1/2" />
                        <div className="absolute bottom-72 left-1/2 w-1.5 h-20 bg-white opacity-30 transform -translate-x-1/2" />
                    </div>
                    {runwayNumber()}
                </div>
                {labels()}
            </div>
            {stopMarginLabel()}
        </div>
    );
};

export default RunwayVisualizationWidget;

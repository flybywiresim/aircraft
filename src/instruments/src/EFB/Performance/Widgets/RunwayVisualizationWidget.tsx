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

import { Units } from '@shared/units';
import React, { useEffect, useState } from 'react';

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

interface RunwayVisualizationProps {
    mainLength?: number;
    asda?: number;
    toda?: number;
    labels?: DistanceLabel[];
    runwayHeading?: number;
    distanceUnit: 'ft' | 'm';
}

const RunwayVisualizationWidget = ({ asda = 0, labels = [], mainLength = 0, runwayHeading, toda = 0, distanceUnit }: RunwayVisualizationProps) => {
    const maxDist = () => {
        const distances = labels.map((label) => label.distance);

        return Math.max(mainLength ?? 0, asda ?? 0, toda ?? 0, ...distances);
    };

    const getLabelBottomPercentage = (label: DistanceLabel): number => (label.distance / maxDist()) * 100;

    const mainHeightPercentage = (): number => {
        const maximumDist = maxDist();

        if (mainLength === 0 || maximumDist === 0) {
            return 100;
        }

        const percentage = (mainLength / maxDist()) * 100;

        return Math.max(percentage, 20);
    };

    const asdaHeightPercentage = (): number => Math.max(((asda - mainLength) / maxDist()) * 100, 0);

    const todaHeightPercentage = (): number => Math.max(((toda - asda) / maxDist()) * 100, 0);

    const isLabelOverDistance = (label: DistanceLabel): boolean => {
        switch (label.type) {
        case LabelType.Asda:
            return label.distance > (asda);
        case LabelType.Toda:
            return label.distance > (toda);
        default:
            return label.distance > (mainLength);
        }
    };

    const [labelComponents, setLabelComponents] = useState<JSX.Element>();

    useEffect(() => setLabelComponents(() => {
        const elements = labels.map((label) => {
            const bottomPercentage = getLabelBottomPercentage(label);

            const closestLabel = (labels).reduce((a, b) => {
                if (a.label === label.label) return b;
                if (b.label === label.label) return a;

                return Math.abs(getLabelBottomPercentage(b) - bottomPercentage) < Math.abs(getLabelBottomPercentage(a) - bottomPercentage) ? b : a;
            });

            const showText = Math.abs(getLabelBottomPercentage(closestLabel) - bottomPercentage) > 5;

            return (
                <div
                    className={`w-32 h-1 absolute left-1/2 transform -translate-x-1/2 bg-current ${isLabelOverDistance(label) ? 'text-red-500' : 'text-theme-highlight'}`}
                    style={{ bottom: `${bottomPercentage}%` }}
                >
                    {showText && (
                        <p className="absolute -top-0.5 w-full font-bold text-center text-current transform -translate-y-full">
                            {label.label}
                            {' '}
                            { Math.round(distanceUnit === 'ft' ? Units.metreToFoot(label.distance) : label.distance) }
                            m
                        </p>
                    )}
                </div>
            );
        });
        console.log(elements);

        return <>{elements}</>;
    }), [labels]);

    const runwayBoundMarkers = (
        <div className="flex flex-row space-x-1.5">
            <div className="w-1.5 h-12 bg-white " />
            <div className="w-1.5 h-12 bg-white " />
            <div className="w-1.5 h-12 bg-white " />
            <div className="w-1.5 h-12 bg-white " />
            <div className="w-1.5 h-12 bg-white " />
            <div className="w-1.5 h-12 bg-white " />
        </div>
    );

    const runwayNumber = (
        <div className="mx-auto w-min text-4xl font-bold">
            {runwayHeading !== undefined ? Math.round((runwayHeading ?? 0) / 10).toString().padStart(2, '0') : '??'}
        </div>
    );

    return (
        <div className="flex h-full">
            <div className="flex relative flex-col h-full">
                <div className="flex-grow bg-red-900 " />
                <div className="bg-green-200 opacity-50" style={{ height: `${todaHeightPercentage()}%` }} />
                <div className="bg-gray-700 opacity-50" style={{ height: `${asdaHeightPercentage()}%` }} />
                <div
                    className="relative w-44 bg-black"
                    style={{ height: `${mainHeightPercentage()}%` }}
                >
                    <div className="flex overflow-hidden absolute inset-0 flex-col justify-between py-3 px-2.5 h-full border-4 border-white">
                        <div>
                            <div className="flex flex-row justify-between">
                                {runwayBoundMarkers}
                                {runwayBoundMarkers}
                            </div>
                            <div className="transform rotate-180">
                                {runwayNumber}
                            </div>
                        </div>

                        <div className="flex flex-col items-center py-3 px-2.5 space-y-4 h-full">
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                            <div className="w-1 h-full bg-white" />
                        </div>

                        <div>
                            {runwayNumber}
                            <div className="flex flex-row justify-between">
                                {runwayBoundMarkers}
                                {runwayBoundMarkers}
                            </div>
                        </div>
                    </div>
                </div>
                {labelComponents}
            </div>
        </div>
    );
};

export default RunwayVisualizationWidget;

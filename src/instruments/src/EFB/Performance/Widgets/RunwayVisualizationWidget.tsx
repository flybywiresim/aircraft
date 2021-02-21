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
type RunwayVisualizationState = {};

export default class RunwayVisualizationWidget extends React.Component<RunwayVisualizationProps, RunwayVisualizationState> {
    private getStopMarginLabelHeightPercentage(): number {
        if (!this.props.stopMargin) return 0;

        return (Math.abs(this.props.stopMargin) / this.maxDist()) * 100;
    }

    private getLabelBottomPercentage(label: DistanceLabel): number {
        return (label.distance / this.maxDist()) * 100;
    }

    private mainHeightPercentage(): number {
        const mainLength = this.props.mainLength ?? 0;
        const maxDist = this.maxDist();

        if (mainLength === 0 || maxDist === 0) {
            return 100;
        }
        const percentage = (mainLength / this.maxDist()) * 100;

        return Math.max(percentage, 20);
    }

    private asdaHeightPercentage(): number {
        const asda = this.props.asda ?? 0;
        const mainLength = this.props.mainLength ?? 0;

        return Math.max(((asda - mainLength) / this.maxDist()) * 100, 0);
    }

    private todaHeightPercentage(): number {
        const toda = this.props.toda ?? 0;
        const asda = this.props.asda ?? 0;

        return Math.max(((toda - asda) / this.maxDist()) * 100, 0);
    }

    private maxDist(): number {
        const distances = this.props.labels?.map((label) => label.distance) ?? [];

        return Math.max(this.props.mainLength ?? 0, this.props.asda ?? 0, this.props.toda ?? 0, ...distances);
    }

    private isLabelOverDistance(label: DistanceLabel): boolean {
        switch (label.type) {
        case LabelType.Asda:
            return label.distance > (this.props.asda ?? 0);
        case LabelType.Toda:
            return label.distance > (this.props.toda ?? 0);
        default:
            return label.distance > (this.props.mainLength ?? 0);
        }
    }

    private runwayLengthLabel(): JSX.Element {
        return (
            <div className="text-white absolute top-1/2 -right-3 transform -rotate-90 translate-x-1/2">
                { this.props.mainLength ?? 0 }
                m
            </div>
        );
    }

    private stopMarginLabel(): JSX.Element | undefined {
        if (this.props.stopMargin) {
            return (
                <div
                    className={`text-center ml-1 pl-2 flex flex-col justify-center relative ${this.props.stopMargin > 0 ? 'text-green-500' : 'text-red-500'}`}
                    style={{
                        height: `${this.getStopMarginLabelHeightPercentage()}%`,
                        top: `${100 - (this.mainHeightPercentage() + this.asdaHeightPercentage())}%`,
                        transform: `translateY(${this.props.stopMargin < 0 ? '-100%' : '0'})`,
                    }}
                >
                    <div>
                        Stop Margin
                    </div>
                    <div>
                        { Math.round(this.props.stopMargin)}
                        m
                    </div>
                    <div className={`border-l-4 h-full absolute top-0 left-0 ${this.props.stopMargin > 0 ? 'border-green-500' : 'border-red-500'}`} />
                </div>
            );
        }
        return undefined;
    }

    private runwayNumber(): JSX.Element | undefined {
        if (this.props.runwayNumber) {
            const paddedNumber = this.props.runwayNumber.toString().padStart(2, '0');
            return (
                <div className="runway-id text-white text-4xl absolute left-1/2 bottom-20 transform -translate-x-1/2 opacity-40">{paddedNumber}</div>
            );
        }
        return undefined;
    }

    private labels(): JSX.Element[] {
        const elements: JSX.Element[] = [];

        for (const label of this.props.labels ?? []) {
            const bottomPercentage = this.getLabelBottomPercentage(label);

            const closestLabel = (this.props.labels ?? []).reduce((a, b) => {
                if (a.label === label.label) return b;
                if (b.label === label.label) return a;

                return Math.abs(this.getLabelBottomPercentage(b) - bottomPercentage) < Math.abs(this.getLabelBottomPercentage(a) - bottomPercentage) ? b : a;
            });

            const showText = (Math.abs(this.getLabelBottomPercentage(closestLabel) - bottomPercentage) > 5);

            elements.push(
                (
                    <div
                        className={`w-32 h-1 bg-white text-white absolute left-1/2 transform -translate-x-1/2 ${
                            (this.isLabelOverDistance(label)) ? 'error-label' : ''}`}
                        style={{ bottom: `${bottomPercentage}%` }}
                    >

                        {showText && (
                            <div className="w-full text-center absolute -top-0.5 transform -translate-y-full">
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

    public render() {
        return (
            <div className="h-full flex px-10">
                <div className="h-full flex flex-col relative">
                    <div className="flex-grow bg-red-900 opacity-30" />
                    <div className="bg-green-200 opacity-50" style={{ height: `${this.todaHeightPercentage()}%` }} />
                    <div className="bg-gray-700 opacity-50" style={{ height: `${this.asdaHeightPercentage()}%` }} />
                    <div
                        className="runway w-40 relative"
                        style={{ height: `${this.mainHeightPercentage()}%` }}
                    >
                        {this.runwayLengthLabel()}
                        <div className="w-1 h-full bg-white opacity-30 absolute left-0" />
                        <div className="w-1 h-full bg-white opacity-30 absolute right-0" />
                        <div className="flex absolute left-1/2 bottom-2 transform -translate-x-1/2">
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-5 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="mr-2 w-2 h-14 bg-white opacity-30" />
                            <div className="w-2 h-14 bg-white opacity-30" />
                        </div>
                        <div className="relative h-full overflow-hidden">
                            <div className="w-1.5 h-20 bg-white opacity-10 absolute left-1/2 bottom-40 transform -translate-x-1/2" />
                            <div className="w-1.5 h-20 bg-white opacity-10 absolute left-1/2 bottom-72 transform -translate-x-1/2" />
                        </div>
                        {this.runwayNumber()}
                    </div>
                    {this.labels()}
                </div>
                {this.stopMarginLabel()}
            </div>
        );
    }
}

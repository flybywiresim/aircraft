import React, { memo } from 'react';
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { useSimVar } from '@instruments/common/simVars';
import { HorizontalTape, getSmallestAngle } from './PFDUtils';
import { getSimVar } from '../util.js';

const DisplayRange = 24;
const DistanceSpacing = 7.555;
const ValueSpacing = 5;

const GraduationElement = (heading: number, offset: number) => {
    let text = '';
    let classText = '';
    let tickLength = 3.8302;
    let textYPos: number | undefined;

    const roundedHeading = Math.round(heading);
    if (roundedHeading % 10 === 0) {
        if (roundedHeading % 30 === 0) {
            classText = 'FontMedium';
            textYPos = 154.64206;
        } else {
            classText = 'FontSmallest';
            textYPos = 154.27985;
        }
        let textVal = Math.round(heading / 10) % 36;
        if (textVal < 0) {
            textVal += 36;
        }
        text = textVal.toString();
    } else {
        tickLength *= 0.42;
    }

    return (
        <g id="HeadingTick" transform={`translate(${offset} 0)`}>
            <path className="NormalStroke White" d={`m68.913 145.34v${tickLength}`} />
            <text id="HeadingLabel" className={`White MiddleAlign ${classText}`} x="68.879425" y={textYPos}>{text}</text>
        </g>
    );
};

interface HeadingTapeProps {
    heading: Arinc429Word;
}

export const HeadingTape = memo(({ heading }: HeadingTapeProps) => {
    if (!heading.isNormalOperation()) {
        return null;
    }

    const fixedHeading = Number(heading.value.toFixed(2));

    return (
        <g>
            <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" className="TapeBackground" />

            <HorizontalTape
                heading={fixedHeading}
                graduationElementFunction={GraduationElement}
                displayRange={DisplayRange + 3}
                valueSpacing={ValueSpacing}
                distanceSpacing={DistanceSpacing}
            />
        </g>
    );
});

interface HeadingOfftapeProps {
    selectedHeading: number;
    inertialReferenceSource: number;
}

export const HeadingOfftape = memo(({ selectedHeading, inertialReferenceSource }: HeadingOfftapeProps) => {
    const heading = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_HEADING`);
    const [ILSCourse] = useSimVar('NAV LOCALIZER:3', 'degrees', 100);
    const groundTrack = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_TRACK`);

    const fixedHeading = Number(heading.value.toFixed(2));
    const fixedGroundTrack = Number(groundTrack.value.toFixed(2));

    if (!heading.isNormalOperation()) {
        return (
            <>
                <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" className="TapeBackground" />
                <path id="HeadingTapeOutline" className="NormalStroke Red" d="m32.138 156.23v-10.886h73.536v10.886" />
                <text id="HDGFailText" className="Blink9Seconds FontLargest EndAlign Red" x="75.926208" y="151.95506">HDG</text>
            </>
        );
    }

    return (
        <g id="HeadingOfftapeGroup">
            <path id="HeadingTapeOutline" className="NormalStroke White" d="m32.138 156.23v-10.886h73.536v10.886" />
            <SelectedHeading selectedHeading={selectedHeading} heading={fixedHeading} />
            <QFUIndicator heading={fixedHeading} ILSCourse={ILSCourse} />
            <path className="Fill Yellow" d="m69.61 147.31h-1.5119v-8.0635h1.5119z" />
            { groundTrack.isNormalOperation() ? <GroundTrackBug groundTrack={fixedGroundTrack} heading={fixedHeading} /> : null }
        </g>
    );
});

interface SelectedHeadingProps {
    selectedHeading: number;
    heading: number;
}

const SelectedHeading = memo(({ selectedHeading, heading }: SelectedHeadingProps) => {
    console.log(`Root -> HeadingOfftape -> SelectedHeading: render (${selectedHeading}, ${heading})`);

    if (Number.isNaN(selectedHeading)) {
        return null;
    }

    const headingDelta = getSmallestAngle(selectedHeading, heading);
    const text = Math.round(selectedHeading).toString().padStart(3, '0');

    if (Math.abs(headingDelta) < DisplayRange) {
        const offset = headingDelta * DistanceSpacing / ValueSpacing;

        return (
            <path id="HeadingTargetIndicator" className="NormalStroke Cyan CornerRound" transform={`translate(${offset} 0)`} d="m69.978 145.1 1.9501-5.3609h-6.0441l1.9501 5.3609" />
        );
    } if (headingDelta > 0) {
        return (
            <text id="SelectedHeadingTextRight" className="FontSmallest MiddleAlign Cyan" x="101.56478" y="144.44759">{text}</text>
        );
    }
    return (
        <text id="SelectedHeadingTextLeft" className="FontSmallest MiddleAlign Cyan" x="36.20676" y="144.44794">{text}</text>
    );
});

interface GroundTrackBugProps {
    groundTrack: number;
    heading: number;
}

const GroundTrackBug = memo(({ groundTrack, heading }: GroundTrackBugProps) => {
    console.log(`Root -> HeadingOfftape -> GroundTrackBug: render (${groundTrack}, ${heading})`);

    const offset = getSmallestAngle(groundTrack, heading) * DistanceSpacing / ValueSpacing;

    return (
        <g id="ActualTrackIndicator" transform={`translate(${offset} 0)`}>
            <path className="ThickOutline CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
            <path className="ThickStroke Green CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
        </g>
    );
});

interface QFUIndicatorProps {
    ILSCourse: number;
    heading: number;
}

const QFUIndicator = memo(({ ILSCourse, heading }: QFUIndicatorProps) => {
    console.log('Root -> HeadingOfftape -> QFUIndicator: render');

    if (Number.isNaN(ILSCourse) || !getSimVar('NAV HAS LOCALIZER:3', 'Bool')) {
        return null;
    }

    const delta = getSmallestAngle(ILSCourse, heading);
    const text = Math.round(ILSCourse).toString().padStart(3, '0');
    if (Math.abs(delta) > DisplayRange) {
        if (delta > 0) {
            return (
                <g id="ILSCourseRight">
                    <path className="BlackFill NormalStroke White" d="m100.57 149.68h12.088v6.5516h-12.088z" />
                    <text id="ILSCourseTextRight" className="FontMedium MiddleAlign Magenta" x="106.58398" y="155.12291">{text}</text>
                </g>
            );
        }
        return (
            <g id="ILSCourseLeft">
                <path className="BlackFill NormalStroke White" d="m26.094 156.18v-6.5516h12.088v6.5516z" />
                <text id="ILSCourseTextLeft" className="FontMedium MiddleAlign Magenta" x="32.06773" y="155.12303">{text}</text>
            </g>
        );
    }

    const offset = getSmallestAngle(ILSCourse, heading) * DistanceSpacing / ValueSpacing;
    return (
        <g id="ILSCoursePointer" transform={`translate(${offset} 0)`}>
            <path className="ThickOutline" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
            <path className="ThickStroke Magenta" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
        </g>
    );
});

import { HorizontalTape, getSmallestAngle } from './PFDUtils.jsx';
import { getSimVar } from '../util.mjs';

const DistanceSpacing = 7.555;
const ValueSpacing = 5;

const GraduationElement = (heading, offset) => {
    let text = '';
    let classText = '';
    let tickLength = 3.8302;

    const roundedHeading = Math.round(heading);
    if (roundedHeading % 10 === 0) {
        if (roundedHeading % 30 === 0) {
            classText = 'FontMedium';
        } else {
            classText = 'FontSmallest';
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
            <text id="HeadingLabel" className={`White MiddleAlign ${classText}`} x="68.879425" y="154.64206">{text}</text>
        </g>
    );
};

const GroundTrackBug = (offset) => (
    <path id="ActualTrackIndicator" className="NormalStroke Green" transform={`translate(${offset} 0)`} d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
);

const QFUBug = (offset) => (
    <path id="ILSCoursePointer" className="NormalStroke Magenta" transform={`translate(${offset} 0)`} d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
);

export const HeadingTape = ({
    heading, groundTrack, ILSCourse,
}) => {
    if (getSimVar('L:A320_Neo_ADIRS_STATE', 'Enum') !== 2) {
        return null;
    }

    const bugs = [];

    if (!Number.isNaN(ILSCourse)) {
        bugs.push([QFUBug, ILSCourse]);
    }

    bugs.push([GroundTrackBug, groundTrack]);

    return (
        <g>
            <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" className="TapeBackground" />
            <HorizontalTape heading={heading} graduationElementFunction={GraduationElement} bugs={bugs} displayRange={27} valueSpacing={ValueSpacing} distanceSpacing={DistanceSpacing} />
        </g>
    );
};

export const HeadingOfftape = ({ selectedHeading, heading, ILSCourse }) => {
    if (getSimVar('L:A320_Neo_ADIRS_STATE', 'Enum') !== 2) {
        return (
            [
                <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" className="TapeBackground" />,
                <path id="HeadingTapeOutline" className="NormalStroke Red" d="m32.138 156.23v-10.886h73.536v10.886" />,
                <text id="HDGFailText" className="Blink9Seconds FontLargest EndAlign Red" x="75.926208" y="151.95506">HDG</text>,
            ]
        );
    }

    return (
        <g id="HeadingOfftapeGroup">
            <path id="HeadingTapeOutline" className="NormalStroke White" d="m32.138 156.23v-10.886h73.536v10.886" />
            <SelectedHeading heading={heading} selectedHeading={selectedHeading} />
            <path className="Fill Yellow" d="m68.201 147.31v-8.0635h1.4103v8.0635z" />
            <QFUOfftape heading={heading} ILSCourse={ILSCourse} />
        </g>
    );
};

const SelectedHeading = ({ selectedHeading, heading }) => {
    if (Number.isNaN(selectedHeading)) {
        return null;
    }

    const headingDelta = getSmallestAngle(selectedHeading, heading);
    const text = Math.round(selectedHeading).toString().padStart(3, '0');
    if (Math.abs(headingDelta) < 24) {
        const offset = headingDelta * DistanceSpacing / ValueSpacing;

        return (
            <path id="HeadingTargetIndicator" className="NormalStroke Cyan" transform={`translate(${offset} 0)`} d="m69.978 145.1 1.9501-5.3609h-6.0441l1.9501 5.3609" />
        );
    } if (headingDelta > 0) {
        return (
            <text id="SelectedHeadingTextRight" className="FontSmallest MiddleAlign Cyan" x="101.56478" y="144.44759">{text}</text>
        );
    }
    return (
        <text id="SelectedHeadingTextLeft" className="FontSmallest MiddleAlign Cyan" x="36.20676" y="144.44794">{text}</text>
    );
};

const QFUOfftape = ({ ILSCourse, heading }) => {
    const delta = getSmallestAngle(ILSCourse, heading);
    const text = Math.round(ILSCourse).toString().padStart(3, '0');
    if (Math.abs(delta) > 24) {
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
    return null;
};

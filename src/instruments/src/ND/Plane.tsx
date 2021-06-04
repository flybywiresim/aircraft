import { React } from 'react';
import { useSimVar } from '@instruments/common/simVars';

export const Plane: React.FC = () => {
    const [crossTrackError] = useSimVar('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles');

    let crossTrackText = '';
    let crossTrackAnchor = 'start';
    let crossTrackX = 390;
    const crossTrackAbs = Math.abs(crossTrackError);

    if (crossTrackAbs > 0.02) {
        crossTrackText = crossTrackAbs.toFixed(crossTrackAbs < 0.3 ? 2 : 1);
        if (crossTrackError < 0) {
            crossTrackText += 'R';
            crossTrackAnchor = "start";
            crossTrackX = 424;
        } else {
            crossTrackText += 'L';
            crossTrackAnchor = "end";
            crossTrackX = 352;
        }
    }

    return <g>
            <line id="lubber" x1={384} y1={108} x2={384} y2="148" className="Yellow" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            <image x={342} y={596} width={84} height={71} xlinkHref="/Images/ND/AIRPLANE.svg" />
            <text x={crossTrackX} y={646} textAnchor={crossTrackAnchor} fontSize={24} className="Green">{crossTrackText}</text>
    </g>;
}

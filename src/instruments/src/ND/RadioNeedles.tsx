import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { NavAidMode } from './RadioNavInfo';

type RadioNavPointerProps = { index: 1 | 2, side: 'L' | 'R' };

export const RadioNeedle: React.FC<RadioNavPointerProps> = ({ index, side }) => {
    const [mode] = useSimVar(`L:A32NX_EFIS_${side}_NAVAID_${index}_MODE`, 'enum');
    const [relativeBearing] = mode === NavAidMode.ADF ? useSimVar(`ADF RADIAL:${index}`, 'degrees') : useSimVar(`NAV RELATIVE BEARING TO STATION:${index}`, 'degrees');
    const [available] = mode === NavAidMode.ADF ? useSimVar(`ADF SIGNAL:${index}`, "number") : useSimVar(`NAV HAS NAV:${index}`, "number");

    let paths: Array<string>;

    if (mode === NavAidMode.ADF) {
        paths = [
            'M384,251 L384,128 M370,179 L384,155 L398,179 M384,1112 L384,989 M370,1085 L384,1061 L398,1085',
            'M370,251 L370,219 L384,195 L398,219 L398,251 M384,195 L384,128 M384,1112 L384,1023 M370,989 L370,1040 L384,1023 L398,1040 L398,989'
        ];
    } else {
        paths = [
            'M384,251 L384,179 M384,128 L384,155 L370,179 L398,179 L384,155 M384,1112 L384,1085 M384,989 L384,1061 L370,1085 L398,1085 L384,1061',
            'M377,251 L377,219 L370,219 L384,195 L398,219 L391,219 L391,251 M384,195 L384,128 M384,1112 L384,1045 M377,989 L377,1045 L391,1045 L391,989'
        ];
    }

    return mode !== NavAidMode.Off && available  && (
        <g transform={`rotate(${relativeBearing} 384 620)`}>
            <path
                d={paths[index - 1]}
                strokeWidth={3.2}
                className={`${mode === NavAidMode.ADF ? 'Green' : 'White'} rounded`}
            />
        </g>
    );
};

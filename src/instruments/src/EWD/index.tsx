import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { render } from '../Common';
import UpperDisplay from './elements/UpperDisplay';
import './style.scss';

export const EWD: React.FC = () => {
    const [displayIndex] = useState(() => {
        const url = document.getElementsByTagName('a32nx-ewd')[0].getAttribute('url');
        return url ? parseInt(url.substring(url.length - 1), 10) : 0;
    });

    return (
        <DisplayUnit
            electricitySimvar="L:A32NX_ELEC_AC_2_BUS_IS_POWERED"
            potentiometerIndex={displayIndex}
        >
            <svg className="ewd-svg" version="1.1" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg">
                <line className="Separator" x1="0" y1="0" x2="20" y2="0" strokeLinecap="round" />
                <line className="Separator" x1="0" y1="0" x2="0" y2="20" strokeLinecap="round" />
                <line className="Separator" x1="0" y1="768" x2="20" y2="768" strokeLinecap="round" />
                <line className="Separator" x1="0" y1="748" x2="0" y2="768" strokeLinecap="round" />
                <line className="Separator" x1="748" y1="0" x2="768" y2="0" strokeLinecap="round" />
                <line className="Separator" x1="768" y1="0" x2="768" y2="20" strokeLinecap="round" />
                <line className="Separator" x1="768" y1="768" x2="768" y2="748" strokeLinecap="round" />
                <line className="Separator" x1="374" y1="0" x2="394" y2="0" strokeLinecap="round" />
                <line className="Separator" x1="384" y1="0" x2="384" y2="20" strokeLinecap="round" />

                <UpperDisplay />
                <line className="Separator" x1="4" y1="506" x2="442" y2="506" strokeLinecap="round" />
                <line className="Separator" x1="512" y1="506" x2="763" y2="506" strokeLinecap="round" />
                <line className="Separator" x1="480" y1="525" x2="480" y2="724" strokeLinecap="round" />
            </svg>
        </DisplayUnit>
    );
};

render(<EWD />);

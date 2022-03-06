import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { render } from '../Common';
import UpperDisplay from './elements/UpperDisplay';
import LowerLeftDisplay from './elements/LowerLeftDisplay';
import LowerRightDisplay from './elements/LowerRightDisplay';
import STS from './elements/STS';
import ADV from './elements/ADV';
import DownArrow from './elements/DownArrow';
import PseudoFWC from './elements/PseudoFWC';

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
                <UpperDisplay />
                <line className="Separator" x1="4" y1="533" x2="444" y2="533" strokeLinecap="round" />
                <line className="Separator" x1="522" y1="533" x2="764" y2="533" strokeLinecap="round" />
                <line className="Separator" x1="484" y1="552" x2="484" y2="724" strokeLinecap="round" />
                <LowerLeftDisplay x={14} y={565} />
                <LowerRightDisplay x={520} y={565} />
                <STS x={484} y={753} active={false} />
                <ADV x={483} y={543} active={false} />
                <DownArrow x={481} y={729} active={false} />
                <PseudoFWC />
                {/* sd */}
            </svg>
        </DisplayUnit>
    );
};

render(<EWD />);

import React from 'react';
import LowerLeftDisplay from './LowerLeftDisplay';
import LowerRightDisplay from './LowerRightDisplay';
import STS from './STS';
import ADV from './ADV';
import DownArrow from './DownArrow';
import PseudoFWC from './PseudoFWC';

const LowerDisplay = () => (
    <>
        <line className="Separator" x1="4" y1="520" x2="444" y2="520" strokeLinecap="round" />
        <line className="Separator" x1="522" y1="520" x2="764" y2="520" strokeLinecap="round" />
        <line className="Separator" x1="484" y1="540" x2="484" y2="730" strokeLinecap="round" />
        <LowerLeftDisplay x={14} y={554} />
        <LowerRightDisplay x={520} y={554} />
        <STS x={483} y={757} active={false} />
        <ADV x={483} y={530} active={false} />
        <DownArrow x={481} y={736} active={false} />
        <PseudoFWC />
    </>
);

export default LowerDisplay;

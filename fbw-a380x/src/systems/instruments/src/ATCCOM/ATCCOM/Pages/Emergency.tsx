import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { SwitchButton } from '../Elements/SwitchButton';
import { Button } from '../../Components/Button';

export const Page: FC = () => (
  <Layer x={0} y={140}>
    {/* ADS-C */}
    <text x={280} y={25} fontSize={22} fill="#fff">
      ADS-C EMERGENCY
    </text>
    <SwitchButton x={330} y={35} first="ARMED" second="OFF" onClick={() => {}} />
    <path stroke="white" fill="none" strokeWidth={1} d="m 20 116 h 728 z" />

    {/* message blocks */}
    <Button x={552} y={122} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        MAYDAY
      </text>
    </Button>
    <Button x={552} y={164} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        PANPAN
      </text>
    </Button>
    <Button x={552} y={206} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        CANCEL EMER
      </text>
    </Button>
    <Button x={552} y={259} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        CLIMBING TO
      </text>
    </Button>
    <Button x={552} y={301} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        DESCENDING TO
      </text>
    </Button>
    <Button x={552} y={343} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        DIVERTING/VIA
      </text>
    </Button>
    <Button x={552} y={385} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        OFFSETTING
      </text>
    </Button>
    <Button x={552} y={438} width={210} height={64}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        <tspan x={203} dy={6}>
          REQUEST
        </tspan>
        <tspan x={203} dy={26}>
          VOICE CONTACT
        </tspan>
      </text>
    </Button>
    <Button x={552} y={502} width={210} height={64}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        <tspan x={203} dy={6}>
          ENDURANCE
        </tspan>
        <tspan x={203} dy={26}>
          &amp; PERSONS
        </tspan>
      </text>
    </Button>
    <Button x={552} y={575} width={210} height={42}>
      <text x={203} y={22} fill="white" fontSize={22} textAnchor="end" dominantBaseline="central">
        ADD FREETEXT
      </text>
    </Button>

    <Button x={3} y={744} width={184} height={64} disabled>
      CANCEL
    </Button>
    <Button x={582} y={744} width={184} height={64} disabled>
      <tspan dy={-3}>XFR</tspan>
      <tspan dy={19}>TO MAILBOX</tspan>
    </Button>
  </Layer>
);

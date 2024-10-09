import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../../Components/Button';
import { TextBox } from '../../../Components/Textbox';

export const Page: FC = () => {
  const history = useHistory();

  /* TODO update notify-text */
  /* TODO update current and next station */
  /* TODO implement DISCONNECT ALL */
  /* TODO disable MAX UPLINK DELAY for FANS-B */

  return (
    <Layer x={0} y={140}>
      {/* Notification menu */}
      <text x={70} y={48} fontSize={22} fill="#fff">
        NOTIFY TO ATC :
      </text>
      <TextBox x={305} y={20} width={110} maxLength={4} />
      <Button x={565} y={20} width={120}>
        NOTIFY
      </Button>
      <text x={307} y={90} fontSize={22} fill="#fff">
        NOTIFYING
      </text>

      {/* Connection status */}
      <text x={111} y={150} fontSize={22} fill="#fff">
        ACTIVE ATC :
      </text>
      <text x={307} y={150} fontSize={25} fill="#0f0">
        EDUA
      </text>
      <text x={139} y={210} fontSize={22} fill="#fff">
        NEXT ATC :
      </text>
      <text x={307} y={210} fontSize={25} fill="#0f0">
        EBBR
      </text>
      <Button x={500} y={155} width={240} disabled>
        DISCONNECT ALL
      </Button>
      <Button x={500} y={240} width={240} height={60} onClick={() => history.push('connect/max_uplink_delay')}>
        <tspan dy={-10} dominantBaseline="central">
          MODIFY
        </tspan>
        <tspan dx={1} dy={13} dominantBaseline="central">
          MAX UPLINK DELAY
        </tspan>
      </Button>
      <path stroke="grey" fill="none" strokeWidth={1} d="m 20 320 h 728 z" />

      {/* ADS information */}
      <text x={210} y={370} fontSize={22} fill="#fff">
        ADS-C
      </text>
      <rect x={145} y={380} height={70} width={200} strokeWidth={1} stroke="grey" fill="none" />
      <text textAnchor="middle">
        <tspan x={245} dy={401} dominantBaseline="central" fill="#0f0" fontSize={30}>
          ARMED
        </tspan>
        <tspan x={245} dy={37} dominantBaseline="central" fill="grey" fontSize={22}>
          OFF
        </tspan>
      </text>
      <text x={420} y={370} fontSize={22} fill="#fff">
        ADS-C EMERGENCY
      </text>
      <rect x={470} y={380} height={70} width={110} strokeWidth={1} stroke="grey" fill="none" />
      <text textAnchor="middle">
        <tspan x={525} y={401} dominantBaseline="central" fill="grey" fontSize={22}>
          ARMED
        </tspan>
        <tspan x={525} dy={31} dominantBaseline="central" fill="white" fontSize={30}>
          OFF
        </tspan>
      </text>
      <text x={110} y={497} fontSize={22} fill="#fff">
        ADS CONNECTED GROUND STATIONS :
      </text>
      <text x={595} y={497} fontSize={22} fill="#fff">
        NONE
      </text>
      <path stroke="grey" fill="none" strokeWidth={1} d="m 235 515 h 350 v 265 h -350 v -265 z" />
    </Layer>
  );
};

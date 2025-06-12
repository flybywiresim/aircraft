// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayUnit } from '@instruments/common/displayUnit';
import React from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@flybywiresim/fbw-sdk';

import { PagesContainer } from './PagesContainer';
import { StatusArea } from './StatusArea/StatusArea';

import './style.scss';

const Idle = () => {
  const [doorVideoEnabledNow] = useSimVar('L:A32NX_OVHD_COCKPITDOORVIDEO_TOGGLE', 'Bool');
  const [doorVideoPressedNow] = useSimVar('L:PUSH_DOORPANEL_VIDEO', 'Bool');

  const doorVideoVisible = doorVideoEnabledNow && doorVideoPressedNow;

  return (
    <div id="Mainframe">
      <svg className="sd-svg" viewBox="0 0 600 600">
        <PagesContainer />
      </svg>

      {doorVideoVisible && <div id="door-video-wrapper" />}

      <StatusArea />
    </div>
  );
};

render(
  <DisplayUnit electricitySimvar="L:A32NX_ELEC_AC_2_BUS_IS_POWERED" potentiometerIndex={93} normDmc={1}>
    <Idle />
  </DisplayUnit>,
);

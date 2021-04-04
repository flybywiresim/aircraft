import './style.scss';
import React from 'react';
import { render } from '../Common';
import { RootRadioPanel } from './Components/BaseRadioPanels';

render(
    <div className="rmp-wrapper">
        <RootRadioPanel side="L" />
        <RootRadioPanel side="R" />
    </div>,
);

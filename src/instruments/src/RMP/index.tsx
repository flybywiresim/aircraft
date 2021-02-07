import './style.scss';
import React from 'react';
import * as ReactInstrument from '../Common/ReactInstrument';
import { RootRadioPanel } from './Components/BaseRadioPanels';

ReactInstrument.render(
    <div className="rmp-wrapper">
        <RootRadioPanel side="L" />
        <RootRadioPanel side="R" />
    </div>
);

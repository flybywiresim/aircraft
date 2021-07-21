import './Bleed.scss';
import ReactDOM from 'react-dom';
import React from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { usePersistentProperty } from '../../../Common/persistence';

setIsEcamPage('bleed_page');

export const BleedPage = () => {
    return (

    );
};

ReactDOM.render(<SimVarProvider><BleedPage /></SimVarProvider>, getRenderTarget());

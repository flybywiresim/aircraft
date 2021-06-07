import ReactDOM from 'react-dom';
import React from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider } from '../../../Common/simVars';

import './Crz.scss';

setIsEcamPage('crz_page');

export const CrzPage = () => {
// Disaply trim valve position for each zone
    console.log('Cruise');

    return (
        <>
            <svg id="crz-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
                <text className="Title" x="300" y="20">CRUISE</text>

                <text className="SubTitle" x="50" y="60">ENG</text>

            </svg>
        </>
    );
};
ReactDOM.render(<SimVarProvider><CrzPage /></SimVarProvider>, getRenderTarget());

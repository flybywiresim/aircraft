import React, { useEffect } from 'react';

import './styles.scss';

import Scratchpad from './Scratchpad/Scratchpad';
import PagesContainer from './Pages/PagesContainer';
import Titlebar from './Titlebar/Titlebar';
import { useMCDUSelector } from './redux/hooks';

const MCDU = () => {
    const fmgc = useMCDUSelector((state) => state.mcduData);

    useEffect(() => {
        fmgc.guidanceController.init();
    }, []);

    return (
        <div className="mcdu-outer">
            <div className="mcdu-inner">
                <Titlebar />
                <div className="mcdu-content">
                    <PagesContainer />
                </div>
                <Scratchpad />
            </div>
        </div>

    );
};

export default MCDU;

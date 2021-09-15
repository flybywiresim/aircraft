import React, { useEffect } from 'react';

import { lineColors } from 'instruments/src/MCDU/Components/Lines/LineProps';

import { useSimVar } from 'instruments/src/util';
import { useMCDUDispatch } from 'instruments/src/MCDU/redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

/**
 *
 * @deprecated Need to allow titlebar to have multiple columns
 * @see TitleBar
 */
const ProgressPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [flightNo, _] = useSimVar('ATC FLIGHT NUMBER', 'string');
    const dispatch = useMCDUDispatch();
    const setTitlebar = (msg: any) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };
    const setTitlebarColor = (color: lineColors) => {
        dispatch(titlebarActions.setTitleBarColor(color));
    };
    useEffect(() => {
        setTitlebar('TO');
        setTitlebarColor(lineColors.green);
    }, []);
    return (
        <>

        </>
    );
};

export default ProgressPage;

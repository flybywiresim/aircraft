import React, { useEffect } from 'react';

import { Content } from 'instruments/src/MCDU/Components/Content';
import { RowHolder } from 'instruments/src/MCDU/Components/RowHolder';
import { Line, lineColors, lineSides, lineSizes } from 'instruments/src/MCDU/Components/Lines/Line';
import { LabelField } from 'instruments/src/MCDU/Components/Fields/NonInteractive/LabelField';
import { LineHolder } from 'instruments/src/MCDU/Components/LineHolder';
import { Field } from 'instruments/src/MCDU/Components/Fields/NonInteractive/Field';

import { useSimVar } from 'instruments/src/util';
import { useMCDUDispatch } from 'instruments/src/MCDU/redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

const FlightCruise: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value={'\xa0CRZ\xa0'} color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(<Field value="-----" color={lineColors.white} size={lineSizes.regular} />)}
        />
    </LineHolder>
);

/**
 *
 * @deprecated
 * @see TitleBar
 */
const ProgressPage: React.FC = () => {
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
            <Content>
                <RowHolder index={1}>
                    <FlightCruise />
                </RowHolder>
                <RowHolder index={2} />
                <RowHolder index={3} />
                <RowHolder index={4} />
                <RowHolder index={5} />
                <RowHolder index={6} />
            </Content>
        </>
    );
};

export default ProgressPage;

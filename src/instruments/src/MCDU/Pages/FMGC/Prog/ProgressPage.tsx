import React, { useEffect } from 'react';

import { Content } from 'instruments/src/MCDU/Components/Content';
import { RowHolder } from 'instruments/src/MCDU/Components/RowHolder';
import { Line, lineColors, lineSides, lineSizes } from 'instruments/src/MCDU/Components/Lines/Line';
import { LabelField } from 'instruments/src/MCDU/Components/Fields/NonInteractive/LabelField';
import { LineHolder } from 'instruments/src/MCDU/Components/LineHolder';
import { Field } from 'instruments/src/MCDU/Components/Fields/NonInteractive/Field';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useSimVar } from 'instruments/src/util';
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

type progressPageProps = {
    setTitlebar : (msg: any) => any,
    setTitlebarColor : (color: lineColors) => any,
}
/**
 *
 * @deprecated
 * @see TitleBar
 */
const ProgressPage: React.FC<progressPageProps> = ({ setTitlebar, setTitlebarColor }) => {
    const [flightNo, _] = useSimVar('ATC FLIGHT NUMBER', 'string');
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

const mapDispatchToProps = (dispatch) => ({
    setTitlebar: bindActionCreators(titlebarActions.setTitleBarText, dispatch),
    setTitlebarColor: bindActionCreators(titlebarActions.setTitleBarColor, dispatch),
});
export default connect(null, mapDispatchToProps)(ProgressPage);

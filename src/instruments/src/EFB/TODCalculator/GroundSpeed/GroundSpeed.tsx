import { connect } from 'react-redux';
import React from 'react';
import Card from '../../Components/Card/Card';
import { TOD_CALCULATOR_REDUCER } from '../../Store';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode.enum';
import GroundSpeedAuto from './GroundSpeedAuto/GroundSpeedAuto';
import GroundSpeedManual from './GroundSpeedManual/GroundSpeedManual';

const GroundSpeed = ({ groundSpeedMode, ...props }) => {
    const groundSpeedComponent = ({
        [TOD_INPUT_MODE.AUTO]: {
            render: () => <GroundSpeedAuto />,
            childrenContainerClassName: 'flex-1 flex flex-col justify-center',
        },
        [TOD_INPUT_MODE.MANUAL]: {
            render: () => <GroundSpeedManual />,
            childrenContainerClassName: 'flex-1 flex flex-col justify-start',
        },
    })[groundSpeedMode];

    return (
        <Card title="Ground Speed" childrenContainerClassName={groundSpeedComponent.childrenContainerClassName} {...props}>
            {groundSpeedComponent.render()}
        </Card>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeedMode } }) => ({ groundSpeedMode }),
)(GroundSpeed);

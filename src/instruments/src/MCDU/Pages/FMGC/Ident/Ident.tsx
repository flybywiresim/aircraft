import React, { useEffect } from 'react';
import { calculateActiveDate, calculateSecDate } from '@instruments/common/Date';
import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import '../../../Components/styles.scss';

import './styles.scss';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';

const EngineLine: React.FC = () => (
    <div className="line-holder-left">
        <LabelField lineSide={lineSides.left} value={'\xa0ENG'} color={lineColors.white} />
        <Field lineSide={lineSides.left} value="LEAP-1A26" color={lineColors.green} size={lineSizes.regular} />
    </div>
);

const ActiveNavDataLine: React.FC = () => {
    const [activeNavDate] = ['TODO'];
    return (
        <div className="line-holder-left">
            <LabelField lineSide={lineSides.left} value="ACTIVE DATA BASE" color={lineColors.white} />
            <Field
                lineSide={lineSides.left}
                value={calculateActiveDate(activeNavDate)}
                color={lineColors.cyan}
                size={lineSizes.regular}
            />
        </div>
    );
};

const SecondaryNavDataLine: React.FC = () => {
    const [secNavDate] = ['TODO'];
    return (
        <div className="line-holder-left">
            <LabelField lineSide={lineSides.left} value="SECOND DATA BASE" color={lineColors.white} />
            <Field
                lineSide={lineSides.left}
                value={calculateSecDate(secNavDate)}
                color={lineColors.inop}
                size={lineSizes.small}
            />
        </div>
    );
};

const AiracLine: React.FC = () => (
    <div className="line-holder-two">
        <EmptyLine />
        <Field
            lineSide={lineSides.right}
            value="AIRAC"
            color={lineColors.green}
            size={lineSizes.regular}
        />
    </div>
);

const ChgCodeLine: React.FC = () => (
    <div className="line-holder-one">
        <LabelField lineSide={lineSides.left} value="CHG CODE" color={lineColors.white} />
        <Field
            lineSide={lineSides.left}
            value="[  ]"
            color={lineColors.inop}
            size={lineSizes.small}
        />
    </div>
);

const TodoNameLine: React.FC = () => (
    <div className="line-holder-one">
        <LabelField lineSide={lineSides.left} value="IDLE/PERF" color={lineColors.white} />
        <Field
            lineSide={lineSides.left}
            value="+0.0/+0.0"
            color={lineColors.green}
            size={lineSizes.regular}
        />
    </div>
);

const SoftwareLine: React.FC = () => (
    <div className="line-holder-two">
        <LabelField lineSide={lineSides.right} value="SOFTWARE" color={lineColors.white} />
        <Field
            lineSide={lineSides.right}
            value="STATUS/XLOAD"
            color={lineColors.inop}
            size={lineSizes.regular}
        />
    </div>
);

const IdentPage: React.FC = () => {
    const dispatch = useMCDUDispatch();
    const setTitlebarText = (msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };

    useEffect(() => {
        setTitlebarText('A320-200');
    }, []);

    return (
        <>
            <div className="row-holder">
                <EngineLine />
            </div>
            <div className="row-holder">
                <ActiveNavDataLine />
                <AiracLine />
            </div>
            <div className="row-holder">
                <SecondaryNavDataLine />
            </div>
            <div className="row-holder">
                <ChgCodeLine />
            </div>
            <div className="row-holder">
                <TodoNameLine />
                <SoftwareLine />
            </div>
        </>
    );
};

export default IdentPage;

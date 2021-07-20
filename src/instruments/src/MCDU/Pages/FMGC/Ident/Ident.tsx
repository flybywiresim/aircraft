import React, { useEffect } from 'react';
import { calculateActiveDate, calculateSecDate } from '@instruments/common/Date';
import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import '../../../Components/styles.scss';

import { Content } from '../../../Components/Content';
import { LineHolder } from '../../../Components/LineHolder';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { RowHolder } from '../../../Components/RowHolder';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';

const EngineLine: React.FC = () => (
    <LineHolder>
        <LabelField lineSide={lineSides.left} value={'\xa0ENG'} color={lineColors.white} />
        <Field lineSide={lineSides.left} value="LEAP-1A26" color={lineColors.green} size={lineSizes.regular} />

    </LineHolder>
);

const ActiveNavDataLine: React.FC = () => {
    const [activeNavDate] = ['TODO'];
    return (
        <LineHolder>
            <LabelField lineSide={lineSides.left} value="ACTIVE DATA BASE" color={lineColors.white} />
            <Field
                lineSide={lineSides.left}
                value={calculateActiveDate(activeNavDate)}
                color={lineColors.cyan}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

const SecondaryNavDataLine: React.FC = () => {
    const [secNavDate] = ['TODO'];
    return (
        <LineHolder>
            <LabelField lineSide={lineSides.left} value="SECOND DATA BASE" color={lineColors.white} />
            <Field
                lineSide={lineSides.left}
                value={calculateSecDate(secNavDate)}
                color={lineColors.inop}
                size={lineSizes.small}
            />
        </LineHolder>
    );
};

const AiracLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Field
            lineSide={lineSides.right}
            value="AIRAC"
            color={lineColors.green}
            size={lineSizes.regular}
        />
    </LineHolder>
);

const ChgCodeLine: React.FC = () => (
    <LineHolder>
        <LabelField lineSide={lineSides.left} value="CHG CODE" color={lineColors.white} />
        <Field
            lineSide={lineSides.left}
            value="[  ]"
            color={lineColors.inop}
            size={lineSizes.small}
        />
    </LineHolder>
);

const TodoNameLine: React.FC = () => (
    <LineHolder>
        <LabelField lineSide={lineSides.left} value="IDLE/PERF" color={lineColors.white} />
        <Field
            lineSide={lineSides.left}
            value="+0.0/+0.0"
            color={lineColors.green}
            size={lineSizes.regular}
        />
    </LineHolder>
);

const SoftwareLine: React.FC = () => (
    <LineHolder>
        <LabelField lineSide={lineSides.right} value="SOFTWARE" color={lineColors.white} />
        <Field
            lineSide={lineSides.right}
            value="STATUS/XLOAD"
            color={lineColors.inop}
            size={lineSizes.regular}
        />
    </LineHolder>
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
            <Content>
                <RowHolder index={1}>
                    <EngineLine />
                </RowHolder>
                <RowHolder index={2}>
                    <ActiveNavDataLine />
                    <AiracLine />
                </RowHolder>
                <RowHolder index={3}>
                    <SecondaryNavDataLine />
                </RowHolder>
                <RowHolder index={5}>
                    <ChgCodeLine />
                </RowHolder>
                <RowHolder index={6}>
                    <TodoNameLine />
                    <SoftwareLine />
                </RowHolder>
            </Content>
        </>
    );
};

export default IdentPage;

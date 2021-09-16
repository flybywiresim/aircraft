import React, { useEffect } from 'react';
import { calculateActiveDate, calculateSecDate } from '@instruments/common/Date';
import { RowHolder } from '../../../Components/Holders/RowHolder';
import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineHolder } from '../../../Components/Holders/LineHolder';

const EngineLine: React.FC = () => (
    <LineHolder columnPosition={1}>
        <LabelField lineSide={lineSides.left} value={'\xa0ENG'} color={lineColors.white} />
        <Field lineSide={lineSides.left} value="LEAP-1A26" color={lineColors.green} size={lineSizes.regular} />
    </LineHolder>
);

const ActiveNavDataLine: React.FC = () => {
    const [activeNavDate] = ['TODO'];
    return (
        <LineHolder columnPosition={1}>
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
        <LineHolder columnPosition={1}>
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
    <LineHolder columnPosition={2}>
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
    <LineHolder columnPosition={1}>
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
    <LineHolder columnPosition={1}>
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
    <LineHolder columnPosition={2}>
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
            <RowHolder columns={1}>
                <EngineLine />
            </RowHolder>
            <RowHolder columns={2}>
                <ActiveNavDataLine />
                <AiracLine />
            </RowHolder>
            <RowHolder columns={2}>
                <SecondaryNavDataLine />
            </RowHolder>
            <RowHolder columns={2}>
                <ChgCodeLine />
            </RowHolder>
            <RowHolder columns={2}>
                <TodoNameLine />
                <SoftwareLine />
            </RowHolder>
        </>
    );
};

export default IdentPage;

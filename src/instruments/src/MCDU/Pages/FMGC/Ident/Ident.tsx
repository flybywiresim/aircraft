import React, { useEffect } from 'react';
import { calculateActiveDate, calculateSecDate } from '@instruments/common/Date';
import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import '../../../Components/styles.scss';

import { Content } from '../../../Components/Content';
import { LineHolder } from '../../../Components/LineHolder';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { RowHolder } from '../../../Components/RowHolder';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';

const EngineLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value={'\xa0ENG'} color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(<Field value="LEAP-1A26" color={lineColors.green} size={lineSizes.regular} />)}
        />
    </LineHolder>
);

const ActiveNavDataLine: React.FC = () => {
    const [activeNavDate] = ['TODO'];
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="ACTIVE DATA BASE" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <Field
                        value={calculateActiveDate(activeNavDate)}
                        color={lineColors.cyan}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

const SecondaryNavDataLine: React.FC = () => {
    const [secNavDate] = ['TODO'];
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="SECOND DATA BASE" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <Field
                        value={calculateSecDate(secNavDate)}
                        color={lineColors.inop}
                        size={lineSizes.small}
                    />
                )}
            />
        </LineHolder>
    );
};

const AiracLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line
            side={lineSides.right}
            value={(
                <Field
                    value="AIRAC"
                    color={lineColors.green}
                    size={lineSizes.regular}
                />
            )}
        />
    </LineHolder>
);

const ChgCodeLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="CHG CODE" color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(
                <Field
                    value="[  ]"
                    color={lineColors.inop}
                    size={lineSizes.small}
                />
            )}
        />
    </LineHolder>
);

const TodoNameLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="IDLE/PERF" color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(
                <Field
                    value="+0.0/+0.0"
                    color={lineColors.green}
                    size={lineSizes.regular}
                />
            )}
        />
    </LineHolder>
);

const SoftwareLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value="SOFTWARE" color={lineColors.white} />} />
        <Line
            side={lineSides.right}
            value={(
                <Field
                    value="STATUS/XLOAD"
                    color={lineColors.inop}
                    size={lineSizes.regular}
                />
            )}
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

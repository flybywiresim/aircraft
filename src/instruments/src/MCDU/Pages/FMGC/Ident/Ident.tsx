import React, { useContext, useEffect } from 'react';
import { Content } from '../../../Components/Content';
import '../../../Components/styles.scss';
import { RootContext } from '../../../RootContext.jsx';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { RowHolder } from '../../../Components/RowHolder';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';

// TODO move this to utils?
/* const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function findNewMonthIndex(index) {
    if (index === 0) {
        return 11;
    } else {
        return index - 1;
    }
}

function lessThan10(num) {
    if (num < 10) {
        return `0${num}`;
    } else {
        return num;
    }
}

function calculateActiveDate(date) {
    if (date.length === 13) {
        const startMonth = date.slice(0, 3);
        const startDay = date.slice(3, 5);

        const endMonth = date.slice(5, 8);
        const endDay = date.slice(8, 10);

        return `${startDay}${startMonth}-${endDay}${endMonth}`;
    } else {
        return date;
    }
}

function calculateSecDate(date) {
    if (date.length === 13) {
        const primStartMonth = date.slice(0, 3);
        const primStartDay = date.slice(3, 5);

        const primStartMonthIndex = months.findIndex((item) => item === primStartMonth);

        if (primStartMonthIndex === -1) {
            return "ERR";
        }

        let newEndMonth = primStartMonth;
        let newEndDay = primStartDay - 1;

        let newStartDay = newEndDay - 27;
        let newStartMonth = primStartMonth;

        if (newEndDay === 0) {
            newEndMonth = months[findNewMonthIndex(primStartMonthIndex)];
            newEndDay = monthLength[findNewMonthIndex(primStartMonthIndex)];
        }

        if (newStartDay <= 0) {
            newStartMonth = months[findNewMonthIndex(primStartMonthIndex)];
            newStartDay = monthLength[findNewMonthIndex(primStartMonthIndex)] + newStartDay;
        }

        return `${lessThan10(newStartDay)}${newStartMonth}-${lessThan10(newEndDay)}${newEndMonth}`;
    } else {
        return "ERR";
    }
}  */

const IdentPage: React.FC = () => {
    const [, , , setTitle] = useContext(RootContext);
    // const date = useSimVar("FLIGHT NAVDATA DATE RANGE", "string"

    useEffect(() => {
        setTitle('A320-200');
    }, []);

    // TODO convert this vomit into components
    return (
        <Content>
            <RowHolder index={1}>
                <LineHolder>
                    <Line side={lineSides.left} value={<LabelField value={'\xa0ENG'} color={lineColors.white} />} />
                    <Line
                        side={lineSides.left}
                        value={(
                            <Field
                                value="LEAP-1A26"
                                color={lineColors.green}
                                size={lineSizes.regular}
                            />
                        )}
                    />
                </LineHolder>
            </RowHolder>
            <RowHolder index={2}>
                <LineHolder>
                    <Line side={lineSides.left} value={<LabelField value={'\xa0ACTIVE NAV DATA BASE'} color={lineColors.white} />} />
                    <Line
                        side={lineSides.left}
                        value={(
                            <Field
                                value="TODO"
                                color={lineColors.cyan}
                                size={lineSizes.regular}
                            />
                        )}
                    />
                </LineHolder>
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
            </RowHolder>
            <RowHolder index={3}>
                <LineHolder>
                    <Line side={lineSides.left} value={<LabelField value={'\xa0SECOND NAV DATA BASE'} color={lineColors.white} />} />
                    <Line
                        side={lineSides.left}
                        value={(
                            <Field
                                value="TODO"
                                color={lineColors.inop}
                                size={lineSizes.small}
                            />
                        )}
                    />
                </LineHolder>
            </RowHolder>
            <RowHolder index={5}>
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
            </RowHolder>
            <RowHolder index={6}>
                <LineHolder>
                    <Line side={lineSides.left} value={<LabelField value="+0.0/+0.0" color={lineColors.white} />} />
                    <Line
                        side={lineSides.left}
                        value={(
                            <Field
                                value="IDLE/PERF"
                                color={lineColors.green}
                                size={lineSizes.regular}
                            />
                        )}
                    />
                </LineHolder>
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
            </RowHolder>
        </Content>
    );
};

export default IdentPage;

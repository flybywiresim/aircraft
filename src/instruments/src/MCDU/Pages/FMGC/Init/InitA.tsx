import React, { useEffect, useState } from 'react';
import { useSimVar } from '../../../../Common/simVars';

import { LineHolder } from '../../../Components/LineHolder';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Content } from '../../../Components/Content';
import { RowHolder } from '../../../Components/RowHolder';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineSelectField } from '../../../Components/Fields/Interactive/LineSelectField';
import InteractiveSplitLine from '../../../Components/Lines/InteractiveSplitLine';
import SplitStringField from '../../../Components/Fields/Interactive/Split/SplitStringField';
import SplitNumberField from '../../../Components/Fields/Interactive/Split/SplitNumberField';
import { scratchpadMessage } from '../../../redux/reducers/scratchpadReducer';

// TODO when FMGS is in place then event and color management to these components

const CoRouteLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="CO RTE" color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(
                <Field
                    value="__________"
                    color={lineColors.amber}
                    size={lineSizes.regular}
                />
            )}
        />
    </LineHolder>
);

type fromToLineProps = {
    addMessage: (msg: scratchpadMessage) => void
}
// This is specifically not a split field line because of the operations of FROM/TO
const FromToLine: React.FC<fromToLineProps> = ({ addMessage }) => {
    const setNewValue = (value: string | undefined) => {
        console.log(`Inserting FROM/TO ${value}`);
    };
    const validateEntry = (value: string) => {
        if (value === '') {
            addMessage({
                text: 'FORMAT ERROR',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        return true;
    };
    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value={'FROM/TO\xa0\xa0'} color={lineColors.white} />} />
            <Line
                side={lineSides.right}
                value={(
                    <StringInputField
                        value=""
                        nullValue="____|____"
                        color={lineColors.amber}
                        size={lineSizes.regular}
                        lsk={LINESELECT_KEYS.R1}
                        selectedCallback={(value) => setNewValue(value)}
                        selectedValidation={(value) => validateEntry(value)} // For now returns true
                    />
                )}
            />
        </LineHolder>
    );
};
type altDestLineProps = {
    addMessage: (msg: scratchpadMessage) => void
}
const AltDestLine: React.FC<altDestLineProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string>();

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            setValue(undefined);
        } else {
            setValue(value);
        }
    };

    const validateEntry = (value) => {
        if (value === '') {
            addMessage({
                text: 'FORMAT ERROR',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        return true;
    };
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="ALTN/CO RTE" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <StringInputField
                        value={value}
                        nullValue="----|----------"
                        color={value !== undefined ? lineColors.cyan : lineColors.amber}
                        lsk={LINESELECT_KEYS.L2}
                        selectedCallback={(value) => setNewValue(value)}
                        selectedValidation={((value) => validateEntry(value))}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

type flightNoLineProps = {
    clearScratchpad: () => void
    addMessage: (msg: scratchpadMessage) => void
}
const FlightNoLine: React.FC<flightNoLineProps> = ({ addMessage }) => {
    const [flightNo, setFlightNo] = useSimVar('ATC FLIGHT NUMBER', 'string');

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            setFlightNo(undefined);
        } else {
            setFlightNo(value);
        }
    };

    const validateEntry = (value) => {
        if (value === '') {
            addMessage({
                text: 'FORMAT ERROR',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        if (value.length <= 7) {
            return true;
        }
        addMessage({
            text: 'FORMAT ERROR',
            isAmber: false,
            isTypeTwo: false,
        });
        return false;
    };

    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="FLT NBR" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <StringInputField
                        value={flightNo}
                        nullValue="________"
                        color={flightNo !== undefined ? lineColors.cyan : lineColors.amber}
                        size={lineSizes.regular}
                        selectedCallback={(value) => setNewValue(value)}
                        lsk={LINESELECT_KEYS.L3}
                        selectedValidation={(value) => validateEntry(value)}
                    />
                )}
            />
        </LineHolder>
    );
};

const WindTempLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line
            side={lineSides.right}
            value={(
                <LineSelectField
                    value="WIND/TEMP>"
                    size={lineSizes.regular}
                    selectedCallback={() => {
                        console.log('WIND/TEMP Page called');
                    }}
                    lsk={LINESELECT_KEYS.R4}
                    color={lineColors.white}
                />
            )}
        />
    </LineHolder>
);

const CostIndexLine: React.FC = () => {
    const [costIndex, setCostIndex] = useState<string>(); // Temp until FMGC in-place
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="COST INDEX" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <NumberInputField
                        value={costIndex !== undefined ? parseInt(costIndex).toFixed(0) : ''}
                        nullValue="___"
                        min={100}
                        max={999}
                        color={costIndex !== undefined ? lineColors.cyan : lineColors.amber}
                        lsk={LINESELECT_KEYS.L5}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setCostIndex(undefined);
                            } else {
                                setCostIndex(value);
                            }
                        }}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

// TODO Parse the scratchpad input and do validation for split fields or find a way to do it in Line Component
type cruiseFLTempProps = {
    clearScratchpad: () => void
}
const CruiseFLTemp: React.FC<cruiseFLTempProps> = ({ clearScratchpad }) => {
    const [flString, setFL] = useState<string>();
    const [temp, setTemp] = useState<number>();
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="CRZ FL/TEMP" color={lineColors.white} />} />
            <InteractiveSplitLine
                slashColor={flString !== undefined ? lineColors.cyan : lineColors.amber}
                lsk={LINESELECT_KEYS.L6}
                leftSide={(
                    <SplitStringField
                        value={flString}
                        nullValue="-----"
                        color={flString !== undefined ? lineColors.cyan : lineColors.amber}
                        size={lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setFL(undefined);
                            } else {
                                setFL(value);
                            }
                            clearScratchpad();
                        }}
                        selectedValidation={() => true}
                    />
                )}
                rightSide={(
                    <SplitNumberField
                        value={temp}
                        nullValue="___°"
                        min={-270}
                        max={100}
                        size={lineSizes.regular}
                        color={lineColors.inop}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setTemp(undefined);
                            } else {
                                setTemp(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
            />
        </LineHolder>
    );
};

// TODO finish this
const AlignOptionLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <EmptyLine />
    </LineHolder>
);

const TropoLine: React.FC = () => {
    const [tropo, setTropo] = useState<string>();
    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="TROPO" color={lineColors.white} />} />
            <Line
                side={lineSides.right}
                value={(
                    <NumberInputField
                        value={tropo}
                        nullValue="36090"
                        max={60000}
                        min={0}
                        color={lineColors.cyan}
                        size={lineSizes.regular}
                        lsk={LINESELECT_KEYS.R5}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setTropo(undefined);
                            } else {
                                setTropo(value);
                            }
                        }}
                    />
                )}
            />
        </LineHolder>
    );
};

const GndTempLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value="GND TEMP" color={lineColors.white} />} />
        <Line
            side={lineSides.right}
            value={(
                <Field
                    value="---°"
                    color={lineColors.inop}
                    size={lineSizes.regular}
                />
            )}
        />
    </LineHolder>
);

const RequestLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<Field value="REQUEST*" color={lineColors.amber} size={lineSizes.regular} />} />
        <Line
            side={lineSides.right}
            value={(
                <LineSelectField
                    value="INIT "
                    color={lineColors.amber}
                    size={lineSizes.regular}
                    lsk={LINESELECT_KEYS.R2}
                    selectedCallback={() => {
                        console.log('Pretending to retrieve simbrief data');
                    }}
                />
            )}
        />
    </LineHolder>
);
type InitAPageProps = {

    // REDUX
    setTitlebarText : (text: any) => void
    clearScratchpad: () => void
    addMessage: (msg: scratchpadMessage) => void
}
const InitAPage: React.FC<InitAPageProps> = ({ setTitlebarText, clearScratchpad, addMessage }) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <Content>
            <RowHolder index={1}>
                <CoRouteLine />
                <FromToLine addMessage={addMessage} />
            </RowHolder>
            <RowHolder index={2}>
                <AltDestLine addMessage={addMessage} />
                <RequestLine />
            </RowHolder>
            <RowHolder index={3}>
                <FlightNoLine clearScratchpad={clearScratchpad} addMessage={addMessage} />
                <AlignOptionLine />
            </RowHolder>
            <RowHolder index={4}>
                <WindTempLine />
            </RowHolder>
            <RowHolder index={5}>
                <CostIndexLine />
                <TropoLine />
            </RowHolder>
            <RowHolder index={6}>
                <CruiseFLTemp clearScratchpad={clearScratchpad} />
                <GndTempLine />
            </RowHolder>
        </Content>
    );
};

export default InitAPage;

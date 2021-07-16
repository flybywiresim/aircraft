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

// This is specifically not a split field line because of the operations of FROM/TO
const FromToLine: React.FC = () => (
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
                    selectedCallback={(value) => {
                        console.log(`Inserting FROM/TO ${value}`);
                    }}
                    selectedValidation={() => true} // For now returns true
                />
            )}
        />
    </LineHolder>
);

// Should this be split field?
type altDestLineProps = {
    clearScratchpad: () => any
}
const AltDestLine: React.FC<altDestLineProps> = ({ clearScratchpad }) => {
    const [value, setValue] = useState<string>();
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
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setValue(undefined);
                            } else {
                                setValue(value);
                            }
                            clearScratchpad();
                        }}
                        selectedValidation={(() => true)}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

type flightNoLineProps = {
    clearScratchpad: () => void
}
const FlightNoLine: React.FC<flightNoLineProps> = ({ clearScratchpad }) => {
    const [flightNo, setFlightNo] = useSimVar('ATC FLIGHT NUMBER', 'string');

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
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setFlightNo(undefined);
                            } else {
                                setFlightNo(value);
                            }
                            clearScratchpad();
                        }}
                        lsk={LINESELECT_KEYS.L3}
                        selectedValidation={(value) => value.length <= 7}
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

type costIndexLineProps = {
    clearScratchpad: () => void
}
const CostIndexLine: React.FC<costIndexLineProps> = ({ clearScratchpad }) => {
    const [costIndex, setCostIndex] = useState<number>(); // Temp until FMGC in-place
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="COST INDEX" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <NumberInputField
                        value={costIndex?.toFixed(0)}
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
                            clearScratchpad();
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

type tropoLineProps = {
    clearScratchpad: () => void
}
const TropoLine: React.FC<tropoLineProps> = ({ clearScratchpad }) => {
    const [tropo, setTropo] = useState<number>();
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
                            clearScratchpad();
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
}
const InitAPage: React.FC<InitAPageProps> = ({ setTitlebarText, clearScratchpad }) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <Content>
            <RowHolder index={1}>
                <CoRouteLine />
                <FromToLine />
            </RowHolder>
            <RowHolder index={2}>
                <AltDestLine clearScratchpad={clearScratchpad} />
                <RequestLine />
            </RowHolder>
            <RowHolder index={3}>
                <FlightNoLine clearScratchpad={clearScratchpad} />
                <AlignOptionLine />
            </RowHolder>
            <RowHolder index={4}>
                <WindTempLine />
            </RowHolder>
            <RowHolder index={5}>
                <CostIndexLine clearScratchpad={clearScratchpad} />
                <TropoLine clearScratchpad={clearScratchpad} />
            </RowHolder>
            <RowHolder index={6}>
                <CruiseFLTemp clearScratchpad={clearScratchpad} />
                <GndTempLine />
            </RowHolder>
        </Content>
    );
};

export default InitAPage;

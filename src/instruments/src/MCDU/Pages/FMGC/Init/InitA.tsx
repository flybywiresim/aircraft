import React, { useEffect, useState } from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

import { useSimVar } from '../../../../Common/simVars';

import { LineHolder } from '../../../Components/LineHolder';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { lineSelectKeys } from '../../../Components/Buttons';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Content } from '../../../Components/Content';
import { RowHolder } from '../../../Components/RowHolder';
import { StringInputField } from '../../../Components/Fields/Interactive/StringInputField';
import { NumberInputField } from '../../../Components/Fields/Interactive/NumberInputField';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineSelectField } from '../../../Components/Fields/Interactive/LineSelectField';
import { InteractiveSplitLine } from '../../../Components/Lines/InteractiveSplitLine';
import { SplitStringField } from '../../../Components/Fields/Interactive/Split/SplitStringField';
import { SplitNumberField } from '../../../Components/Fields/Interactive/Split/SplitNumberField';

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
                    lsk={lineSelectKeys.R1}
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
const AltDestLine: React.FC = () => {
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
                        lsk={lineSelectKeys.L2}
                        selectedCallback={(value) => {
                            setValue(value);
                        }}
                        selectedValidation={(() => true)}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

const FlightNoLine: React.FC = () => {
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
                            setFlightNo(value);
                        }}
                        lsk={lineSelectKeys.L3}
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
                    lsk={lineSelectKeys.R4}
                    color={lineColors.white}
                />
            )}
        />
    </LineHolder>
);

const CostIndexLine: React.FC = () => {
    const [costIndex, setCostIndex] = useState<number>(); // Temp until FMGC in-place
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="COST INDEX" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <NumberInputField
                        value={costIndex}
                        nullValue="___"
                        min={100}
                        max={999}
                        color={costIndex !== undefined ? lineColors.cyan : lineColors.amber}
                        lsk={lineSelectKeys.L5}
                        selectedCallback={(value) => {
                            setCostIndex(value);
                        }}
                        size={lineSizes.regular}
                    />
                )}
            />
        </LineHolder>
    );
};

// TODO Parse the scratchpad input and do validation for split fields or find a way to do it in Line Component
const CruiseFLTemp: React.FC = () => {
    const [flString, setFL] = useState<string>();
    const [temp, setTemp] = useState<number>();
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="CRZ FL/TEMP" color={lineColors.white} />} />
            <InteractiveSplitLine
                slashColor={flString !== undefined ? lineColors.cyan : lineColors.amber}
                lsk={lineSelectKeys.L6}
                leftSide={(
                    <SplitStringField
                        value={flString}
                        nullValue="-----"
                        color={flString !== undefined ? lineColors.cyan : lineColors.amber}
                        size={lineSizes.regular}
                        selectedCallback={(value) => {
                            setFL(value);
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
                            setTemp(value);
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
                        lsk={lineSelectKeys.R5}
                        selectedCallback={(value) => {
                            setTropo(value);
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
                    lsk={lineSelectKeys.R2}
                    selectedCallback={() => {
                        console.log('Pretending to retrieve simbrief data');
                    }}
                />
            )}
        />
    </LineHolder>
);
type InitAPageProps = {
    setTitlebar : Function
}
const InitAPage: React.FC<InitAPageProps> = ({ setTitlebar }) => {
    useEffect(() => {
        setTitlebar('INIT');
    }, []);

    return (
        <Content>
            <RowHolder index={1}>
                <CoRouteLine />
                <FromToLine />
            </RowHolder>
            <RowHolder index={2}>
                <AltDestLine />
                <RequestLine />
            </RowHolder>
            <RowHolder index={3}>
                <FlightNoLine />
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
                <CruiseFLTemp />
                <GndTempLine />
            </RowHolder>
        </Content>
    );
};

const mapDispatchToProps = (dispatch) => ({ setTitlebar: bindActionCreators(titlebarActions.setTitleBarText, dispatch) });
export default connect(null, mapDispatchToProps)(InitAPage);

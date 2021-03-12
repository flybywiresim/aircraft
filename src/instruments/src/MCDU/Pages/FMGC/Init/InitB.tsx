import React, { useContext, useEffect, useState } from 'react';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { Line, lineColors, lineSides, lineSizes } from '../../../Components/Lines/Line';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { NumberInputField } from '../../../Components/Fields/Interactive/NumberInputField';
import { lineSelectKeys } from '../../../Components/Buttons';
import { SplitLine } from '../../../Components/Lines/SplitLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { InteractiveSplitLine } from '../../../Components/Lines/InteractiveSplitLine';
import { SplitNumberField } from '../../../Components/Fields/Interactive/Split/SplitNumberField';
import { RowHolder } from '../../../Components/RowHolder';
import { Content } from '../../../Components/Content';
import { RootContext } from '../../../RootContext';
import { StringInputField } from '../../../Components/Fields/Interactive/StringInputField';

const TaxiFuelLine: React.FC = () => {
    const [taxiVal, setTaxiVal] = useState<number>(0.4);
    const [entered, setEntered] = useState<boolean>(false);

    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="TAXI" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <NumberInputField
                        min={0}
                        max={9.9}
                        value={taxiVal}
                        nullValue="0.0"
                        color={lineColors.cyan}
                        size={entered ? lineSizes.regular : lineSizes.small}
                        selectedCallback={(value) => {
                            setTaxiVal(value);
                            setEntered(true);
                        }}
                        lsk={lineSelectKeys.L1}
                    />
                )}
            />
        </LineHolder>
    );
};
/* Find a way to allow dual entry initially then only one or the other afterwards
also need to prevent clearing the entry once entered. Also need to compute auto-calc
 */
const ZeroFuelWeightLine : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value="ZFW/ZFWCG" color={lineColors.white} />} />
        <Line
            side={lineSides.right}
            value={(
                <InteractiveSplitLine
                    slashColor={lineColors.amber}
                    leftSide={(
                        <SplitNumberField
                            value={undefined}
                            nullValue="___._"
                            min={35}
                            max={80} // placeholder value, what can this be...?
                            color={lineColors.amber}
                            size={lineSizes.regular}
                            selectedCallback={() => {}}
                        />
                    )}
                    rightSide={(
                        <SplitNumberField
                            value={undefined}
                            nullValue="__._"
                            min={8}
                            max={50}
                            color={lineColors.amber}
                            size={lineSizes.regular}
                            selectedCallback={() => {}}
                        />
                    )}
                    lsk={lineSelectKeys.R1}
                />
            )}
        />
    </LineHolder>
);

// When we can retrieve trip info then it'll populate and dynamically change colors
const TripWeightLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value={'TRIP\xa0\xa0/TIME'} color={lineColors.white} />} />
        <SplitLine
            side={lineSides.left}
            slashColor={lineColors.white}
            leftSide={<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />}
            rightSide={(<Field value="----" size={lineSizes.regular} color={lineColors.white} />)}
        />
    </LineHolder>
);

const BlockWeightLine: React.FC = () => (
    <LineHolder>
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="BLOCK" color={lineColors.white} />} />
            <Line
                side={lineSides.right}
                value={(
                    <NumberInputField
                        min={0}
                        max={80}
                        value={undefined}
                        nullValue="__._"
                        color={lineColors.amber}
                        size={lineSizes.regular}
                        selectedCallback={() => {}}
                        lsk={lineSelectKeys.R2}
                    />
                )}
            />
        </LineHolder>
    </LineHolder>
);

/* Need some way to only allow percentage entry before ZFW/ZFWCG has been entered
Need to find a way to recalculate percentage or weight based on the entry of either or
Need to find a way to only allow the entry of one or the other but not both. */
const ReserveWeightLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="RTE RSV/%" color={lineColors.white} />} />
        <InteractiveSplitLine
            slashColor={lineColors.white}
            leftSide={(
                <SplitNumberField
                    value={undefined}
                    nullValue="---.-"
                    min={0.0}
                    max={100} // placeholder value, what can this be...?
                    color={lineColors.white}
                    size={lineSizes.regular}
                    selectedCallback={() => {}}
                />
            )}
            rightSide={(
                <SplitNumberField
                    value={undefined}
                    nullValue="5.0"
                    min={0}
                    max={15.0} // Need a way to dash results upon going beyond the maximum value, maybe in the callback?
                    color={lineColors.cyan}
                    size={lineSizes.regular}
                    selectedCallback={() => {}}
                />
            )}
            lsk={lineSelectKeys.L3}
        />
    </LineHolder>
);

const AlternateWeightLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value={'ALTN\xa0\xa0/TIME'} color={lineColors.white} />} />
        <InteractiveSplitLine
            slashColor={lineColors.white}
            leftSide={(
                <SplitNumberField
                    value={undefined}
                    nullValue="---.-"
                    min={0}
                    max={25} // Placeholder value, needs to be block fuel - trip fuel
                    color={lineColors.white}
                    size={lineSizes.regular}
                    selectedCallback={() => {}}
                />
            )}
            rightSide={<Field value="----" color={lineColors.white} size={lineSizes.regular} />}
            lsk={lineSelectKeys.L4}
        />
    </LineHolder>
);

const LwTwLine : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value={'TOW/\xa0\xa0\xa0\xa0LW'} color={lineColors.white} />} />
        <SplitLine
            slashColor={lineColors.white}
            leftSide={(<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            rightSide={(<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            side={lineSides.right}
        />
    </LineHolder>
);

/* Need to find a way to only allow entering one or the other but not both */
const FinalWeightCell : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value={'FINAL\xa0/TIME'} color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(
                <InteractiveSplitLine
                    slashColor={lineColors.white}
                    leftSide={(
                        <SplitNumberField
                            value={undefined}
                            nullValue="---.-"
                            min={0.0}
                            max={100} // placeholder value, what can this be...?
                            color={lineColors.white}
                            size={lineSizes.regular}
                            selectedCallback={() => {}}
                        />
                    )}
                    rightSide={(
                        <SplitNumberField
                            value={undefined}
                            nullValue="----"
                            min={0}
                            max={15.0} // Need a way to dash results upon going beyond the maximum value, maybe in the callback?
                            color={lineColors.white}
                            size={lineSizes.regular}
                            selectedCallback={() => {}}
                        />
                    )}
                    lsk={lineSelectKeys.L5}
                />
            )}
        />
    </LineHolder>
);

const TripWindLine : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value="TRIP WIND" color={lineColors.white} />} />
        <Line
            side={lineSides.right}
            value={(
                <StringInputField
                    value={undefined}
                    nullValue="HD000"
                    color={lineColors.cyan}
                    size={lineSizes.regular}
                    selectedCallback={() => {}}
                    lsk={lineSelectKeys.R5}
                    selectedValidation={() => true}
                />
            )}
        />
    </LineHolder>
);

const MinDestFOBLine : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="MIN DEST FOB" color={lineColors.white} />} />
        <Line
            side={lineSides.left}
            value={(
                <NumberInputField
                    value={undefined}
                    nullValue="---.-"
                    min={0}
                    max={80}
                    color={lineColors.white}
                    size={lineSizes.regular}
                    selectedCallback={() => {}}
                    lsk={lineSelectKeys.L6}
                />
            )}
        />
    </LineHolder>
);

const ExtraWeightLine : React.FC = () => (
    <LineHolder>
        <Line side={lineSides.right} value={<LabelField value={'TOW/\xa0\xa0\xa0\xa0LW'} color={lineColors.white} />} />
        <SplitLine
            slashColor={lineColors.white}
            side={lineSides.right}
            leftSide={(<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            rightSide={(<Field value="----" color={lineColors.white} size={lineSizes.regular} />)}
        />
    </LineHolder>
);

export const InitBPage: React.FC = () => {
    const [, , , setTitle] = useContext(RootContext);

    useEffect(() => {
        setTitle('INIT');
    }, []);

    return (
        <Content>
            <RowHolder index={1}>
                <TaxiFuelLine />
                <ZeroFuelWeightLine />
            </RowHolder>
            <RowHolder index={2}>
                <TripWeightLine />
                <BlockWeightLine />
            </RowHolder>
            <RowHolder index={3}>
                <ReserveWeightLine />
            </RowHolder>
            <RowHolder index={4}>
                <AlternateWeightLine />
                <LwTwLine />
            </RowHolder>
            <RowHolder index={5}>
                <FinalWeightCell />
                <TripWindLine />
            </RowHolder>
            <RowHolder index={6}>
                <MinDestFOBLine />
                <ExtraWeightLine />
            </RowHolder>
        </Content>
    );
};

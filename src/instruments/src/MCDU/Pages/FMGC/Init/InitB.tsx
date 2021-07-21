import React, { useEffect, useState } from 'react';

import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { SplitLine } from '../../../Components/Lines/SplitLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import InteractiveSplitLine from '../../../Components/Lines/InteractiveSplitLine';
import SplitNumberField from '../../../Components/Fields/Interactive/Split/SplitNumberField';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';

const TaxiFuelLine: React.FC = () => {
    const DEFAULT_TAXI_VAL = (0.4).toFixed(1);
    const [taxiVal, setTaxiVal] = useState<string>(DEFAULT_TAXI_VAL);
    const [entered, setEntered] = useState<boolean>(false);
    const setNewVal = (value: string | undefined) => {
        if (value === undefined) {
            setTaxiVal(DEFAULT_TAXI_VAL);
            setEntered(false);
        } else {
            setTaxiVal(value);
            setEntered(true);
        }
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="TAXI" color={lineColors.white} />
            <NumberInputField
                lineSide={lineSides.left}
                min={0}
                max={9.9}
                value={taxiVal}
                nullValue="0.0"
                color={lineColors.cyan}
                size={entered ? lineSizes.regular : lineSizes.small}
                selectedCallback={(value) => setNewVal(value)}
                lsk={LINESELECT_KEYS.L1}
            />
        </div>
    );
};
/* Find a way to allow dual entry initially then only one or the other afterwards
also need to prevent clearing the entry once entered. Also need to compute auto-calc
 */
const ZeroFuelWeightLine : React.FC = () => (
    <div className="line-holder-two">
        <LabelField lineSide={lineSides.right} value="ZFW/ZFWCG" color={lineColors.white} />

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
            lsk={LINESELECT_KEYS.R1}
        />
    </div>
);

// When we can retrieve trip info then it'll populate and dynamically change colors
const TripWeightLine: React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.left} value={'TRIP\xa0/TIME'} color={lineColors.white} />
        <SplitLine
            side={lineSides.left}
            slashColor={lineColors.white}
            leftSide={<Field lineSide={lineSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />}
            rightSide={(<Field lineSide={lineSides.right} value="----" size={lineSizes.regular} color={lineColors.white} />)}
        />
    </div>
);

const BlockWeightLine: React.FC = () => {
    const setNewVal = (value: string | undefined) => {
        if (value !== undefined) {
            console.log(`TODO new block fuel entered: ${value}`);
        } else {
            console.log('TODO clearing block fuel');
        }
    };
    return (
        <div>
            <div>
                <LabelField lineSide={lineSides.right} value="BLOCK" color={lineColors.white} />
                <NumberInputField
                    lineSide={lineSides.right}
                    min={0}
                    max={80}
                    value={undefined}
                    nullValue="__._"
                    color={lineColors.amber}
                    size={lineSizes.regular}
                    selectedCallback={(value) => setNewVal(value)}
                    lsk={LINESELECT_KEYS.R2}
                />
            </div>
        </div>
    );
};

/* Need some way to only allow percentage entry before ZFW/ZFWCG has been entered
Need to find a way to recalculate percentage or weight based on the entry of either or
Need to find a way to only allow the entry of one or the other but not both. */
const ReserveWeightLine: React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.left} value="RTE RSV/%" color={lineColors.white} />
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
            lsk={LINESELECT_KEYS.L3}
        />
    </div>
);

const AlternateWeightLine: React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.right} value={'ALTN\xa0/TIME'} color={lineColors.white} />
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
            rightSide={<Field lineSide={lineSides.left} value="----" color={lineColors.white} size={lineSizes.regular} />}
            lsk={LINESELECT_KEYS.L4}
        />
    </div>
);

const LwTwLine : React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.right} value={'TOW/\xa0\xa0\xa0LW'} color={lineColors.white} />
        <SplitLine
            slashColor={lineColors.white}
            leftSide={(<Field lineSide={lineSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            rightSide={(<Field lineSide={lineSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            side={lineSides.right}
        />
    </div>
);

/* Need to find a way to only allow entering one or the other but not both */
const FinalWeightCell : React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.left} value="FINAL/TIME" color={lineColors.white} />

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
            lsk={LINESELECT_KEYS.L5}
        />
    </div>
);

const TripWindLine : React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.right} value="TRIP WIND" color={lineColors.white} />
        <StringInputField
            lineSide={lineSides.right}
            value={undefined}
            nullValue="HD000"
            color={lineColors.cyan}
            size={lineSizes.regular}
            selectedCallback={() => {}}
            lsk={LINESELECT_KEYS.R5}
            selectedValidation={() => true}
        />
    </div>
);

const MinDestFOBLine : React.FC = () => {
    const setNewVal = (value: string | undefined) => {
        if (value !== undefined) {
            console.log(`TODO new min dest FOB entered: ${value}`);
        } else {
            console.log('TODO clearing min dest fob');
        }
    };
    return (
        <div>
            <LabelField lineSide={lineSides.left} value="MIN DEST FOB" color={lineColors.white} />
            <NumberInputField
                lineSide={lineSides.left}
                value={undefined}
                nullValue="---.-"
                min={0}
                max={80}
                color={lineColors.white}
                size={lineSizes.regular}
                selectedCallback={(value) => setNewVal(value)}
                lsk={LINESELECT_KEYS.L6}
            />
        </div>
    );
};

const ExtraWeightLine : React.FC = () => (
    <div>
        <LabelField lineSide={lineSides.right} value="EXTRA/TIME" color={lineColors.white} />
        <SplitLine
            slashColor={lineColors.white}
            side={lineSides.right}
            leftSide={(<Field lineSide={lineSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />)}
            rightSide={(<Field lineSide={lineSides.right} value="----" color={lineColors.white} size={lineSizes.regular} />)}
        />
    </div>
);
type InitBPageProps = {
    setTitlebarText: Function
}
export const InitBPage: React.FC<InitBPageProps> = ({ setTitlebarText }) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <>
            <div className="row-holder">
                <TaxiFuelLine />
                <ZeroFuelWeightLine />
            </div>
            <div className="row-holder">
                <TripWeightLine />
                <BlockWeightLine />
            </div>
            <div className="row-holder">
                <ReserveWeightLine />
            </div>
            <div className="row-holder">
                <AlternateWeightLine />
                <LwTwLine />
            </div>
            <div className="row-holder">
                <FinalWeightCell />
                <TripWindLine />
            </div>
            <div className="row-holder">
                <MinDestFOBLine />
                <ExtraWeightLine />
            </div>
        </>
    );
};

export default InitBPage;

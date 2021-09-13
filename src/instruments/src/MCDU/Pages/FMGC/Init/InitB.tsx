import React, { useEffect, useState } from 'react';

import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { mcduState } from '../../../redux/reducers/mcduReducer';
import { scratchpadState } from '../../../redux/reducers/scratchpadReducer';
import SplitField from '../../../Components/Fields/NonInteractive/Split/SplitField';
import InteractiveSplitField, { fieldProperties } from '../../../Components/Fields/Interactive/InteractiveSplitField';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';
import { ZfwLine } from '../Fuel/FuelPred';

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

// When we can retrieve trip info then it'll populate and dynamically change colors
const TripWeightLine: React.FC = () => {
    const tripProperties: fieldProperties = {
        lValue: '---.-',
        lSize: lineSizes.regular,
        lColour: lineColors.white,
        rValue: '----',
        rSize: lineSizes.regular,
        rColour: lineColors.white,
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value={'TRIP\xa0/TIME'} color={lineColors.white} />
            <SplitField
                side={lineSides.left}
                slashColor={lineColors.white}
                properties={tripProperties}
            />
        </div>
    );
};

const BlockWeightLine: React.FC = () => {
    const setNewVal = (value: string | undefined) => {
        if (value !== undefined) {
            console.log(`TODO new block fuel entered: ${value}`);
        } else {
            console.log('TODO clearing block fuel');
        }
    };
    return (
        <div className="line-holder-two">
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
    );
};

const ReserveWeightLine: React.FC = () => {
    const reserveProperties: fieldProperties = {
        lValue: '---.-',
        lColour: lineColors.white,
        lSize: lineSizes.regular,
        rValue: '5.0',
        rColour: lineColors.cyan,
        rSize: lineSizes.regular,
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="RTE RSV/%" color={lineColors.white} />
            <InteractiveSplitField
                properties={reserveProperties}
                side={lineSides.left}
                slashColor={lineColors.white}
                lsk={LINESELECT_KEYS.L3}
                selectedCallback={() => {}}
                selectedValidation={() => true}
            />
        </div>
    );
};

const AlternateWeightLine: React.FC = () => {
    const alternateProperties: fieldProperties = {
        lValue: '---.-',
        lColour: lineColors.white,
        lSize: lineSizes.regular,
        rValue: '----',
        rColour: lineColors.white,
        rSize: lineSizes.regular,
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value={'ALTN\xa0/TIME'} color={lineColors.white} />
            <InteractiveSplitField
                properties={alternateProperties}
                side={lineSides.left}
                slashColor={lineColors.white}
                lsk={LINESELECT_KEYS.L4}
                selectedCallback={() => {}}
                selectedValidation={() => true}
            />
        </div>
    );
};

const LwTwLine : React.FC = () => {
    const lwTwProperties: fieldProperties = {
        lValue: '---.-',
        lSize: lineSizes.regular,
        lColour: lineColors.white,
        rValue: '---.-',
        rSize: lineSizes.regular,
        rColour: lineColors.white,
    };
    return (
        <div className="line-holder-two">
            <LabelField lineSide={lineSides.right} value={'TOW/\xa0\xa0\xa0LW'} color={lineColors.white} />
            <SplitField
                side={lineSides.right}
                slashColor={lineColors.white}
                properties={lwTwProperties}
            />
        </div>
    );
};

/* Need to find a way to only allow entering one or the other but not both */
const FinalWeightCell : React.FC = () => {
    const alternateProperties: fieldProperties = {
        lValue: '---.-',
        lColour: lineColors.white,
        lSize: lineSizes.regular,
        rValue: '----',
        rColour: lineColors.white,
        rSize: lineSizes.regular,
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="FINAL/TIME" color={lineColors.white} />
            <InteractiveSplitField
                properties={alternateProperties}
                side={lineSides.left}
                slashColor={lineColors.white}
                lsk={LINESELECT_KEYS.L5}
                selectedCallback={() => {}}
                selectedValidation={() => true}
            />
        </div>
    );
};

const TripWindLine : React.FC = () => (
    <div className="line-holder-two">
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
        <div className="line-holder-one">
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

const ExtraWeightLine : React.FC = () => {
    const extraWeightProperties: fieldProperties = {
        lValue: '---.-',
        lColour: lineColors.white,
        lSize: lineSizes.regular,
        rValue: '----',
        rColour: lineColors.white,
        rSize: lineSizes.regular,
    };
    return (
        <div className="line-holder-two">
            <LabelField lineSide={lineSides.right} value="EXTRA/TIME" color={lineColors.white} />
            <SplitField
                side={lineSides.right}
                slashColor={lineColors.white}
                properties={extraWeightProperties}
            />
        </div>
    );
};
type InitBPageProps = {
    mcduData: mcduState,
    scratchpad: scratchpadState,
    setTitlebarText: (msg: string) => void,
    addScratchpadMessage: (msg: ScratchpadMessage) => void,
    setScratchpad: (msg: string) => void,
    setZFW: (msg: number | undefined) => void,
    setZFWCG: (msg: number | undefined) => void,
    setZFWCGEntered: (entered: boolean) => void
}
export const InitBPage: React.FC<InitBPageProps> = ({
    scratchpad,
    mcduData,
    setTitlebarText,
    addScratchpadMessage,
    setScratchpad,
    setZFW,
    setZFWCG,
    setZFWCGEntered,
}) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <>
            <div className="row-holder">
                <TaxiFuelLine />
                <ZfwLine
                    lsk={LINESELECT_KEYS.R1}
                    addMessage={addScratchpadMessage}
                    setScratchpad={setScratchpad}
                    fmgcZFW={mcduData.zfw}
                    setFMGCZFW={setZFW}
                    fmgcZFWCG={mcduData.zfwCG}
                    setFMGCZFWCG={setZFWCG}
                    scratchpad={scratchpad}
                    zeroFuelWeightZFWCGEntered={mcduData.zfwCGEntered}
                    setZeroFuelWeightZFWCGEntered={setZFWCGEntered}
                />
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

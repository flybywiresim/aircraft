import React, { useEffect, useState } from 'react';

import { useSimVar } from '@instruments/common/simVars';

import { NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { RowHolder } from '../../../Components/Holders/RowHolder';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import InteractiveSplitField, { fieldProperties } from '../../../Components/Fields/Interactive/InteractiveSplitField';
import { scratchpadState } from '../../../redux/reducers/scratchpadReducer';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import SplitField from '../../../Components/Fields/NonInteractive/SplitField';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { LineHolder } from '../../../Components/Holders/LineHolder';
import { Field, fieldSides } from '../../../Components/Fields/NonInteractive/Field';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';

import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';
import * as mcduActions from '../../../redux/actions/mcduActionCreators';

/**
 * @todo retrieve Dest ICAO when CFPM ready
 */
const DestICAOLine: React.FC = () => (
    <LineHolder columnPosition={1}>
        <LabelField lineSide={lineSides.left} value="AT" color={lineColors.white} />
        <Field lineSide={lineSides.left} textSide={fieldSides.left} value="NONE" color={lineColors.green} size={lineSizes.regular} />
    </LineHolder>
);

/**
 * @todo retrieve Dest UTC when CFPM ready
 */
const DestTimeLine: React.FC = () => (
    <LineHolder columnPosition={2}>
        <LabelField lineSide={lineSides.center} value="UTC" color={lineColors.white} />
        <Field lineSide={lineSides.center} value="----" color={lineColors.white} size={lineSizes.regular} />
    </LineHolder>
);

/**
 * @todo retrieve Dest EFOB when CFPM ready
 */
const DestEFOBLine: React.FC = () => (
    <LineHolder columnPosition={3}>
        <LabelField lineSide={lineSides.right} value="EFOB" color={lineColors.white} />
        <Field lineSide={lineSides.right} textSide={fieldSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />
    </LineHolder>
);

/**
 * @todo retrieve Dest ICAO when CFPM ready
 */
const AltICAOLine: React.FC = () => (
    <LineHolder columnPosition={1}>
        <EmptyLine />
        <Field lineSide={lineSides.left} value="NONE" color={lineColors.green} size={lineSizes.regular} />
    </LineHolder>
);

/**
 * @todo retrieve Dest UTC when CFPM ready
 */
const AltTimeLine: React.FC = () => (
    <LineHolder columnPosition={2}>
        <EmptyLine />
        <Field lineSide={lineSides.center} value="----" color={lineColors.white} size={lineSizes.regular} />
    </LineHolder>
);

/**
 * @todo retrieve Dest EFOB when CFPM ready
 */
const AltEFOBLine: React.FC = () => (
    <LineHolder columnPosition={3}>
        <EmptyLine />
        <Field lineSide={lineSides.center} textSide={fieldSides.right} value="---.-" color={lineColors.white} size={lineSizes.regular} />
    </LineHolder>
);

const RteRsvLine: React.FC = () => {
    const [rteRsvWeight] = useState();
    const [rteRsvPercent] = useState();
    const properties: fieldProperties = {
        lValue: rteRsvWeight, // Temp until FMC
        lNullValue: '---.-',
        lColour: rteRsvWeight ? lineColors.green : lineColors.white,
        lSize: lineSizes.regular,
        rValue: rteRsvPercent, // Temp until FMC
        rNullValue: '--.-',
        rColour: lineColors.inop,
        rSize: lineSizes.regular,
    };
    return (
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="RTE RSV/ %" color={lineColors.white} />
            <SplitField
                side={lineSides.left}
                slashColor={rteRsvWeight ? lineColors.green : lineColors.white}
                properties={properties}
            />
        </LineHolder>
    );
};

type zfwLineProps = {
    fmgcZFW: number | undefined,
    setFMGCZFW: React.Dispatch<React.SetStateAction<number | undefined>>
    fmgcZFWCG: number | undefined,
    setFMGCZFWCG: React.Dispatch<React.SetStateAction<number | undefined>>
    zeroFuelWeightZFWCGEntered: Boolean,
    setZeroFuelWeightZFWCGEntered: React.Dispatch<React.SetStateAction<boolean>>,
    lsk: LINESELECT_KEYS,
    // Redux
    setScratchpad: (msg: any) => any
    addMessage: (msg: ScratchpadMessage) => any
    scratchpad: scratchpadState
}
export const ZfwLine: React.FC<zfwLineProps> = (
    {
        zeroFuelWeightZFWCGEntered,
        setZeroFuelWeightZFWCGEntered,
        scratchpad,
        addMessage,
        setScratchpad,
        fmgcZFW,
        setFMGCZFW,
        fmgcZFWCG,
        setFMGCZFWCG,
        lsk,
    },
) => {
    // TODO Move to util?
    const [fuelQuantity] = useSimVar('FUEL TOTAL QUANTITY', 'gallons');
    const [fuelWeight] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms');
    const [totalWeight] = useSimVar('TOTAL WEIGHT', 'kilograms');
    const [calcZFWCG] = useSimVar('CG PERCENT', 'percent');
    const blockFuel = fuelQuantity * fuelWeight / 1000;
    const calcZFW = (totalWeight / 1000) - blockFuel;

    const properties: fieldProperties = {
        lValue: fmgcZFW ? fmgcZFW.toFixed(1) : undefined,
        // lSide: fieldSides.left,
        lNullValue: '___._',
        lColour: fmgcZFW === undefined ? lineColors.amber : lineColors.cyan,
        lSize: lineSizes.regular,
        rValue: fmgcZFWCG ? `${fmgcZFWCG.toFixed(1)} ` : undefined,
        // rSide: fieldSides.right,
        rNullValue: '__._ ',
        rColour: fmgcZFW === undefined ? lineColors.amber : lineColors.cyan,
        rSize: lineSizes.regular,
    };

    // TODO make this a util?
    const isZFWInRange = (zfw: number) => zfw >= 35.0 && zfw <= 80.0;
    const isZFWCGInRange = (zfwcg: number) => (zfwcg >= 8.0 && zfwcg <= 50.0);

    const validateEntry = (lVal: string, rVal: string) => {
        const newZFW = parseFloat(lVal);
        const newZFWCG = parseFloat(rVal);

        // If both sides contain a number (e.g 23.0/24.0)
        if (Number.isFinite(newZFW) && Number.isFinite(newZFWCG)) {
            if (isZFWInRange(newZFW) && isZFWCGInRange(newZFWCG)) {
                return true;
            }
            addMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        // If you've reached this point and not entered both zfw/zfwCG then, false
        if (!zeroFuelWeightZFWCGEntered) {
            addMessage(NXSystemMessages.notAllowed);
            return false;
        }
        if (Number.isFinite(newZFW)) {
            if (isZFWInRange(newZFW)) {
                return true;
            }
            addMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        // If right side contains a number (e.g /23.0)
        if (Number.isFinite(newZFWCG)) {
            if (isZFWCGInRange(newZFWCG)) {
                return true;
            }
            addMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        addMessage(NXSystemMessages.entryOutOfRange);
        return false;
    };

    const updateFMGC = (lVal: string, rVal: string) => {
        if (scratchpad.currentMessage === 'CLR') {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            if (lVal !== '' && rVal !== '' && rVal !== undefined) {
                setZeroFuelWeightZFWCGEntered(true);
                setFMGCZFW(parseFloat(lVal));
                setFMGCZFWCG(parseFloat(rVal));
            }
            if (lVal !== '') {
                setFMGCZFW(parseFloat(lVal));
            }
            if (rVal !== '' && rVal !== undefined) {
                setFMGCZFWCG(parseFloat(rVal));
            }
        }
    };

    return (
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="ZFW/ZFWCG" color={lineColors.white} />
            <InteractiveSplitField
                side={lineSides.right}
                slashColor={fmgcZFW === undefined ? lineColors.amber : lineColors.cyan}
                lsk={lsk}
                properties={properties}
                selectedValidation={(lVal, rVal) => validateEntry(lVal, rVal)}
                selectedCallback={(lVal, rVal) => updateFMGC(lVal, rVal)}
                autoCalc={() => {
                    setScratchpad(`${calcZFW.toFixed(1)}/${calcZFWCG.toFixed(1)}`);
                }}
            />
        </LineHolder>
    );
};

/*
 * @todo set the max alternate fuel to block - trip fuel
 * @todo when connected to FMGC check if altn value has been enetered or not
 */
const AltnLine: React.FC = () => {
    const [altnWeight] = useState<string>('0.0');
    const [altnTime] = useState('0000');

    const properties: fieldProperties = {
        lValue: altnWeight ? parseInt(altnWeight).toFixed(1) : undefined,
        lNullValue: '---.-',
        lColour: altnWeight ? lineColors.cyan : lineColors.white,
        lSize: lineSizes.small,
        rValue: altnTime ? `${altnTime.padEnd(4, '0')} ` : undefined,
        rNullValue: '0000 ',
        rColour: lineColors.green,
        rSize: lineSizes.small,
    };
    return (
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.right} value="ALTN /TIME" color={lineColors.white} />
            <InteractiveSplitField
                lsk={LINESELECT_KEYS.L4}
                side={lineSides.left}
                slashColor={lineColors.green}
                properties={properties}
                selectedValidation={() => true}
                selectedCallback={() => true}
            />
        </LineHolder>
    );
};

type fobLineProps = {
    zfwEntered: boolean,
}
/**
 * @todo Make this interactive
 */
const FobLine: React.FC<fobLineProps> = ({ zfwEntered }) => {
    const [fob, _] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'POUND');
    const fobWeight = ((fob * 0.453592) / 1000).toFixed(1);
    const fobOther = zfwEntered ? '    FF' : '----';
    const color = zfwEntered ? lineColors.cyan : lineColors.white;

    const properties: fieldProperties = {
        lValue: fobWeight ?? undefined,
        lNullValue: '---.-',
        lColour: fobWeight ? lineColors.cyan : lineColors.white,
        lSize: lineSizes.small,
        rValue: fobOther ? `${fobOther.padEnd(4, '0')} ` : undefined,
        rNullValue: '----',
        rColour: fobOther ? lineColors.cyan : lineColors.white,
        rSize: lineSizes.small, // Adjust this if the value has been entered and not generated
    };

    return (
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="FOB    " color={lineColors.white} />
            <SplitField
                side={lineSides.right}
                slashColor={color}
                properties={properties}
            />
        </LineHolder>
    );
};

const FinalLine: React.FC = () => {
    const [fuelWeight] = useState<string>();
    const [fuelTime] = useState<string>();

    const properties: fieldProperties = {
        lValue: fuelWeight ? parseInt(fuelWeight).toFixed(1) : undefined,
        lNullValue: '---.-',
        lColour: fuelWeight ? lineColors.cyan : lineColors.white,
        lSize: lineSizes.small,
        rValue: fuelTime ? `${fuelTime.padEnd(4, '0')} ` : undefined,
        rNullValue: '----',
        rColour: fuelTime ? lineColors.cyan : lineColors.white,
        rSize: lineSizes.small, // Adjust this if the value has been entered and not generated
    };

    return (
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.right} value="FINAL/TIME" color={lineColors.white} />
            <InteractiveSplitField
                lsk={LINESELECT_KEYS.L5}
                slashColor={lineColors.white}
                properties={properties}
                side={lineSides.left}
                selectedValidation={() => true}
                selectedCallback={() => true}
            />
        </LineHolder>
    );
};
type gWCGLineProps = {
    zfwEntered: boolean,
}
const GWCGLine: React.FC<gWCGLineProps> = ({ zfwEntered: zfw }) => {
    const [gw, _] = useSimVar('', 'Pounds');
    const [cg, __] = useSimVar('', 'Percent over 100');
    const gwVal = zfw ? ((gw * 0.45359237) / 1000).toFixed(1) : '---.-';
    const cgVal = zfw ? (cg * 100).toFixed(1) : '--.-';
    const color = zfw ? lineColors.green : lineColors.white;

    const properties: fieldProperties = {
        lValue: gwVal,
        lNullValue: '---.-',
        lColour: color,
        lSize: lineSizes.small,
        rValue: cgVal ? ` ${cgVal}` : undefined,
        rNullValue: '--.-',
        rColour: color,
        rSize: lineSizes.small, // Adjust this if the value has been entered and not generated
    };
    return (
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="GW    CG" color={lineColors.white} />
            <SplitField
                side={lineSides.right}
                slashColor={lineColors.white}
                properties={properties}
            />
        </LineHolder>
    );
};

type minDestFobLineProps = {
    zfwEntered: boolean
    // Redux
    clearScratchpad: () => any
}
/**
 * @todo adjust size when the value is computed or entered (needs FMGC)
 */
const MinDestFobLine: React.FC<minDestFobLineProps> = ({ zfwEntered }) => {
    const [minDestFob, setMinDestFob] = useState<string>();
    const [valEntered, setValEntered] = useState(false);
    const color = minDestFob ? lineColors.white : lineColors.cyan;
    const size = valEntered ? lineSizes.regular : lineSizes.small;

    return (
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="MIN DEST FOB" color={lineColors.white} />
            <NumberInputField
                lineSide={lineSides.right}
                fieldSide={fieldSides.left}
                lsk={LINESELECT_KEYS.L6}
                min={0}
                max={80.0}
                nullValue="---.-"
                defaultValue={minDestFob}
                color={color}
                size={size}
                prevEntered={zfwEntered}
                selectedCallback={((value) => {
                    if (value === undefined) {
                        // TODO when FMGC is coupled retrieve the computed value instead
                        setMinDestFob(undefined);
                        setValEntered(false);
                    } else {
                        setMinDestFob(value);
                        setValEntered(true);
                    }
                })}
            />
        </LineHolder>
    );
};

type extraLineProps = {
    zfwEntered: boolean
}
const ExtraLine: React.FC<extraLineProps> = ({ zfwEntered }) => {
    const extraFuel = zfwEntered ? '    0.0' : '---.-';
    const extraTime = zfwEntered ? '0000' : '---.-';
    const color = zfwEntered ? lineColors.green : lineColors.white;

    const properties: fieldProperties = {
        lValue: extraFuel,
        lNullValue: '---.-',
        lColour: color,
        lSize: lineSizes.small,
        rValue: extraTime,
        rNullValue: '---.-',
        rColour: color,
        rSize: lineSizes.small, // Adjust this if the value has been entered and not generated
    };

    return (
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="EXTRA TIME" color={lineColors.white} />
            <SplitField
                side={lineSides.right}
                slashColor={lineColors.white}
                properties={properties}
            />
        </LineHolder>
    );
};

const FuelPredPage: React.FC = () => {
    // TODO connect this up with the FMGC when it's avail
    const dispatch = useMCDUDispatch();

    // REDUX
    const mcduData = useMCDUSelector((state) => state.mcduData);
    const setZFW = (msg: number | undefined) => {
        dispatch(mcduActions.setZFW(msg));
    };
    const setZFWCG = (msg: number | undefined) => {
        dispatch(mcduActions.setZFWCG(msg));
    };
    const setZFWCGEntered = (entered: boolean) => {
        dispatch(mcduActions.setZFWCGEntered(entered));
    };

    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const setScratchpad = (msg: string) => {
        dispatch(scratchpadActions.setScratchpad(msg));
    };

    const addScratchpadMessage = (msg: ScratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };
    const clearScratchpad = () => {
        dispatch(scratchpadActions.clearScratchpad());
    };

    const setTitlebarText = (msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };

    const setTitlebarColor = (color : lineColors) => {
        dispatch(titlebarActions.setTitleBarColor(color));
    };

    const setTitlebarSide = (side : lineSides) => {
        dispatch(titlebarActions.setTitleBarSide(side));
    };

    useEffect(() => {
        setTitlebarText('FUEL PRED');
        setTitlebarColor(lineColors.white);
        setTitlebarSide(lineSides.center);
    }, []);
    return (
        <>
            <RowHolder columns={3}>
                <DestICAOLine />
                <DestTimeLine />
                <DestEFOBLine />
            </RowHolder>
            <RowHolder columns={3}>
                <AltICAOLine />
                <AltTimeLine />
                <AltEFOBLine />
            </RowHolder>
            <RowHolder columns={2}>
                <RteRsvLine />
                <ZfwLine
                    lsk={LINESELECT_KEYS.R3}
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
            </RowHolder>
            <RowHolder columns={2}>
                <AltnLine />
                <FobLine zfwEntered={mcduData.zfwCGEntered} />
            </RowHolder>
            <RowHolder columns={2}>
                <FinalLine />
                <GWCGLine zfwEntered={mcduData.zfwCGEntered} />
            </RowHolder>
            <RowHolder columns={2}>
                <MinDestFobLine clearScratchpad={clearScratchpad} zfwEntered={mcduData.zfwCGEntered} />
                <ExtraLine zfwEntered={mcduData.zfwCGEntered} />
            </RowHolder>
        </>
    );
};
export default FuelPredPage;

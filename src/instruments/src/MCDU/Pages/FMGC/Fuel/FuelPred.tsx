import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { useSimVar } from '@instruments/common/simVars';

import { Content } from 'instruments/src/MCDU/Components/Content';
import { RowHolder } from 'instruments/src/MCDU/Components/RowHolder';
import { Line, lineColors, lineSides, lineSizes } from 'instruments/src/MCDU/Components/Lines/Line';
import { LineHolder } from 'instruments/src/MCDU/Components/LineHolder';
import { LabelField } from 'instruments/src/MCDU/Components/Fields/NonInteractive/LabelField';
import { Field, fieldSides } from 'instruments/src/MCDU/Components/Fields/NonInteractive/Field';
import { EmptyLine } from 'instruments/src/MCDU/Components/Lines/EmptyLine';
import { SplitLine } from 'instruments/src/MCDU/Components/Lines/SplitLine';
import InteractiveSplitLine from 'instruments/src/MCDU/Components/Lines/InteractiveSplitLine';
import SplitNumberField from 'instruments/src/MCDU/Components/Fields/Interactive/Split/SplitNumberField';
import { LINESELECT_KEYS } from 'instruments/src/MCDU/Components/Buttons';

import { scratchpadMessage } from 'instruments/src/MCDU/redux/reducers/scratchpadReducer';
import NumberInputField from 'instruments/src/MCDU/Components/Fields/Interactive/NumberInputField';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

/**
 * @todo retrieve Dest ICAO when CFPM ready
 */
const DestICAOLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="AT" color={lineColors.white} />} />
        <Line side={lineSides.left} value={<Field value="NONE" color={lineColors.green} size={lineSizes.regular} />} />
    </LineHolder>
);

/**
 * @todo retrieve Dest UTC when CFPM ready
 */
const DestTimeLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="UTC" color={lineColors.white} />} />
        <Line side={lineSides.left} value={<Field value="----" color={lineColors.white} size={lineSizes.regular} />} />
    </LineHolder>
);

/**
 * @todo retrieve Dest EFOB when CFPM ready
 */
const DestEFOBLine: React.FC = () => (
    <LineHolder>
        <Line side={lineSides.left} value={<LabelField value="EFOB" color={lineColors.white} side={fieldSides.right} />} />
        <Line side={lineSides.left} value={<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />} />
    </LineHolder>
);

/**
 * @todo retrieve Dest ICAO when CFPM ready
 */
const AltICAOLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line side={lineSides.left} value={<Field value="NONE" color={lineColors.green} size={lineSizes.regular} />} />
    </LineHolder>
);

/**
 * @todo retrieve Dest UTC when CFPM ready
 */
const AltTimeLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line side={lineSides.left} value={<Field value="---" color={lineColors.white} size={lineSizes.regular} />} />
    </LineHolder>
);

/**
 * @todo retrieve Dest EFOB when CFPM ready
 */
const AltEFOBLine: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line side={lineSides.left} value={<Field value="---.-" color={lineColors.white} size={lineSizes.regular} />} />
    </LineHolder>
);

const RteRsvLine: React.FC = () => {
    const rteRsvWeight = '---.-';
    const rteRsvPercent = '---.-';
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="RTE RSV/ %" color={lineColors.white} />} />
            <SplitLine
                side={lineSides.left}
                slashColor={lineColors.white}
                leftSide={<Field value={rteRsvWeight} color={lineColors.white} size={lineSizes.small} />}
                rightSide={<Field value={rteRsvPercent} color={lineColors.white} size={lineSizes.small} />}
            />
        </LineHolder>
    );
};

type zfwLineProps = {
    zfw: number | undefined,
    setZFW: React.Dispatch<React.SetStateAction<number | undefined>>,
    zfwCG: number | undefined,
    setZFWCG: React.Dispatch<React.SetStateAction<number | undefined>>,
    // Redux
    setScratchpad: (msg) => any
    clearScratchpad: () => any
}
const ZfwLine: React.FC<zfwLineProps> = ({ setScratchpad, zfw, setZFW, zfwCG, setZFWCG, clearScratchpad }) => {
    const autoCalculateZFWZFWCG = () => {
        const [fuelQuantity, _] = useSimVar('FUEL TOTAL QUANTITY', 'gallons');
        const [fuelWeight, __] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms');
        const [totalWeight, ___] = useSimVar('TOTAL WEIGHT', 'kilograms');
        const [calcZFWCG, ____] = useSimVar('CG PERCENT', 'percent');
        const blockFuel = fuelQuantity * fuelWeight / 1000;
        const tempZFW = (totalWeight / 1000) - blockFuel;
        setScratchpad(`${tempZFW.toFixed(1)}/${calcZFWCG.toFixed(1)}`);
    };

    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="ZFW/ZFWCG" color={lineColors.white} />} />
            <InteractiveSplitLine
                lsk={LINESELECT_KEYS.R3}
                slashColor={lineColors.white}
                autoCalc={() => {
                    autoCalculateZFWZFWCG();
                }}
                leftSide={(
                    <SplitNumberField
                        side={fieldSides.right}
                        value={zfw?.toString(1)}
                        nullValue="___._"
                        min={35.0}
                        max={80.0}
                        color={zfw === undefined ? lineColors.amber : lineColors.cyan}
                        size={lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setZFW(undefined);
                            } else {
                                setZFW(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
                rightSide={(
                    <SplitNumberField
                        side={fieldSides.right}
                        value={zfwCG?.toFixed(1)}
                        nullValue="__._"
                        min={8.0}
                        max={50.0}
                        color={zfwCG === undefined ? lineColors.amber : lineColors.cyan}
                        size={lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setZFWCG(undefined);
                            } else {
                                setZFWCG(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
            />
        </LineHolder>
    );
};

type altneLineProps = {
    clearScratchpad: () => any,
}
/**
 * @todo set the max alternate fuel to block - trip fuel
 * @todo when connected to FMGC check if altn value has been enetered or not
 */
const AltnLine: React.FC<altneLineProps> = ({ clearScratchpad }) => {
    const [altnWeight, setAltnWeight] = useState<number>();
    const altnTime = altnWeight === undefined ? '----' : '0000';
    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="ALTN /TIME" color={lineColors.white} />} />
            <InteractiveSplitLine
                lsk={LINESELECT_KEYS.L4}
                slashColor={lineColors.white}
                leftSide={(
                    <SplitNumberField
                        nullValue="---.-"
                        min={0}
                        max={10}
                        value={altnWeight}
                        color={lineColors.white}
                        size={altnWeight === undefined ? lineSizes.small : lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setAltnWeight(undefined);
                            } else {
                                setAltnWeight(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
                rightSide={<Field value={altnTime} color={altnWeight === undefined ? lineColors.white : lineColors.green} size={lineSizes.small} />}
            />
        </LineHolder>
    );
};

type fobLineProps = {
    zfw: number | undefined,
}
/**
 * @todo Make this interactive
 */
const FobLine: React.FC<fobLineProps> = ({ zfw }) => {
    const zfwEntered = zfw !== undefined;
    const [fob, _] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'POUND');
    const fobWeight = zfwEntered ? ((fob * 0.453592) / 1000).toFixed(1) : '---.-';
    const fobOther = zfwEntered ? 'FF' : '----';
    const color = zfwEntered ? lineColors.cyan : lineColors.white;

    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="FOB" color={lineColors.white} side={fieldSides.left} />} />
            <SplitLine
                side={lineSides.right}
                slashColor={lineColors.cyan}
                leftSide={<Field value={fobWeight} color={color} size={lineSizes.small} />}
                rightSide={<Field value={fobOther} color={color} size={lineSizes.small} />}
            />
        </LineHolder>
    );
};

type finalLineProps = {
    // Redux
    clearScratchpad: () => any
}
const FinalLine: React.FC<finalLineProps> = ({ clearScratchpad }) => {
    const [fuelWeight, setFuelWeight] = useState<number>();
    const [fuelTime, setFuelTime] = useState<number>();

    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="FINAL/TIME" color={lineColors.white} />} />
            <InteractiveSplitLine
                lsk={LINESELECT_KEYS.L5}
                slashColor={lineColors.white}
                leftSide={(
                    <SplitNumberField
                        side={fieldSides.right}
                        value={fuelWeight?.toString(1)}
                        nullValue="---.-"
                        min={35.0}
                        max={80.0}
                        color={fuelWeight === undefined ? lineColors.amber : lineColors.cyan}
                        size={fuelWeight === undefined ? lineSizes.small : lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setFuelWeight(undefined);
                            } else {
                                setFuelWeight(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
                rightSide={(
                    <SplitNumberField
                        side={fieldSides.right}
                        value={fuelTime?.toFixed(0)}
                        nullValue="----"
                        min={0}
                        max={9999}
                        color={fuelTime === undefined ? lineColors.white : lineColors.cyan}
                        size={lineSizes.regular}
                        selectedCallback={(value) => {
                            if (value === undefined) {
                                setFuelTime(undefined);
                            } else {
                                setFuelTime(+value);
                            }
                            clearScratchpad();
                        }}
                    />
                )}
            />
        </LineHolder>
    );
};
type gWCGLineProps = {
    zfw: undefined | number,
}
const GWCGLine: React.FC<gWCGLineProps> = ({ zfw }) => {
    const [gw, _] = useSimVar('', 'Pounds');
    const [cg, __] = useSimVar('', 'Percent over 100');
    const zfwEntered = zfw !== undefined;
    const gwVal = zfwEntered ? ((gw * 0.45359237) / 1000).toFixed(1) : '---.-';
    const cgVal = zfwEntered ? (cg * 100).toFixed(1) : '--.-';
    const color = zfwEntered ? lineColors.green : lineColors.white;

    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="GW/    CG" color={lineColors.white} />} />
            <SplitLine
                side={lineSides.right}
                slashColor={lineColors.white}
                leftSide={<Field value={gwVal} color={color} size={lineSizes.small} />}
                rightSide={<Field value={`    ${cgVal}`} color={color} size={lineSizes.small} />}
            />
        </LineHolder>
    );
};

type minDestFobLineProps = {
    // Redux
    clearScratchpad: () => any
}
/**
 * @todo adjust size when the value is computed or entered (needs FMGC)
 */
const MinDestFobLine: React.FC<minDestFobLineProps> = ({ clearScratchpad }) => {
    const [minDestFob, setMinDestFob] = useState<number>();
    const color = minDestFob === undefined ? lineColors.white : lineColors.cyan;
    const size = minDestFob === undefined ? lineSizes.small : lineSizes.regular;

    return (
        <LineHolder>
            <Line side={lineSides.left} value={<LabelField value="MIN DEST FOB" color={lineColors.white} />} />
            <Line
                side={lineSides.left}
                value={(
                    <NumberInputField
                        lsk={LINESELECT_KEYS.L6}
                        min={0}
                        max={80.0}
                        nullValue="---.-"
                        value={minDestFob}
                        color={color}
                        size={size}
                        selectedCallback={((value) => {
                            if (value === undefined) {
                                setMinDestFob(undefined);
                            } else {
                                setMinDestFob(value);
                            }
                            clearScratchpad();
                        })}
                    />
                )}
            />
        </LineHolder>
    );
};

type extraLineProps = {
    zfw: undefined | number,
}
const ExtraLine: React.FC<extraLineProps> = ({ zfw }) => {
    const zfwEntered = zfw !== undefined;
    const extraFuel = zfwEntered ? '000.0' : '---.-';
    const extraTime = zfwEntered ? '0000' : '---.-';
    const color = zfwEntered ? lineColors.green : lineColors.white;

    return (
        <LineHolder>
            <Line side={lineSides.right} value={<LabelField value="GW/    CG" color={lineColors.white} />} />
            <SplitLine
                side={lineSides.right}
                slashColor={lineColors.white}
                leftSide={<Field value={extraFuel} color={color} size={lineSizes.small} />}
                rightSide={<Field value={extraTime} color={color} size={lineSizes.small} />}
            />
        </LineHolder>
    );
};

type fuelPredProps = {
    setTitlebar: (text: string) => any
    clearScratchpad: () => any
    addScratchpadMessage: (msg: scratchpadMessage) => any
    addToScratchpad: (msg: string) => any,
    setScratchpad: (msg: string) => any,
    setTitlebarColor: (color: lineColors) => any,
    setTitlebarSide: (side: lineSides) => any,
}
const FuelPredPage: React.FC<fuelPredProps> = ({ setScratchpad, setTitlebar, setTitlebarColor, setTitlebarSide, clearScratchpad }) => {
    // TODO connect this up with the FMGC when it's avail
    const [zfw, setZFW] = useState<number>();
    const [zfwCG, setZFWCG] = useState<number>();

    useEffect(() => {
        setTitlebar('FUEL PRED');
        setTitlebarColor(lineColors.white);
        setTitlebarSide(lineSides.center);
    }, []);
    return (
        <Content>
            <RowHolder index={1}>
                <DestICAOLine />
                <DestTimeLine />
                <DestEFOBLine />
            </RowHolder>
            <RowHolder index={2}>
                <AltICAOLine />
                <AltTimeLine />
                <AltEFOBLine />
            </RowHolder>
            <RowHolder index={3}>
                <RteRsvLine />
                <ZfwLine clearScratchpad={clearScratchpad} setScratchpad={setScratchpad} zfw={zfw} setZFW={setZFW} zfwCG={zfwCG} setZFWCG={setZFWCG} />
            </RowHolder>
            <RowHolder index={4}>
                <AltnLine clearScratchpad={clearScratchpad} />
                <FobLine zfw={zfw} />
            </RowHolder>
            <RowHolder index={5}>
                <FinalLine clearScratchpad={clearScratchpad} />
                <GWCGLine zfw={zfw} />
            </RowHolder>
            <RowHolder index={6}>
                <MinDestFobLine clearScratchpad={clearScratchpad} />
                <ExtraLine zfw={zfw} />
            </RowHolder>
        </Content>
    );
};
const mapDispatchToProps = (dispatch) => ({
    setTitlebar: bindActionCreators(titlebarActions.setTitleBarText, dispatch),
    setTitlebarColor: bindActionCreators(titlebarActions.setTitleBarColor, dispatch),
    setTitlebarSide: bindActionCreators(titlebarActions.setTitleBarSide, dispatch),
    clearScratchpad: bindActionCreators(scratchpadActions.clearScratchpad, dispatch),
    setScratchpad: bindActionCreators(scratchpadActions.setScratchpad, dispatch),
    addScratchpadMessage: bindActionCreators(scratchpadActions.addScratchpadMessage, dispatch),
    addToScratchpad: bindActionCreators(scratchpadActions.addToScratchpad, dispatch),
});
export default connect(null, mapDispatchToProps)(FuelPredPage);

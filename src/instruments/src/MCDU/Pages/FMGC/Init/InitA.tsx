import React, { useEffect, useState } from 'react';
import { useSimVar } from '../../../../Common/simVars';
import './styles.scss';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineSelectField } from '../../../Components/Fields/Interactive/LineSelectField';
import { scratchpadMessage, scratchpadState } from '../../../redux/reducers/scratchpadReducer';
import InteractiveSplitField, { fieldProperties } from '../../../Components/Fields/Interactive/InteractiveSplitField';

// TODO when FMGS is in place then event and color management to these components

const CoRouteLine: React.FC = () => (
    <div className="line-holder-one">
        <LabelField lineSide={lineSides.left} value="CO RTE" color={lineColors.white} />
        <Field
            lineSide={lineSides.left}
            value="__________"
            color={lineColors.amber}
            size={lineSizes.regular}
        />
    </div>
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
        <div className="line-holder-two">
            <LabelField lineSide={lineSides.right} value={'FROM/TO\xa0\xa0'} color={lineColors.white} />
            <StringInputField
                value=""
                lineSide={lineSides.right}
                nullValue="____|____"
                color={lineColors.amber}
                size={lineSizes.regular}
                lsk={LINESELECT_KEYS.R1}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={(value) => validateEntry(value)} // For now returns true
            />
        </div>
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
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="ALTN/CO RTE" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                value={value}
                nullValue="----|----------"
                color={value !== undefined ? lineColors.cyan : lineColors.amber}
                lsk={LINESELECT_KEYS.L2}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </div>
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
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="FLT NBR" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                value={flightNo}
                nullValue="________"
                color={flightNo !== undefined ? lineColors.cyan : lineColors.amber}
                size={lineSizes.regular}
                selectedCallback={(value) => setNewValue(value)}
                lsk={LINESELECT_KEYS.L3}
                selectedValidation={(value) => validateEntry(value)}
            />
        </div>
    );
};

const WindTempLine: React.FC = () => (
    <div className="line-holder-two">
        <EmptyLine />
        <LineSelectField
            lineSide={lineSides.right}
            value="WIND/TEMP>"
            size={lineSizes.regular}
            selectedCallback={() => {
                console.log('WIND/TEMP Page called');
            }}
            lsk={LINESELECT_KEYS.R4}
            color={lineColors.white}
        />
    </div>
);

const CostIndexLine: React.FC = () => {
    const [costIndex, setCostIndex] = useState<string>(); // Temp until FMGC in-place
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="COST INDEX" color={lineColors.white} />
            <NumberInputField
                lineSide={lineSides.left}
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
        </div>
    );
};

type cruiseFLTempProps = {
    scratchpad: scratchpadState
    addMessage: (msg: scratchpadMessage) => any
}
const CruiseFLTemp: React.FC<cruiseFLTempProps> = ({ scratchpad, addMessage }) => {
    const maxCruiseFL = 390;
    const [flString, setFL] = useState<string>();
    const [temp, setTemp] = useState<string>();
    const [cruiseEntered, setCruiseEntered] = useState(false);
    const properties: fieldProperties = {
        lValue: flString === undefined ? '__._' : `FL${flString}`,
        lColour: flString !== undefined ? lineColors.cyan : lineColors.amber,
        lSize: lineSizes.regular,
        rValue: temp !== undefined ? temp : '__._',
        rColour: lineColors.inop,
        rSize: lineSizes.regular,
    };
    const validateCruiseFL = (fl: number) => {
        if (!Number.isFinite(fl)) {
            addMessage({
                text: 'FORMAT ERROR',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl <= 0 || fl > maxCruiseFL) {
            addMessage({
                text: 'ENTRY OUT OF RANGE',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        setCruiseEntered(true); // This is only done here so both values can be entered at once
        return true;
    };
    const validateTemp = (temp: number) => {
        if (cruiseEntered) {
            if (Number.isFinite(temp)) {
                if (temp > 270 && temp < 100) {
                    return true;
                }
                addMessage({
                    text: 'ENTRY OUT OF RANGE',
                    isAmber: false,
                    isTypeTwo: false,
                });
                return false;
            }
            addMessage({
                text: 'FORMAT ERROR',
                isAmber: false,
                isTypeTwo: false,
            });
            return false;
        }
        addMessage({
            text: 'NOT ALLOWED',
            isAmber: false,
            isTypeTwo: false,
        });
        return false;
    };
    const validateEntry = (lVal: string, rVal: string) => {
        const newFL = lVal.replace('FL', '');
        const newTemp = rVal !== undefined ? rVal.replace('M', '-') : '';

        if (newFL !== '' && newTemp !== '') {
            return validateCruiseFL(parseInt(newFL)) && validateTemp(parseInt(newTemp));
        }

        if (newFL !== '') {
            return validateCruiseFL(parseInt(newFL));
        }
        if (newTemp !== '') {
            const temp = parseInt(newTemp);
            return validateTemp(temp);
        }
        return false;
    };
    const updateFMGC = (lVal: string, rVal: string) => {
        if (scratchpad.currentMessage === 'CLR') {
            setFL(undefined);
            setTemp(undefined);
            setCruiseEntered(false);
        }
        // TODO import autocalc for temperature when only temp provided
        const newFL = lVal.replace('FL', '');
        const newTemp = rVal !== undefined ? rVal.replace('M', '-') : '';
        if (newFL !== '') {
            setFL(newFL);
        }
        if (newTemp !== '') {
            setTemp(rVal);
        }
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="CRZ FL/TEMP" color={lineColors.white} />
            <InteractiveSplitField
                side={lineSides.left}
                lsk={LINESELECT_KEYS.L6}
                slashColor={flString !== undefined ? lineColors.cyan : lineColors.amber}
                properties={properties}
                selectedValidation={(lVal, rVal) => validateEntry(lVal, rVal)}
                selectedCallback={(lVal, rVal) => updateFMGC(lVal, rVal)}
            />
        </div>
    );
};

// TODO finish this
const AlignOptionLine: React.FC = () => (
    <div className="line-holder-two">
        <EmptyLine />
        <EmptyLine />
    </div>
);

const TropoLine: React.FC = () => {
    const [tropo, setTropo] = useState<string>();
    return (
        <div className="line-holder-two">
            <LabelField lineSide={lineSides.right} value="TROPO" color={lineColors.white} />
            <NumberInputField
                lineSide={lineSides.right}
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
        </div>
    );
};

const GndTempLine: React.FC = () => (
    <div className="line-holder-two">
        <LabelField lineSide={lineSides.right} value="GND TEMP" color={lineColors.white} />
        <Field
            lineSide={lineSides.right}
            value="---°"
            color={lineColors.inop}
            size={lineSizes.regular}
        />
    </div>
);

const RequestLine: React.FC = () => (
    <div className="line-holder-two">
        <Field lineSide={lineSides.right} value="REQUEST*" color={lineColors.amber} size={lineSizes.regular} />
        <LineSelectField
            lineSide={lineSides.right}
            value="INIT "
            color={lineColors.amber}
            size={lineSizes.regular}
            lsk={LINESELECT_KEYS.R2}
            selectedCallback={() => {
                console.log('Pretending to retrieve simbrief data');
            }}
        />
    </div>
);
type InitAPageProps = {

    // REDUX
    setTitlebarText : (text: any) => void
    clearScratchpad: () => void
    addMessage: (msg: scratchpadMessage) => void
    scratchpad: scratchpadState
}
const InitAPage: React.FC<InitAPageProps> = ({ scratchpad, setTitlebarText, clearScratchpad, addMessage }) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <>
            <div className="row-holder">
                <CoRouteLine />
                <FromToLine addMessage={addMessage} />
            </div>
            <div className="row-holder">
                <AltDestLine addMessage={addMessage} />
                <RequestLine />
            </div>
            <div className="row-holder">
                <FlightNoLine clearScratchpad={clearScratchpad} addMessage={addMessage} />
                <AlignOptionLine />
            </div>
            <div className="row-holder">
                <WindTempLine />
            </div>
            <div className="row-holder">
                <CostIndexLine />
                <TropoLine />
            </div>
            <div className="row-holder">
                <CruiseFLTemp scratchpad={scratchpad} addMessage={addMessage} />
                <GndTempLine />
            </div>
        </>
    );
};

export default InitAPage;

import React, { useEffect, useState } from 'react';
import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { NXFictionalMessages, NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { mcduState } from 'instruments/src/MCDU/redux/reducers/mcduReducer';
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
import { scratchpadState } from '../../../redux/reducers/scratchpadReducer';
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
    addMessage: (msg: ScratchpadMessage) => void,
    fmgc: mcduState,
    eraseTempFpl: (callback?: () => void) => void
}
const FromToLine: React.FC<fromToLineProps> = ({ addMessage, fmgc, eraseTempFpl }) => {
    const [from, setFrom] = useState(fmgc.flightPlanManager?.getPersistentOrigin().ident);
    const [to, setTo] = useState(fmgc.flightPlanManager?.getDestination().ident);
    const [, setUseFplDecelPoint] = useSimVar('L:FLIGHTPLAN_USE_DECEL_WAYPOINT', 'number');

    useEffect(() => {
        setFrom(fmgc.flightPlanManager?.getPersistentOrigin().ident);
        setTo(fmgc.flightPlanManager?.getDestination().ident);
    }, [fmgc.flightPlanManager]);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            const [from, to] = value.split('/');
            fmgc.fmcDataManager?.GetAirportByIdent(from).then((airportFrom) => {
                if (airportFrom) {
                    fmgc.fmcDataManager?.GetAirportByIdent(to).then((airportTo) => {
                        if (airportTo) {
                            eraseTempFpl();
                            fmgc.flightPlanManager?.setOrigin(airportFrom.icao, () => {
                                // Set temp origin
                                fmgc.flightPlanManager?.setDestination(airportTo.icao, () => {
                                    if (fmgc.flightPlanManager !== undefined) {
                                        fmgc.flightPlanManager.getWaypoint(0).endsInDiscontinuity = true;
                                        fmgc.flightPlanManager.getWaypoint(0).discontinuityCanBeCleared = true;
                                        // init aocAirportList
                                        setUseFplDecelPoint(1);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    };
    const validateEntry = (value: string) => {
        if (value === '') {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        const [from, to] = value.split('/');
        fmgc.fmcDataManager?.GetAirportByIdent(from).then((airportFrom) => {
            if (airportFrom) {
                fmgc.fmcDataManager?.GetAirportByIdent(to).then((airportTo) => {
                    if (airportTo) {
                        return true;
                    }
                    addMessage(NXSystemMessages.notInDatabase);
                    return false;
                }).then(() => {
                    addMessage(NXFictionalMessages.internalError);
                    return false;
                });
            }
            addMessage(NXSystemMessages.notInDatabase);
            return false;
        }).catch(() => {
            addMessage(NXFictionalMessages.internalError);
            return false;
        });

        return true;
    };
    return (
        <div className="line-holder-two">
            <LabelField lineSide={lineSides.right} value={'FROM/TO\xa0\xa0'} color={lineColors.white} />
            <StringInputField
                defaultValue={from && to ? `${from}/${to}` : undefined}
                lineSide={lineSides.right}
                nullValue="____|____"
                color={lineColors.amber}
                size={lineSizes.regular}
                lsk={LINESELECT_KEYS.R1}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={(value) => validateEntry(value)}
            />
        </div>
    );
};
type altDestLineProps = {
    addMessage: (msg: ScratchpadMessage) => void
}
const AltDestLine: React.FC<altDestLineProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            setValue(undefined);
        } else {
            setValue(value);
        }
    };

    const validateEntry = (value) => {
        if (value === '') {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        return true;
    };
    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="ALTN/CO RTE" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
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
    addMessage: (msg: ScratchpadMessage) => void
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
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        if (value.length <= 7) {
            return true;
        }
        addMessage(NXSystemMessages.formatError);
        return false;
    };

    return (
        <div className="line-holder-one">
            <LabelField lineSide={lineSides.left} value="FLT NBR" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={flightNo !== '' ? flightNo : undefined}
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
                defaultValue={costIndex ? parseInt(costIndex).toFixed(0) : undefined}
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
    addMessage: (msg: ScratchpadMessage) => any
}
const CruiseFLTemp: React.FC<cruiseFLTempProps> = ({ scratchpad, addMessage }) => {
    const maxCruiseFL = 390;
    const [flString, setFL] = useState<string>();
    const [temp, setTemp] = useState<string>();
    const [cruiseEntered, setCruiseEntered] = useState(false);
    const properties: fieldProperties = {
        lValue: flString ? `FL${flString}\xa0` : undefined,
        lNullValue: '-----\xa0',
        lColour: flString !== undefined ? lineColors.cyan : lineColors.amber,
        lSize: lineSizes.regular,
        rValue: temp ? `${temp}°` : undefined,
        rNullValue: '---°',
        rColour: lineColors.inop,
        rSize: lineSizes.regular,
    };
    const validateCruiseFL = (fl: number) => {
        if (!Number.isFinite(fl)) {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl <= 0 || fl > maxCruiseFL) {
            addMessage(NXSystemMessages.entryOutOfRange);
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
                addMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        addMessage(NXSystemMessages.notAllowed);
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
                defaultValue={tropo}
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
    setTitlebarText : (text: string) => void
    clearScratchpad: () => void
    addMessage: (msg: ScratchpadMessage) => void
    scratchpad: scratchpadState,
    fmgc: mcduState,
    eraseTempFpl: (callback?: () => void) => void
}
const InitAPage: React.FC<InitAPageProps> = ({ scratchpad, setTitlebarText, addMessage, fmgc, eraseTempFpl }) => {
    useEffect(() => {
        setTitlebarText('INIT');
    }, []);

    return (
        <>
            <div className="row-holder">
                <CoRouteLine />
                <FromToLine addMessage={addMessage} fmgc={fmgc} eraseTempFpl={eraseTempFpl} />
            </div>
            <div className="row-holder">
                <AltDestLine addMessage={addMessage} />
                <RequestLine />
            </div>
            <div className="row-holder">
                <FlightNoLine addMessage={addMessage} />
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

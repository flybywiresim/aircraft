import React, { useEffect, useState } from 'react';
import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import { RowHolder } from '../../../Components/Holders/RowHolder';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { LineHolder } from '../../../Components/Holders/LineHolder';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';
import NumberInputField from '../../../Components/Fields/Interactive/NumberInputField';

type VorProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}

const Vor: React.FC<VorProps> = ({ addMessage }) => {
    const [vorone, setVorone] = useState<string>();
    const [vortwo, setVortwo] = useState<string>();
    const setNewValue = (value: string | undefined, select) => {
        if (select === 1) {
            if (value === undefined) {
                setVorone(undefined);
            }
            setVorone(value);
        } else if (select === 2) {
            if (value === undefined) {
                setVortwo(undefined);
            }
            setVortwo(value);
        }
    };

    const validateEntry = (value: string) => {
        if (value === '') {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        return true;
    };
    return (
        <RowHolder columns={2}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value="VOR1/FREQ" color={lineColors.white} />
                <StringInputField
                    lineSide={lineSides.left}
                    defaultValue={vorone}
                    nullValue="[  ]/[   .]"
                    color={vorone !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.L1}
                    selectedCallback={(value) => setNewValue(value, 1)}
                    selectedValidation={((value) => validateEntry(value))}
                    size={lineSizes.regular}
                />
            </LineHolder>
            <LineHolder columnPosition={2}>
                <LabelField lineSide={lineSides.right} value="FREQ/VOR2" color={lineColors.white} />
                <StringInputField
                    lineSide={lineSides.right}
                    defaultValue={vortwo}
                    nullValue="[   .]/[ ]"
                    color={vortwo !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.R1}
                    selectedCallback={(value) => setNewValue(value, 2)}
                    selectedValidation={((value) => validateEntry(value))}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </RowHolder>
    );
};

const Crs: React.FC = () => {
    const [crsone, setCrsone] = useState<string | undefined>(undefined);
    const [crstwo, setCrstwo] = useState<string | undefined>(undefined);
    const setNewValue = (value: string | undefined, select) => {
        if (select === 1) {
            if (value === undefined) {
                setCrsone(undefined);
            }
            setCrsone(value);
        } else if (select === 2) {
            if (value === undefined) {
                setCrstwo(undefined);
            }
            setCrstwo(value);
        }
    };
    return (
        <RowHolder columns={2}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value="CRS" color={lineColors.white} />
                <NumberInputField
                    lineSide={lineSides.left}
                    defaultValue={crsone ? parseInt(crsone).toFixed(0) : undefined}
                    nullValue="[  ]"
                    min={0}
                    max={359}
                    color={crsone !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.L2}
                    selectedCallback={(value) => setNewValue(value, 1)}
                    size={lineSizes.regular}
                />
            </LineHolder>
            <LineHolder columnPosition={2}>
                <LabelField lineSide={lineSides.right} value="CRS" color={lineColors.white} />
                <NumberInputField
                    lineSide={lineSides.right}
                    defaultValue={crstwo ? parseInt(crstwo).toFixed(0) : undefined}
                    nullValue="[  ]"
                    min={0}
                    max={359}
                    color={crstwo !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.R2}
                    selectedCallback={(value) => setNewValue(value, 2)}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </RowHolder>
    );
};

type LsProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Ls: React.FC<LsProps> = ({ addMessage }) => {
    const [ls, setLs] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            setLs(undefined);
        } else {
            setLs(value);
        }
    };

    const validateEntry = (value: string) => {
        if (value === '') {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        return true;
    };
    return (
        <RowHolder columns={2}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value="LS /FREQ" color={lineColors.white} />
                <StringInputField
                    lineSide={lineSides.left}
                    defaultValue={ls}
                    nullValue="[  ]/[   .]"
                    color={ls !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.L3}
                    selectedCallback={(value) => setNewValue(value)}
                    selectedValidation={((value) => validateEntry(value))}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </RowHolder>
    );
};

const Lscrs: React.FC = () => {
    const [lscrs, setLscrs] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            setLscrs(undefined);
        } else {
            setLscrs(value);
        }
    };

    return (
        <RowHolder columns={2}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value="CRS" color={lineColors.white} />
                <NumberInputField
                    lineSide={lineSides.left}
                    defaultValue={lscrs ? parseInt(lscrs).toFixed(0) : undefined}
                    nullValue="[  ]"
                    color={lscrs !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.L4}
                    selectedCallback={(value) => setNewValue(value)}
                    size={lineSizes.regular}
                    max={359}
                    min={0}
                />
            </LineHolder>
        </RowHolder>

    );
};

type AdfProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}

const Adf: React.FC<AdfProps> = ({ addMessage }) => {
    const [adfone, setAdfone] = useState<string | undefined>(undefined);
    const [adftwo, setAdftwo] = useState<string | undefined>(undefined);
    const setNewValue = (value: string | undefined, select) => {
        if (select === 1) {
            if (value === undefined) {
                setAdfone(undefined);
            }
            setAdfone(value);
        } else if (select === 2) {
            if (value === undefined) {
                setAdftwo(undefined);
            }
            setAdftwo(value);
        }
    };

    const validateEntry = (value: string, select) => {
        if (value === '') {
            addMessage(NXSystemMessages.formatError);
            return false;
        }
        if (select === 1) {
            // validate adf one
        } else if (select === 2) {
            // validate adf two
        }

        return true;
    };
    return (
        <RowHolder columns={2}>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} value="ADF1/FREQ" color={lineColors.white} />
                <StringInputField
                    lineSide={lineSides.left}
                    defaultValue={adfone}
                    nullValue="[  ]/[   .]"
                    color={adfone !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.L5}
                    selectedCallback={(value) => setNewValue(value, 1)}
                    selectedValidation={((value) => validateEntry(value, 1))}
                    size={lineSizes.regular}
                />
            </LineHolder>
            <LineHolder columnPosition={2}>
                <LabelField lineSide={lineSides.right} value="FREQ/ADF2" color={lineColors.white} />
                <StringInputField
                    lineSide={lineSides.right}
                    defaultValue={adftwo}
                    nullValue="[    .]/[ ]"
                    color={adftwo !== undefined ? lineColors.cyan : lineColors.cyan}
                    lsk={LINESELECT_KEYS.R5}
                    selectedCallback={(value) => setNewValue(value, 2)}
                    selectedValidation={((value) => validateEntry(value, 2))}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </RowHolder>

    );
};

const Adfbfo: React.FC = () => (
    <RowHolder columns={2}>
        <LineHolder columnPosition={1}>
            <EmptyLine />
            <Field
                lineSide={lineSides.left}
                value="<-ADF1 BFO"
                size={lineSizes.regular}
                color={lineColors.inop}
            />
        </LineHolder>
        <LineHolder columnPosition={2}>
            <EmptyLine />
            <Field
                lineSide={lineSides.right}
                value="ADF2 BFO->"
                size={lineSizes.regular}
                color={lineColors.inop}
            />
        </LineHolder>
    </RowHolder>
);

const RadnavPage: React.FC = () => {
    const dispatch = useMCDUDispatch();
    const addMessage = (msg: ScratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };

    const setTitlebar = ((msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    });

    useEffect(() => {
        setTitlebar(' RADIO NAV ');
    }, []);
    return (
        <>
            <Vor addMessage={addMessage} />
            <Crs />
            <Ls addMessage={addMessage} />
            <Lscrs />
            <Adf addMessage={addMessage} />
            <Adfbfo />
        </>
    );
};

export default RadnavPage;

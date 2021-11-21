import React, { useEffect, useState } from 'react';
import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { add } from 'mathjs';
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

type VoroneProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Vorone:React.FC<VoroneProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="VOR1/FREQ" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
                nullValue="[  ]/[   .]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.L1}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type VortwoProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Vortwo:React.FC<VortwoProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="FREQ/VOR2" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.right}
                defaultValue={value}
                nullValue="[   .]/[ ]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.R1}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type CrsoneProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Crsone:React.FC<CrsoneProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="CRS" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
                nullValue="[  ]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.L2}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type CrstwoProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Crstwo:React.FC<CrstwoProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="CRS" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.right}
                defaultValue={value}
                nullValue="[  ]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.R2}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type LsProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Ls:React.FC<LsProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="LS /FREQ" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
                nullValue="[  ]/[   .]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.L3}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};
type LscrsProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Lscrs:React.FC<LscrsProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="CRS" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
                nullValue="[  ]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.L4}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type AdfoneProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Adfone:React.FC<AdfoneProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} value="ADF1/FREQ" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.left}
                defaultValue={value}
                nullValue="[  ]/[   .]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.L5}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

type AdftwoProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}
const Adftwo:React.FC<AdftwoProps> = ({ addMessage }) => {
    const [value, setValue] = useState<string | undefined>(undefined);

    const setNewValue = (value: string | undefined) => {
        if (value === undefined) {
            addMessage(NXSystemMessages.notAllowed);
        } else {
            setValue(value);
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
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.right} value="FREQ/ADF2" color={lineColors.white} />
            <StringInputField
                lineSide={lineSides.right}
                defaultValue={value}
                nullValue="[    .]/[ ]"
                color={value !== undefined ? lineColors.cyan : lineColors.cyan}
                lsk={LINESELECT_KEYS.R5}
                selectedCallback={(value) => setNewValue(value)}
                selectedValidation={((value) => validateEntry(value))}
                size={lineSizes.regular}
            />
        </LineHolder>
    );
};

const Adfonebfo:React.FC = () => (
    <LineHolder columnPosition={1}>
        <EmptyLine />
        <Field
            lineSide={lineSides.left}
            value="<-ADF1 BFO"
            size={lineSizes.regular}
            color={lineColors.inop}
        />
    </LineHolder>
);
const Adftwobfo:React.FC = () => (
    <LineHolder columnPosition={2}>
        <EmptyLine />
        <Field
            lineSide={lineSides.right}
            value="ADF2 BFO->"
            size={lineSizes.regular}
            color={lineColors.inop}
        />
    </LineHolder>
);
type RadnavePageProps = {
    addMessage: (msg: ScratchpadMessage) => void,
}

const RadnavPage: React.FC<RadnavePageProps> = ({ addMessage }) => {
    const dispatch = useMCDUDispatch();
    const setTitlebar = ((msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    });
    useEffect(() => {
        setTitlebar(' RADIO NAV ');
    }, []);
    return (
        <>
            <RowHolder columns={2}>
                <Vorone addMessage={addMessage} />
                <Vortwo addMessage={addMessage} />
            </RowHolder>
            <RowHolder columns={2}>
                <Crsone addMessage={addMessage} />
                <Crstwo addMessage={addMessage} />
            </RowHolder>
            <RowHolder columns={2}>
                <Ls addMessage={addMessage} />
            </RowHolder>
            <RowHolder columns={2}>
                <Lscrs addMessage={addMessage} />
            </RowHolder>
            <RowHolder columns={2}>
                <Adfone addMessage={addMessage} />
                <Adftwo addMessage={addMessage} />
            </RowHolder>
            <RowHolder columns={2}>
                <Adfonebfo />
                <Adftwobfo />
            </RowHolder>
        </>
    );
};

export default RadnavPage;

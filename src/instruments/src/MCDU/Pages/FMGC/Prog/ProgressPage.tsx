import React, { useEffect } from 'react';
import StringInputField from '../../../Components/Fields/Interactive/StringInputField';
import { useMCDUDispatch } from '../../../redux/hooks';
import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { useSimVar } from '../../../../Common/simVars';
import { RowHolder } from '../../../Components/Holders/RowHolder';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineHolder } from '../../../Components/Holders/LineHolder';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

const CrzLine: React.FC = () => {
    const [crzAlt, _] = useSimVar('L:AIRLINER_CRUISE_ALTITUDE', 'number');
    return (
        <>
            <LineHolder columnPosition={1}>
                <LabelField lineSide={lineSides.left} color={lineColors.white} value=" CRZ" />
                <Field
                    lineSide={lineSides.left}
                    value={crzAlt === 0 ? '-----' : `FL${Math.round(crzAlt / 100)}`}
                    color={crzAlt === 0 ? lineColors.white : lineColors.green}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </>
    );
};
const OptLine: React.FC = () => (
    <>
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.center} color={lineColors.white} value="OPT" />
            <Field
                lineSide={lineSides.center}
                value="-----"
                color={lineColors.white}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const RecMaxLine: React.FC = () => (
    <>
        <LineHolder columnPosition={3}>
            <LabelField lineSide={lineSides.right} color={lineColors.white} value="REC MAX " />
            <Field
                lineSide={lineSides.right}
                value="----- "
                color={lineColors.white}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const ReportLine: React.FC = () => (
    <>
        <LineHolder columnPosition={1}>
            <EmptyLine />
            <Field
                lineSide={lineSides.left}
                value="<REPORT"
                color={lineColors.white}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const PosUpdateLine: React.FC = () => (
    <>
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} color={lineColors.white} value=" POSITION UPDATE AT" />
            <Field
                lineSide={lineSides.left}
                value="*[     ]"
                color={lineColors.cyan}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const BrgDist: React.FC = () => (
    <>
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} color={lineColors.white} value="  BRG /DIST" />
            <Field
                lineSide={lineSides.left}
                value=" ---°/ ----.- TO"
                color={lineColors.white}
                size={lineSizes.small}
            />
        </LineHolder>
    </>
);
const BrgDistInput: React.FC = () => {
    const validateEntry = (value) => {
        if (value.length >= 2 && value.length <= 7) {
            return true;
        }
        return false;
    };
    return (
        <>
            <LineHolder columnPosition={2}>
                <EmptyLine />
                <StringInputField
                    lineSide={lineSides.left}
                    defaultValue="[     ]"
                    nullValue="[     ]"
                    color={lineColors.cyan}
                    size={lineSizes.small}
                    selectedCallback={(value) => console.log(`pretending to calc brg/dist for ${value}`)}
                    lsk={LINESELECT_KEYS.R4}
                    selectedValidation={(value) => validateEntry(value)}
                />
            </LineHolder>
        </>
    );
};
const PredGPSLine: React.FC = () => (
    <>
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} color={lineColors.white} value=" PREDICTIVE" />
            <Field
                lineSide={lineSides.left}
                value=">GPS"
                color={lineColors.white}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const GPSPrimaryLine: React.FC = () => {
    const [gpsPrimUse, _] = useSimVar('L:A32NX_ADIRS_USES_GPS_AS_PRIMARY', 'Bool');
    return (
        <>
            <LineHolder columnPosition={2}>
                <EmptyLine />
                <Field
                    lineSide={lineSides.right}
                    value={gpsPrimUse ? 'GPS PRIMARY' : ''}
                    color={lineColors.green}
                    size={lineSizes.regular}
                />
            </LineHolder>
        </>
    );
};
const ReqLine: React.FC = () => (
    <>
        <LineHolder columnPosition={1}>
            <LabelField lineSide={lineSides.left} color={lineColors.white} value="REQUIRED" />
            <Field
                lineSide={lineSides.left}
                value="0.36NM"
                color={lineColors.green}
                size={lineSizes.small}
            />
        </LineHolder>
    </>
);
const AccurLine: React.FC = () => (
    <>
        <LineHolder columnPosition={2}>
            <LabelField lineSide={lineSides.center} color={lineColors.white} value="ACCUR " />
            <Field
                lineSide={lineSides.left}
                value=" HIGH"
                color={lineColors.green}
                size={lineSizes.regular}
            />
        </LineHolder>
    </>
);
const EstLine: React.FC = () => (
    <>
        <LineHolder columnPosition={3}>
            <LabelField lineSide={lineSides.right} color={lineColors.white} value="ESTIMATED " />
            <Field
                lineSide={lineSides.left}
                value="0.16NM "
                color={lineColors.green}
                size={lineSizes.small}
            />
        </LineHolder>
    </>
);
/**
 *
 * @deprecated Need to allow titlebar to have multiple columns
 * @see TitleBar
 */
const ProgressPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [flightNo, _] = useSimVar('ATC FLIGHT NUMBER', 'string');
    const dispatch = useMCDUDispatch();
    const setTitlebar = (msg: any) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };
    const setTitlebarColor = (color: lineColors) => {
        dispatch(titlebarActions.setTitleBarColor(color));
    };
    useEffect(() => {
        setTitlebar('TO');
        setTitlebarColor(lineColors.green);
    }, []);
    return (
        <>
            <RowHolder columns={3}>
                <CrzLine />
                <OptLine />
                <RecMaxLine />
            </RowHolder>
            <RowHolder columns={1}>
                <ReportLine />
            </RowHolder>
            <RowHolder columns={1}>
                <PosUpdateLine />
            </RowHolder>
            <RowHolder columns={2}>
                <BrgDist />
                <BrgDistInput />
            </RowHolder>
            <RowHolder columns={2}>
                <PredGPSLine />
                <GPSPrimaryLine />
            </RowHolder>
            <RowHolder columns={3}>
                <ReqLine />
                <AccurLine />
                <EstLine />
            </RowHolder>
        </>
    );
};

export default ProgressPage;

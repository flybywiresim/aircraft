import React, { useEffect, useState } from 'react';

import '../../../Components/styles.scss';
import './styles.scss';

import { useMCDUDispatch } from '../../../redux/hooks';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

import { lineColors, lineSides, lineSizes } from '../../../Components/Lines/LineProps';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { LINESELECT_KEYS } from '../../../Components/Buttons';
import { LabelField } from '../../../Components/Fields/NonInteractive/LabelField';
import { Field } from '../../../Components/Fields/NonInteractive/Field';
import { LineSelectField } from '../../../Components/Fields/Interactive/LineSelectField';

type FMGCTextProps = {
    activeSys: string,
    setActiveSys: React.Dispatch<React.SetStateAction<string>>,
    setPage: React.Dispatch<React.SetStateAction<string>>,
    selected: string,
    setSelected: React.Dispatch<React.SetStateAction<string>>,
}
const FMGCText: React.FC<FMGCTextProps> = ({ activeSys, setActiveSys, setPage, selected, setSelected }) => {
    function determineColor() {
        if (activeSys === 'FMGC') {
            if (selected === 'FMGC') {
                return lineColors.cyan;
            }
            return lineColors.green;
        }
        return lineColors.white;
    }

    function determineText() {
        if (activeSys === 'FMGC') {
            if (selected === 'FMGC') {
                return '<FMGC (SEL)';
            }
            return '<FMGC (REQ)';
        }
        return '<FMGC (REQ)';
    }

    return (
        <div className="line-holder-one">
            <EmptyLine />
            <LineSelectField
                lineSide={lineSides.left}
                value={determineText()}
                color={determineColor()}
                lsk={LINESELECT_KEYS.L1}
                selectedCallback={(() => {
                    setActiveSys('FMGC'); // Placeholder until we can retrieve activeSys from FMGC
                    setSelected('FMGC');
                    setTimeout(() => {
                        if (setPage) {
                            setPage('IDENT');
                        }
                    }, Math.floor(Math.random() * 400) + 400);
                })}
                size={lineSizes.regular}
            />
        </div>
    );
};

type TextProps = {
    system: string,
    activeSys: string,
    setActiveSys: React.Dispatch<React.SetStateAction<string>>,
    setPage?: React.Dispatch<React.SetStateAction<string>>,
    selected: string,
    side: lineSides,
    setSelected: React.Dispatch<React.SetStateAction<string>>,
    lsk: LINESELECT_KEYS
}
const MenuLineText: React.FC<TextProps> = ({ lsk, side, system, activeSys, setActiveSys, selected, setSelected }) => {
    function determineColor() {
        if (activeSys === system) {
            if (selected === system) {
                return lineColors.cyan;
            }
            return lineColors.green;
        }
        return lineColors.white;
    }

    function determineText() {
        if (side) {
            if (activeSys === system) {
                if (selected === system) {
                    return side === lineSides.left ? `<${system} (SEL)` : `(SEL) ${system}>`;
                }
                return side === lineSides.left ? `<${system}` : `${system}>`;
            }
            return side === lineSides.left ? `<${system}` : `${system}>`;
        }
        console.error('Side not provided for Menu Line Component');
        return 'INSERT A SIDE';
    }

    return (
        <div className="line-holder-one">
            <EmptyLine />
            <LineSelectField
                lineSide={lineSides.left}
                size={lineSizes.regular}
                value={determineText()}
                color={determineColor()}
                lsk={lsk}
                selectedCallback={(() => {
                    if (system) {
                        setActiveSys(system);
                        setSelected(system);
                    }
                })}
            />
        </div>
    );
};

const NAVBText: React.FC = () => (
    <div className="line-holder-two">
        <LabelField lineSide={lineSides.right} value={'SELECT\xa0'} color={lineColors.white} />
        <Field lineSide={lineSides.right} value="NAV B/UP" color={lineColors.white} size={lineSizes.regular} />
    </div>
);

const OptionsText: React.FC = () => (
    <div className="line-holder-two">
        <EmptyLine />
        <Field
            lineSide={lineSides.right}
            value="OPTIONS>"
            size={lineSizes.regular}
            color={lineColors.inop}
        />
    </div>
);

const ReturnText: React.FC = () => (
    <div className="line-holder-two">
        <EmptyLine />
        <Field
            lineSide={lineSides.right}
            color={lineColors.inop}
            size={lineSizes.regular}
            value="RETURN>"
        />
    </div>
);

type MenuProps = {
    setPage: React.Dispatch<React.SetStateAction<string>>
}
const MenuPage: React.FC<MenuProps> = ({ setPage }) => {
    const [activeSys, setActiveSys] = useState('FMGC'); // Placeholder till FMGS in place
    const [selected, setSelected] = useState('');
    const dispatch = useMCDUDispatch();
    const setTitlebar = ((msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    });

    useEffect(() => {
        setTitlebar('MCDU MENU');
    }, []);

    return (
        <>
            <div className="row-holder">
                <FMGCText activeSys={activeSys} setActiveSys={setActiveSys} setPage={setPage} selected={selected} setSelected={setSelected} />
                <NAVBText />
            </div>
            <div className="row-holder">
                <MenuLineText
                    lsk={LINESELECT_KEYS.L2}
                    system="ATSU"
                    side={lineSides.left}
                    activeSys={activeSys}
                    setActiveSys={setActiveSys}
                    selected={selected}
                    setSelected={setSelected}
                />
            </div>
            <div className="row-holder">
                <MenuLineText
                    lsk={LINESELECT_KEYS.L3}
                    system="AIDS"
                    side={lineSides.left}
                    activeSys={activeSys}
                    setActiveSys={setActiveSys}
                    selected={selected}
                    setSelected={setSelected}
                />
            </div>
            <div className="row-holder">
                <MenuLineText
                    lsk={LINESELECT_KEYS.L4}
                    system="CFDS"
                    side={lineSides.left}
                    activeSys={activeSys}
                    setActiveSys={setActiveSys}
                    selected={selected}
                    setSelected={setSelected}
                />
            </div>
            <div className="row-holder">
                <OptionsText />
            </div>
            <div className="row-holder">
                <ReturnText />
            </div>
        </>
    );
};

export default MenuPage;

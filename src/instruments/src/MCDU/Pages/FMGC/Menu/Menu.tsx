import React, { useContext, useEffect, useState } from 'react';
import '../../../Components/styles.scss';
import { LineHolder } from '../../../Components/Lines/LineHolder';
import { Line, lineColors, lineSides } from '../../../Components/Lines/Line';
import { RowHolder } from '../../../Components/RowHolder';
import { EmptyLine } from '../../../Components/Lines/EmptyLine';
import { StringField } from '../../../Components/Field/StringField';
import { lineSelectKeys } from '../../../Components/Buttons';
import { Label } from '../../../Components/Lines/Label';
import { RootContext } from '../../../RootContext';
import { Content } from '../../../Components/Content';

type MenuProps = {
    setPage: React.Dispatch<React.SetStateAction<string>>
}
type TextProps = {
    system?: string,
    activeSys: string,
    setActiveSys: React.Dispatch<React.SetStateAction<string>>,
    setPage?: React.Dispatch<React.SetStateAction<string>>,
    selected: string,
    side?: lineSides,
    setSelected: React.Dispatch<React.SetStateAction<string>>,
}
const FMGCText: React.FC<TextProps> = ({ activeSys, setActiveSys, setPage, selected, setSelected }) => {
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
                return 'FMGC (SEL)';
            }
            return '<FMGC (REQ)';
        }
        return '<FMGC (REQ)';
    }

    return (
        <LineHolder>
            <EmptyLine />
            <Line value={(
                <StringField
                    value={determineText()}
                    side={lineSides.left}
                    nullValue=""
                    color={determineColor()}
                    isInput={false}
                    lsk={lineSelectKeys.L1}
                    selectedCallback={(() => {
                        setActiveSys('FMGC'); // Placeholder until we can retrieve activeSys from FMGC
                        setSelected('FMGC');
                        setTimeout(() => {
                            if (setPage) {
                                setPage('IDENT');
                            }
                        }, Math.floor(Math.random() * 400) + 400);
                    })}
                />
            )}
            />
        </LineHolder>
    );
};

const MenuLineText: React.FC<TextProps> = ({ side, system, activeSys, setActiveSys, selected, setSelected }) => {
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
                    return side === lineSides.left ? `<${selected} (SEL)` : `(SEL) ${selected}>`;
                }
                return side === lineSides.left ? `<${selected}` : `${selected}>`;
            }
            return side === lineSides.left ? `<${selected}` : `${selected}>`;
        }
        return 'INSERT A SIDE';
    }

    return (
        <LineHolder>
            <EmptyLine />
            <Line value={(
                <StringField
                    side={side !== undefined ? side : lineSides.left}
                    value={determineText()}
                    nullValue=""
                    color={determineColor()}
                    isInput={false}
                    lsk={lineSelectKeys.L2}
                    selectedCallback={(() => {
                        if (system) {
                            setActiveSys(system);
                            setSelected(system);
                        }
                    })}
                />
            )}
            />
        </LineHolder>
    );
};

const NAVBText: React.FC = () => (
    <LineHolder>
        <Line value={<Label side={lineSides.right} value={'SELECT\xa0'} />} />
        <Line value={<StringField value="NAV B/UP" nullValue="" side={lineSides.right} />} />
    </LineHolder>
);

const OptionsText: React.FC = () => (
    <LineHolder>
        <EmptyLine />
        <Line value={<StringField value="OPTIONS>" nullValue="" side={lineSides.right} />} />
    </LineHolder>
);

const MenuPage: React.FC<MenuProps> = ({ setPage }) => {
    const [activeSys, setActiveSys] = useState('FMGC'); // Placeholder till FMGS in place
    const [selected, setSelected] = useState('');
    const [, , , setTitle] = useContext(RootContext);

    useEffect(() => {
        setTitle('MCDU MENU');
    }, []);

    return (
        <>
            <Content>
                <RowHolder index={1}>
                    <FMGCText activeSys={activeSys} setActiveSys={setActiveSys} setPage={setPage} selected={selected} setSelected={setSelected} />
                    <NAVBText />
                </RowHolder>
                <RowHolder index={2}>
                    <MenuLineText system="ATSU" side={lineSides.left} activeSys={activeSys} setActiveSys={setActiveSys} selected={selected} setSelected={setSelected} />
                </RowHolder>
                <RowHolder index={3}>
                    <MenuLineText system="AIDS" side={lineSides.left} activeSys={activeSys} setActiveSys={setActiveSys} selected={selected} setSelected={setSelected} />
                </RowHolder>
                <RowHolder index={4}>
                    <MenuLineText system="CFDS" side={lineSides.left} activeSys={activeSys} setActiveSys={setActiveSys} selected={selected} setSelected={setSelected} />
                </RowHolder>
                <RowHolder index={5}>
                    <OptionsText />
                </RowHolder>
                <RowHolder index={6}>
                    <MenuLineText system="RETURN" side={lineSides.right} activeSys={activeSys} setActiveSys={setActiveSys} selected={selected} setSelected={setSelected} />
                </RowHolder>
            </Content>
        </>
    );
};

export default MenuPage;

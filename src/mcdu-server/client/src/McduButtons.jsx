import React, { useContext } from 'react';

import './McduButtons.css';

import { WebsocketContext } from './WebsocketContext';

const ButtonGrid = ({ children, x, y, width, height }) => (
    <div className="button-grid" style={{ left: `${x / 10.61}%`, top: `${y / 16.50}%`, width: `${width / 10.61}%`, height: `${height / 16.50}%` }}>
        {children}
    </div>
);

const ButtonRow = ({ children }) => (
    <div className="button-row">
        {children}
    </div>
);

const Button = ({ name }) => {
    const socket = useContext(WebsocketContext);
    if (name.length) {
        return (
            <div className="button" onClick={() => socket.sendMessage(`event:${name}`)} />
        );
    }
    return <div className="dummy" />;
};

export const McduButtons = () => (
    <div className="buttons">
        <ButtonGrid x={0} y={216} width={1061} height={512}>
            <ButtonRow>
                <Button name="L1" />
                <Button name="R1" />
            </ButtonRow>
            <ButtonRow>
                <Button name="L2" />
                <Button name="R2" />
            </ButtonRow>
            <ButtonRow>
                <Button name="L3" />
                <Button name="R3" />
            </ButtonRow>
            <ButtonRow>
                <Button name="L4" />
                <Button name="R4" />
            </ButtonRow>
            <ButtonRow>
                <Button name="L5" />
                <Button name="R5" />
            </ButtonRow>
            <ButtonRow>
                <Button name="L6" />
                <Button name="R6" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={122} y={804} width={745} height={180}>
            <ButtonRow>
                <Button name="DIR" />
                <Button name="PROG" />
                <Button name="PERF" />
                <Button name="INIT" />
                <Button name="DATA" />
                <Button name="" />
            </ButtonRow>
            <ButtonRow>
                <Button name="FPLN" />
                <Button name="RAD" />
                <Button name="FUEL" />
                <Button name="SEC" />
                <Button name="ATC" />
                <Button name="MENU" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={122} y={985} width={260} height={260}>
            <ButtonRow>
                <Button name="AIRPORT" />
                <Button name="" />
            </ButtonRow>
            <ButtonRow>
                <Button name="PREVPAGE" />
                <Button name="UP" />
            </ButtonRow>
            <ButtonRow>
                <Button name="NEXTPAGE" />
                <Button name="DOWN" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={440} y={1015} width={522} height={616}>
            <ButtonRow>
                <Button name="A" />
                <Button name="B" />
                <Button name="C" />
                <Button name="D" />
                <Button name="E" />
            </ButtonRow>
            <ButtonRow>
                <Button name="F" />
                <Button name="G" />
                <Button name="H" />
                <Button name="I" />
                <Button name="J" />
            </ButtonRow>
            <ButtonRow>
                <Button name="K" />
                <Button name="L" />
                <Button name="M" />
                <Button name="N" />
                <Button name="O" />
            </ButtonRow>
            <ButtonRow>
                <Button name="P" />
                <Button name="Q" />
                <Button name="R" />
                <Button name="S" />
                <Button name="T" />
            </ButtonRow>
            <ButtonRow>
                <Button name="U" />
                <Button name="V" />
                <Button name="W" />
                <Button name="X" />
                <Button name="Y" />
            </ButtonRow>
            <ButtonRow>
                <Button name="Z" />
                <Button name="DIV" />
                <Button name="SP" />
                <Button name="OVFY" />
                <Button name="CLR" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={135} y={1250} width={300} height={375}>
            <ButtonRow>
                <Button name="1" />
                <Button name="2" />
                <Button name="3" />
            </ButtonRow>
            <ButtonRow>
                <Button name="4" />
                <Button name="5" />
                <Button name="6" />
            </ButtonRow>
            <ButtonRow>
                <Button name="7" />
                <Button name="8" />
                <Button name="9" />
            </ButtonRow>
            <ButtonRow>
                <Button name="DOT" />
                <Button name="0" />
                <Button name="PLUSMINUS" />
            </ButtonRow>
        </ButtonGrid>
    </div>
);

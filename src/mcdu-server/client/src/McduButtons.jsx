import React, { useRef, useContext } from 'react';
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

const Button = ({ sound, name }) => {
    const socket = useContext(WebsocketContext);
    const timeout = useRef();
    const buttonHeldTime = 1500;

    function pressButton(event) {
        if (event.defaultPrevented) {
            event.preventDefault();
        }
        if (sound) {
            new Audio('button-click.mp3').play();
        }
        socket.sendMessage(`event:${name}`);
        timeout.current = setTimeout(() => {
            socket.sendMessage(`event:${name}_Held`);
        }, buttonHeldTime);
    }

    function releaseButton(event) {
        event.preventDefault();
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
    }

    if (name.length) {
        return (
            <div
                className="button"
                onMouseDown={(e) => pressButton(e)}
                onMouseUp={(e) => releaseButton(e)}
                onTouchStart={(e) => pressButton(e)}
                onTouchEnd={(e) => releaseButton(e)}
            />
        );
    }
    return <div className="dummy" />;
};

export const McduButtons = ({ sound }) => (
    <div className="buttons">
        <ButtonGrid x={0} y={216} width={1061} height={512}>
            <ButtonRow>
                <Button sound={sound} name="L1" />
                <Button sound={sound} name="R1" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="L2" />
                <Button sound={sound} name="R2" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="L3" />
                <Button sound={sound} name="R3" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="L4" />
                <Button sound={sound} name="R4" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="L5" />
                <Button sound={sound} name="R5" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="L6" />
                <Button sound={sound} name="R6" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={115} y={804} width={745} height={180}>
            <ButtonRow>
                <Button sound={sound} name="DIR" />
                <Button sound={sound} name="PROG" />
                <Button sound={sound} name="PERF" />
                <Button sound={sound} name="INIT" />
                <Button sound={sound} name="DATA" />
                <Button sound={sound} name="" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="FPLN" />
                <Button sound={sound} name="RAD" />
                <Button sound={sound} name="FUEL" />
                <Button sound={sound} name="SEC" />
                <Button sound={sound} name="ATC" />
                <Button sound={sound} name="MENU" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={115} y={985} width={260} height={260}>
            <ButtonRow>
                <Button sound={sound} name="AIRPORT" />
                <Button sound={sound} name="" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="PREVPAGE" />
                <Button sound={sound} name="UP" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="NEXTPAGE" />
                <Button sound={sound} name="DOWN" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={435} y={1013} width={522} height={616}>
            <ButtonRow>
                <Button sound={sound} name="A" />
                <Button sound={sound} name="B" />
                <Button sound={sound} name="C" />
                <Button sound={sound} name="D" />
                <Button sound={sound} name="E" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="F" />
                <Button sound={sound} name="G" />
                <Button sound={sound} name="H" />
                <Button sound={sound} name="I" />
                <Button sound={sound} name="J" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="K" />
                <Button sound={sound} name="L" />
                <Button sound={sound} name="M" />
                <Button sound={sound} name="N" />
                <Button sound={sound} name="O" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="P" />
                <Button sound={sound} name="Q" />
                <Button sound={sound} name="R" />
                <Button sound={sound} name="S" />
                <Button sound={sound} name="T" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="U" />
                <Button sound={sound} name="V" />
                <Button sound={sound} name="W" />
                <Button sound={sound} name="X" />
                <Button sound={sound} name="Y" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="Z" />
                <Button sound={sound} name="DIV" />
                <Button sound={sound} name="SP" />
                <Button sound={sound} name="OVFY" />
                <Button sound={sound} name="CLR" />
            </ButtonRow>
        </ButtonGrid>
        <ButtonGrid x={128} y={1250} width={300} height={375}>
            <ButtonRow>
                <Button sound={sound} name="1" />
                <Button sound={sound} name="2" />
                <Button sound={sound} name="3" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="4" />
                <Button sound={sound} name="5" />
                <Button sound={sound} name="6" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="7" />
                <Button sound={sound} name="8" />
                <Button sound={sound} name="9" />
            </ButtonRow>
            <ButtonRow>
                <Button sound={sound} name="DOT" />
                <Button sound={sound} name="0" />
                <Button sound={sound} name="PLUSMINUS" />
            </ButtonRow>
        </ButtonGrid>
    </div>
);

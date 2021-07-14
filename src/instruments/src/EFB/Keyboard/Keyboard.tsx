import React, { useRef, useContext, useState } from 'react';
import { IconArrowBigTop } from '@tabler/icons';

const keyboardContext = React.createContext({ isShifted: false, inputValue: '', setInputValue: (_value: string) => {} });

const Keyboard = () => {
    const [shifted, setShifted] = useState(false);
    const [fieldValue, setFieldValue] = useState('');

    return (
        <keyboardContext.Provider value={{ isShifted: shifted, inputValue: fieldValue, setInputValue: setFieldValue }}>
            <div className="absolute inset-x-0 bottom-0 bg-gray-600">
                <input
                    type="text"
                    className="w-full h-10 text-xl px-10 bg-white text-black"
                    value={fieldValue}
                />
                <div className="w-full flex-col space-y-2 px-2 py-2">
                    <div className="flex flex-row space-x-2">
                        <Key char="`" altChar="~" alwaysShowAlt />
                        <Key char="1" altChar="!" alwaysShowAlt />
                        <Key char="2" altChar="@" alwaysShowAlt />
                        <Key char="3" altChar="#" alwaysShowAlt />
                        <Key char="4" altChar="$" alwaysShowAlt />
                        <Key char="5" altChar="%" alwaysShowAlt />
                        <Key char="6" altChar="^" alwaysShowAlt />
                        <Key char="7" altChar="&" alwaysShowAlt />
                        <Key char="8" altChar="*" alwaysShowAlt />
                        <Key char="9" altChar="(" alwaysShowAlt />
                        <Key char="0" altChar=")" alwaysShowAlt />
                        <Key char="-" altChar="_" alwaysShowAlt />
                        <Key char="=" altChar="+" alwaysShowAlt />
                    </div>
                    <div className="flex flex-row space-x-2">
                        <Key char="q" altChar="Q" />
                        <Key char="w" altChar="W" />
                        <Key char="e" altChar="E" />
                        <Key char="r" altChar="R" />
                        <Key char="t" altChar="T" />
                        <Key char="y" altChar="Y" />
                        <Key char="u" altChar="U" />
                        <Key char="i" altChar="I" />
                        <Key char="o" altChar="O" />
                        <Key char="p" altChar="P" />
                        <button
                            type="button"
                            className="w-64 h-24 mr-1 rounded-lg rounded-bl-2xl flex-shrink-0 text-2xl text-white font-bold bg-gray-800 hover:bg-gray-900 duration-200"
                            onClick={() => setFieldValue(fieldValue.substring(0, fieldValue.length - 1))}
                        >
                            BACKSPACE
                        </button>
                    </div>
                    <div className="flex flex-row space-x-2">
                        <Key char="a" altChar="A" />
                        <Key char="s" altChar="S" />
                        <Key char="d" altChar="D" />
                        <Key char="f" altChar="F" />
                        <Key char="g" altChar="G" />
                        <Key char="h" altChar="H" />
                        <Key char="j" altChar="J" />
                        <Key char="k" altChar="K" />
                        <Key char="l" altChar="L" />
                        <Key char=";" altChar=":" alwaysShowAlt />
                        <Key char="'" altChar='"' alwaysShowAlt />
                    </div>
                    <div className="flex flex-row space-x-2">
                        <button
                            type="button"
                            className="w-48 h-24 text-white bg-gray-800 hover:bg-gray-900 text-2xl flex justify-center items-center flex-shrink-0 font-bold rounded-lg duration-200"
                            onClick={() => setShifted(!shifted)}
                        >
                            <IconArrowBigTop size={44} fill={`${shifted ? 'white' : 'transparent'}`} />
                        </button>
                        <Key char="z" altChar="Z" />
                        <Key char="x" altChar="X" />
                        <Key char="c" altChar="C" />
                        <Key char="v" altChar="V" />
                        <Key char="b" altChar="B" />
                        <Key char="n" altChar="N" />
                        <Key char="m" altChar="M" />
                        <Key char="," altChar="<" alwaysShowAlt />
                        <Key char="." altChar=">" alwaysShowAlt />
                        <Key char="/" altChar="?" alwaysShowAlt />
                    </div>
                    <div className="flex flex-row space-x-2">
                        <button
                            type="button"
                            className="w-52 h-24 rounded-lg rounded-bl-2xl text-2xl text-white font-bold bg-gray-800 hover:bg-red-600 duration-200"
                            onClick={() => console.log()}
                        >
                            EXIT
                        </button>
                        <Key char=" " altChar=" " />
                        <button
                            type="button"
                            className="rounded-lg w-72 h-24 rounded-br-2xl text-2xl text-white font-bold  bg-blue-500 hover:bg-blue-700 duration-200"
                            onClick={() => console.log()}
                        >
                            ENTER
                        </button>
                    </div>
                </div>
            </div>
        </keyboardContext.Provider>
    );
};

export default Keyboard;

const Key = (props: {char: string, altChar: string, alwaysShowAlt?: boolean}) => {
    const keyRef = useRef<HTMLButtonElement>(null);
    const context = useContext(keyboardContext);

    const handleKeyPress = () => {
        if (keyRef.current) {
            context.setInputValue(`${context.inputValue} ${context.isShifted ? props.altChar : props.char}`);
        }
    };

    let altText: string;

    if (context.isShifted) {
        altText = props.char;
    } else if (props.alwaysShowAlt) {
        altText = props.altChar;
    } else {
        altText = ' ';
    }

    return (
        <button
            className="w-full h-24 rounded-lg flex items-center justify-center bg-gray-800 hover:bg-gray-900 duration-200"
            type="button"
            ref={keyRef}
            onClick={handleKeyPress}
        >
            {props.alwaysShowAlt
                ? (
                    <div>
                        <h3 className="text-xl h-10 flex items-center justify-center font-semibold text-center text-opacity-40 text-white">{altText}</h3>
                        <h1 className="text-3xl h-10 flex items-center justify-center font-semibold text-white text-center">{context.isShifted ? props.altChar : props.char}</h1>
                    </div>
                )
                : <h1 className="text-4xl font-bold text-white text-center">{context.isShifted ? props.altChar : props.char}</h1>}
        </button>
    );
};

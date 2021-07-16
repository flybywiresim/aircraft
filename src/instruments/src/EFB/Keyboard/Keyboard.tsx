import React, { useContext, useState } from 'react';
import { IconArrowBigTop, IconBackspace, IconArrowNarrowLeft, IconArrowNarrowRight, IconCornerDownLeft } from '@tabler/icons';

export interface KeyboardInputContextType {
    isShown: boolean,
    setIsShown: (v: boolean) => void,
    inputElement: HTMLInputElement | null,
    setInputElement: (i: HTMLInputElement) => void,
}

export const KeyboardInputContext = React.createContext<KeyboardInputContextType>(undefined as any);

const KeyboardContext = React.createContext({ isShifted: false });

const Keyboard = () => {
    const [shifted, setShifted] = useState(false);

    const inputContext = useContext(KeyboardInputContext);

    const handleBackspace = () => {
        if (inputContext.inputElement) {
            inputContext.inputElement.focus(); // Reinstate focus on inputElement
            inputContext.inputElement.value = inputContext.inputElement.value.substring(0, inputContext.inputElement.value.length - 1);
        }
    };

    return (
        <KeyboardContext.Provider value={{ isShifted: shifted }}>
            <div className="absolute inset-x-0 z-50 bottom-0 bg-gray-600" style={{ visibility: inputContext.isShown ? 'visible' : 'hidden' }}>
                <input type="text" value={inputContext.inputElement?.value} className="w-full h-10 text-3xl" />
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
                        <button
                            type="button"
                            className="w-40 h-24 mr-1 rounded-lg flex items-center justify-center
                            flex-shrink-0 text-2xl text-transparent hover:text-red-600 bg-gray-800
                            hover:bg-gray-900 duration-200"
                            onClick={() => handleBackspace()}
                        >
                            <IconBackspace size={44} className="fill-current" style={{ stroke: 'white' }} />
                        </button>
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
                        <Key char="[" altChar="{" alwaysShowAlt />
                        <Key char="]" altChar="}" alwaysShowAlt />
                        <Key char="\" altChar="|" alwaysShowAlt />
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
                        <button
                            type="button"
                            className="rounded-lg w-40 h-24 flex items-center justify-center flex-shrink-0 text-2xl text-white bg-blue-500 hover:bg-blue-700 duration-200"
                            onClick={() => {
                                inputContext.setIsShown(false);
                            }}
                        >
                            <IconCornerDownLeft size={44} />
                        </button>
                    </div>
                    <div className="flex flex-row space-x-2">
                        <button
                            type="button"
                            className="w-48 h-24 text-white bg-gray-800 hover:bg-gray-900 text-2xl flex justify-center items-center flex-shrink-0 rounded-lg duration-200"
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
                        <button
                            type="button"
                            className="w-32 h-24 text-white bg-gray-800 hover:bg-gray-900 text-2xl flex justify-center items-center flex-shrink-0 rounded-lg duration-200"
                            onClick={() => setShifted(!shifted)}
                        >
                            <IconArrowBigTop size={44} fill={`${shifted ? 'white' : 'transparent'}`} />
                        </button>
                    </div>
                    <div className="flex flex-row space-x-2">
                        <Key char=" " altChar=" " />
                        <button
                            type="button"
                            className="w-52 h-24 rounded-lg flex items-center justify-center text-2xl text-white bg-gray-800 hover:bg-gray-900 duration-200"
                            onClick={() => {
                                if (inputContext.inputElement) {
                                    inputContext.inputElement.focus();
                                    inputContext.inputElement.selectionStart!--;
                                    inputContext.inputElement.selectionEnd!--;
                                }
                            }}
                        >
                            <IconArrowNarrowLeft size={44} />
                        </button>
                        <button
                            type="button"
                            className="w-52 h-24 rounded-lg flex items-center justify-center rounded-br-2xl text-2xl text-white bg-gray-800 hover:bg-gray-900 duration-200"
                            onClick={() => {
                                if (inputContext.inputElement) {
                                    inputContext.inputElement.focus();
                                    inputContext.inputElement.selectionStart!++;
                                    inputContext.inputElement.selectionEnd!++;
                                }
                            }}
                        >
                            <IconArrowNarrowRight size={44} />
                        </button>
                    </div>
                </div>
            </div>
        </KeyboardContext.Provider>
    );
};

export default Keyboard;

type KeyProps = {
    char: string,
    altChar: string,
    alwaysShowAlt?: boolean
}

const Key = (props: KeyProps) => {
    const inputContext = useContext(KeyboardInputContext);
    const context = useContext(KeyboardContext);

    const handleKeyPress = () => {
        if (inputContext.inputElement) {
            console.log('this is being called bruhegg');
            inputContext.inputElement.focus();
            inputContext.inputElement.value = `${inputContext.inputElement.value}${context.isShifted ? props.altChar : props.char}`;
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
            onClick={() => handleKeyPress()}
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

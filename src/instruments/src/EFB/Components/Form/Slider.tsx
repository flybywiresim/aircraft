import React, { useRef } from 'react';

import './Slider.scss';

export type SliderProps = { className?: string, value?: number, onInput?: (v: number) => void; };

export const Slider = (props: SliderProps) => {
    const sliderRef = useRef<HTMLInputElement>(null);

    const handleInput = () => {
        const newValue = Number(sliderRef?.current?.value ?? 0);

        if (props.onInput) {
            props.onInput(newValue);
        }
    };

    return (
        <input value={props.value} ref={sliderRef} onChange={handleInput} type="range" min="1" max="100" className={`slider slider h-1 pb-1.5 pt-0.5 rounded-full ${props.className}`} />
    );
};

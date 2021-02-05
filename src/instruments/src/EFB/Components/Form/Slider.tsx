/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useRef } from "react"

import './Slider.scss';

export type SliderProps = { className?: string, value?: number, onInput?: (v: number) => void; };

export const Slider = (props: SliderProps) => {
    const sliderRef = useRef<HTMLInputElement>(null);

    const handleInput = () => {
        const newValue = Number(sliderRef?.current?.value ?? 0);

        if (props.onInput) {
            props.onInput(newValue)
        }
    }

    return (
        <input value={props.value} ref={sliderRef} onChange={handleInput} type="range" min="1" max="100" className={`slider slider w-60 h-1 pb-1.5 pt-0.5 rounded-full ${props.className}`} />
    );
}

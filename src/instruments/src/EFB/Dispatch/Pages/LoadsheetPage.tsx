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

import React, { useRef, useState } from 'react';
import './Loadsheet.scss'

type LoadsheetPageProps = {
    loadsheet: string
};

const LoadSheetWidget = (props: LoadsheetPageProps) => {
    const position = useRef({ top: 0, y: 0 });
    const ref = useRef(null);

	const [fontSize, setFontSize] = useState(14);
	const [imageSize, setImageSize] = useState(1);


    const mouseDownHandler = (event) => {
      position.current.top = ref.current.scrollTop;
      position.current.y = event.clientY;

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event) => {
      const dy = event.clientY - position.current.y;
      ref.current.scrollTop = position.current.top - dy;
    }

    const mouseUpHandler = function () {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

	const fontIncreaseHandler = function () {
		let cFontSize =  fontSize;
		if(cFontSize<22){
			cFontSize+=2;
			handleScaling(cFontSize);
		}
	};

	const fontDecreaseHandler = function () {
		let cFontSize =  fontSize;
		if(cFontSize>14){
			cFontSize-=2;
			handleScaling(cFontSize);
		}
	};

	const handleScaling = (cFontSize) => {
		const pLoadsheet = ref.current.firstChild;
		if(pLoadsheet){
			pLoadsheet.style.fontSize = `${cFontSize}px`;
			pLoadsheet.style.lineHeight = `${cFontSize}px`;
			setFontSize(cFontSize);
		}
	}


    return (
        <div className="px-6">
            <div className="w-full">
				<div className="relative bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4">
				{props.loadsheet !== 'N/A' ?
				<>
					<div className="flex flex-col justify-end absolute bottom-5 right-14">
						<button onClick={fontIncreaseHandler} className="font-size-button">
							+
						</button>
						<button onClick={fontDecreaseHandler} className="font-size-button">
							-
						</button>
					</div>
					<div
						ref={ref}
						className="loadsheet-container show-scrollbar overflow-y-scroll"
						onMouseDown={mouseDownHandler}
						dangerouslySetInnerHTML={{__html: props.loadsheet}} />
				</>
				: "N/A"}
			</div>
            </div>
        </div>
    );
};

export default LoadSheetWidget;

import React, { useRef, useState, useEffect } from 'react';
import './Loadsheet.scss';

type LoadsheetPageProps = {
    loadsheet: string,
};

const LoadSheetWidget = (props: LoadsheetPageProps) => {
    const position = useRef({ top: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const [fontSize, setFontSize] = useState(14);
    const [imageSize, setImageSize] = useState(60);

    useEffect(() => {
        const pImages = ref.current?.getElementsByTagName('img');

        if (pImages) {
            for (let i = 0; i < pImages.length; i++) {
                pImages[i].style.width = `${imageSize}%`;
            }
        }
    }, [imageSize]);

    useEffect(() => {
        const pLoadsheet = ref.current?.firstChild as HTMLElement;

        if (pLoadsheet) {
            pLoadsheet.style.fontSize = `${fontSize}px`;
            pLoadsheet.style.lineHeight = `${fontSize}px`;
        }
    }, [fontSize]);

    const mouseDownHandler = (event) => {
        position.current.top = ref.current ? ref.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event) => {
        const dy = event.clientY - position.current.y;
        if (ref.current) {
            ref.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    const fontIncreaseHandler = () => {
        let cFontSize = fontSize;
        let cImageSize = imageSize;

        if (cFontSize < 26) {
            cFontSize += 2;
            cImageSize += 5;
            handleScaling(cFontSize, cImageSize);
        }
    };

    const fontDecreaseHandler = () => {
        let cFontSize = fontSize;
        let cImageSize = imageSize;

        if (cFontSize > 14) {
            cFontSize -= 2;
            cImageSize -= 5;
            handleScaling(cFontSize, cImageSize);
        }
    };

    const handleScaling = (cFontSize, cImageSize) => {
        setFontSize(cFontSize);
        setImageSize(cImageSize);
    };

    return (
        <div className="px-6">
            <div className="w-full">
                <div className="relative bg-gray-800 rounded-xl p-6 font-mono text-white shadow-lg mr-4">
                    {props.loadsheet !== 'N/A' ? (
                        <>
                            <div className="flex flex-col justify-end absolute bottom-5 right-16">
                                <button
                                    type="button"
                                    onClick={fontIncreaseHandler}
                                    className="font-size-button"
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={fontDecreaseHandler}
                                    className="font-size-button"
                                >
                                    -
                                </button>
                            </div>
                            <div
                                ref={ref}
                                className="loadsheet-container grabbable show-scrollbar overflow-y-scroll"
                                onMouseDown={mouseDownHandler}
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{ __html: props.loadsheet }}
                            />
                        </>
                    ) : (
                        'N/A'
                    )}
                </div>
            </div>
        </div>
    );
};
export default LoadSheetWidget;

import { usePersistentProperty } from '@instruments/common/persistence';
import { IconMinus, IconPlus } from '@tabler/icons';
import React, { useRef, useState, useEffect } from 'react';

type LoadsheetPageProps = {
    loadsheet: string,
};

const LoadSheetWidget = (props: LoadsheetPageProps) => {
    const position = useRef({ top: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const [fontSize, setFontSize] = usePersistentProperty<string>('LOADSHEET_FONTSIZE', '14');
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

    const handleMouseDown = (event) => {
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

    const handleFontIncrease = () => {
        let cFontSize = (Number)(fontSize);
        let cImageSize = imageSize;

        if (cFontSize < 26) {
            cFontSize += 2;
            cImageSize += 5;
            handleScaling(cFontSize, cImageSize);
        }
    };

    const handleFontDecrease = () => {
        let cFontSize = (Number)(fontSize);
        let cImageSize = imageSize;

        if (cFontSize > 14) {
            cFontSize -= 2;
            cImageSize -= 5;
            handleScaling(cFontSize, cImageSize);
        }
    };

    const handleScaling = (cFontSize, cImageSize) => {
        setFontSize((String)(cFontSize));
        setImageSize(cImageSize);
    };

    return (
        <div className="mt-6">
            <div className="w-full">
                <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav relative">
                    {props.loadsheet !== 'N/A' ? (
                        <>
                            <div className="flex flex-col justify-end absolute bottom-6 right-16">
                                <button
                                    type="button"
                                    onClick={handleFontIncrease}
                                    className="z-10 mb-2 bg-navy-regular p-2 rounded-lg bg-opacity-50"
                                >
                                    <IconPlus size={30} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFontDecrease}
                                    className="z-10 bg-navy-regular p-2 rounded-lg bg-opacity-50"
                                >
                                    <IconMinus size={30} />
                                </button>
                            </div>
                            <div
                                ref={ref}
                                className="loadsheet-container grabbable scrollbar overflow-y-scroll"
                                onMouseDown={handleMouseDown}
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{ __html: props.loadsheet }}
                            />
                        </>
                    ) : (
                        <>
                            <div className="h-full flex items-center justify-center text-lg">
                                Please Import Flightplan from Simbrief.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
export default LoadSheetWidget;

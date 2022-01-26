import React, { useRef, useState, useEffect } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FileEarmarkArrowDown, ZoomIn, ZoomOut } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { fetchSimbriefDataAction } from '../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../Store/store';

export const LoadSheetWidget = () => {
    const loadsheet = useAppSelector((state) => state.simbrief.data.loadsheet);

    const ref = useRef<HTMLDivElement>(null);

    const [fontSize, setFontSize] = usePersistentProperty('LOADSHEET_FONTSIZE', '14');
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');

    const [imageSize, setImageSize] = useState(60);

    const dispatch = useAppDispatch();

    useEffect(() => {
        const pImages = ref.current?.getElementsByTagName('img');

        if (pImages) {
            for (let i = 0; i < pImages.length; i++) {
                pImages[i].style.width = `${imageSize}%`;
            }
        }
    }, [imageSize]);

    const [loadSheetStyle, setLoadSheetStyle] = useState({});

    useEffect(() => setLoadSheetStyle({
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize}px`,
    }), [fontSize]);

    function handleFontIncrease() {
        let cFontSize = (Number)(fontSize);
        let cImageSize = imageSize;

        if (cFontSize < 26) {
            cFontSize += 2;
            cImageSize += 5;
            handleScaling(cFontSize, cImageSize);
        }
    }

    function handleFontDecrease() {
        let cFontSize = (Number)(fontSize);
        let cImageSize = imageSize;

        if (cFontSize > 14) {
            cFontSize -= 2;
            cImageSize -= 5;
            handleScaling(cFontSize, cImageSize);
        }
    }

    const handleScaling = (cFontSize, cImageSize) => {
        setFontSize((String)(cFontSize));
        setImageSize(cImageSize);
    };

    return (
        <div className="overflow-hidden relative p-6 mt-4 w-full rounded-lg border-2 shadow-md h-efb border-theme-accent">
            {loadsheet ? (
                <>
                    <div className="absolute top-6 right-16 rounded-md bg-theme-accent">
                        <button
                            type="button"
                            onClick={handleFontDecrease}
                            className="p-2 bg-opacity-50 hover:bg-opacity-100"
                        >
                            <ZoomOut size={30} />
                        </button>
                        <button
                            type="button"
                            onClick={handleFontIncrease}
                            className="p-2 bg-opacity-50 hover:bg-opacity-100"
                        >
                            <ZoomIn size={30} />
                        </button>
                    </div>
                    <ScrollableContainer height={51}>
                        <div
                            ref={ref}
                            className="image-theme"
                            style={loadSheetStyle}
                            dangerouslySetInnerHTML={{ __html: loadsheet }}
                        />
                    </ScrollableContainer>
                </>
            ) : (
                <div className="flex flex-col justify-center items-center space-y-8 h-full text-lg">
                    <h1 className="max-w-4xl text-center">You have not yet imported a flightplan from SimBrief</h1>
                    <button
                        type="button"
                        onClick={() => {
                            fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                                dispatch(action);
                            }).catch((e) => {
                                toast.error(e.message);
                            });
                        }}
                        className="flex justify-center items-center py-2 px-16 space-x-4 rounded-lg border-2 shadow-lg focus:outline-none bg-theme-highlight border-theme-secondary"
                    >
                        <FileEarmarkArrowDown size={26} />
                        <p>Import Flightplan from SimBrief</p>
                    </button>
                </div>
            )}
        </div>
    );
};

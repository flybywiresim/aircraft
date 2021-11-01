import React, { useRef, useState, useEffect } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { IconMinus, IconPlus } from '@tabler/icons';
import { FileEarmarkArrowDown, ZoomIn, ZoomOut } from 'react-bootstrap-icons';
import { fetchSimbriefDataAction } from '../../Store/features/simbrief';
import { useAppDispatch } from '../../Store/store';
import { NotificationTypes, Notification } from '../../UIMessages/Notification';
import { useUIMessages } from '../../UIMessages/Provider';

type LoadsheetPageProps = {
    loadsheet: string,
};

export const LoadSheetWidget = (props: LoadsheetPageProps) => {
    const uiMessages = useUIMessages();

    const position = useRef({ top: 0, y: 0 });
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
        <div className="overflow-hidden relative p-6 mt-4 w-full rounded-lg border-2 shadow-md h-efb border-theme-accent">
            {props.loadsheet !== 'N/A' ? (
                <>
                    <div className="absolute top-6 right-16">
                        <button
                            type="button"
                            onClick={handleFontIncrease}
                            className="z-10 p-2 mb-2 bg-opacity-50 rounded-lg bg-navy-regular"
                        >
                            <ZoomIn size={30} />
                        </button>
                        <button
                            type="button"
                            onClick={handleFontDecrease}
                            className="z-10 p-2 bg-opacity-50 rounded-lg bg-navy-regular"
                        >
                            <ZoomOut size={30} />
                        </button>
                    </div>
                    <div
                        ref={ref}
                        className="overflow-y-scroll loadsheet-container grabbable scrollbar"
                        style={loadSheetStyle}
                        onMouseDown={handleMouseDown}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: props.loadsheet }}
                    />
                </>
            ) : (
                <div className="flex flex-col justify-center items-center space-y-8 h-full text-lg">
                    <h1>You have not yet imported a flightplan from SimBrief</h1>
                    <button
                        type="button"
                        onClick={() => {
                            fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                                dispatch(action);
                            }).catch(() => {
                                uiMessages.pushNotification(
                                    <Notification
                                        type={NotificationTypes.ERROR}
                                        title="SimBrief Error"
                                        message="An error occurred when trying to fetch your SimBrief data."
                                    />,
                                );
                            });
                        }}
                        className="flex justify-center items-center p-2 space-x-4 w-full max-w-lg rounded-lg border-2 shadow-lg focus:outline-none bg-theme-highlight border-theme-secondary"
                    >
                        <FileEarmarkArrowDown size={26} />
                        <p>Import Flightplan from SimBrief</p>
                    </button>
                </div>
            )}
        </div>
    );
};

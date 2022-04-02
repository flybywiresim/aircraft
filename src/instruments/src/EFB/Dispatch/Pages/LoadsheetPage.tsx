/* eslint-disable max-len */
import React, { useRef, useState, useEffect } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { CloudArrowDown, ZoomIn, ZoomOut } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { fetchSimbriefDataAction, isSimbriefDataLoaded } from '../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { setOfpScroll } from '../../Store/features/dispatchPage';

const NoSimBriefDataOverlay = () => {
    const dispatch = useAppDispatch();
    const simbriefDataLoaded = isSimbriefDataLoaded();

    const [simbriefDataPending, setSimbriefDataPending] = useState(false);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');

    const { t } = useTranslation();

    const fetchData = async () => {
        setSimbriefDataPending(true);

        try {
            const action = await fetchSimbriefDataAction(simbriefUserId ?? '');

            dispatch(action);
            dispatch(setOfpScroll(0));
        } catch (e) {
            toast.error(e.message);
        }

        setSimbriefDataPending(false);
    };

    return (
        <div className={`absolute inset-0 transition duration-200 bg-theme-body ${simbriefDataLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <h1 className="flex justify-center items-center w-full h-full">
                {simbriefDataPending ? (
                    <CloudArrowDown className="animate-bounce" size={40} />
                ) : (
                    <>
                        {!simbriefDataLoaded && (
                            <div className="flex flex-col justify-center items-center space-y-8 h-full">
                                <h1 className="max-w-4xl text-center">{t('Dispatch.Ofp.YouHaveNotYetImportedAnySimBriefData')}</h1>
                                <button
                                    type="button"
                                    onClick={fetchData}
                                    className="flex justify-center items-center p-2 space-x-4 w-full rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                                >
                                    <CloudArrowDown size={26} />
                                    <p className="text-current">{t('Dispatch.Ofp.ImportSimBriefData')}</p>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </h1>
        </div>
    );
};

export const LoadSheetWidget = () => {
    const loadsheet = useAppSelector((state) => state.simbrief.data.loadsheet);

    const ref = useRef<HTMLDivElement>(null);

    const [fontSize, setFontSize] = usePersistentProperty('LOADSHEET_FONTSIZE', '14');

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

    const { ofpScroll } = useAppSelector((state) => state.dispatchPage);

    return (
        <div className="overflow-hidden relative p-6 w-full rounded-lg border-2 h-content-section-reduced border-theme-accent">
            <>
                <div className="overflow-hidden absolute top-6 right-16 rounded-md bg-theme-secondary">
                    <TooltipWrapper text="Reduce Font Size">
                        <button
                            type="button"
                            onClick={handleFontDecrease}
                            className="py-2 px-3 bg-opacity-50 hover:bg-opacity-100 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                        >
                            <ZoomOut size={30} />
                        </button>
                    </TooltipWrapper>

                    <TooltipWrapper text="Increase Font Size">
                        <button
                            type="button"
                            onClick={handleFontIncrease}
                            className="py-2 px-3 bg-opacity-50 hover:bg-opacity-100 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                        >
                            <ZoomIn size={30} />
                        </button>
                    </TooltipWrapper>
                </div>
                <ScrollableContainer
                    height={51}
                    onScrollStop={(scroll) => dispatch(setOfpScroll(scroll))}
                    initialScroll={ofpScroll}
                >
                    <div
                        ref={ref}
                        className="image-theme"
                        style={loadSheetStyle}
                        dangerouslySetInnerHTML={{ __html: loadsheet }}
                    />
                </ScrollableContainer>
            </>

            <NoSimBriefDataOverlay />
        </div>
    );
};

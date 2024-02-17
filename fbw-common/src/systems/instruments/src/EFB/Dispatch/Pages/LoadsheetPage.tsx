// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useRef, useState, useEffect } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { CloudArrowDown, ZoomIn, ZoomOut } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import {
    t, TooltipWrapper, ScrollableContainer, fetchSimbriefDataAction,
    isSimbriefDataLoaded, useAppDispatch, useAppSelector, setOfpScroll,
} from '@flybywiresim/flypad';

const NoSimBriefDataOverlay = () => {
    const dispatch = useAppDispatch();
    const simbriefDataLoaded = isSimbriefDataLoaded();

    const [simbriefDataPending, setSimbriefDataPending] = useState(false);
    const [navigraphUsername] = usePersistentProperty('NAVIGRAPH_USERNAME');
    const [overrideSimBriefUserID] = usePersistentProperty('CONFIG_OVERRIDE_SIMBRIEF_USERID');

    const fetchData = async () => {
        setSimbriefDataPending(true);

        try {
            const action = await fetchSimbriefDataAction(navigraphUsername ?? '', overrideSimBriefUserID ?? '');

            dispatch(action);
            dispatch(setOfpScroll(0));
        } catch (e) {
            toast.error(e.message);
        }

        setSimbriefDataPending(false);
    };

    return (
        <div className={`absolute inset-0 bg-theme-body transition duration-200 ${simbriefDataLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
            <h1 className="flex h-full w-full items-center justify-center">
                {simbriefDataPending ? (
                    <CloudArrowDown className="animate-bounce" size={40} />
                ) : (
                    <>
                        {!simbriefDataLoaded && (
                            <div className="flex h-full flex-col items-center justify-center space-y-8">
                                <h1 className="max-w-4xl text-center">{t('Dispatch.Ofp.YouHaveNotYetImportedAnySimBriefData')}</h1>
                                <button
                                    type="button"
                                    onClick={fetchData}
                                    className="flex w-full items-center justify-center space-x-4 rounded-md border-2 border-theme-highlight bg-theme-highlight p-2 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
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
        <div className="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
            <>
                <div className="absolute right-16 top-6 overflow-hidden rounded-md bg-theme-secondary">
                    <TooltipWrapper text={t('Dispatch.Ofp.TT.ReduceFontSize')}>
                        <button
                            type="button"
                            onClick={handleFontDecrease}
                            className="bg-opacity-50 px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:bg-opacity-100 hover:text-theme-body"
                        >
                            <ZoomOut size={30} />
                        </button>
                    </TooltipWrapper>

                    <TooltipWrapper text={t('Dispatch.Ofp.TT.IncreaseFontSize')}>
                        <button
                            type="button"
                            onClick={handleFontIncrease}
                            className="bg-opacity-50 px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:bg-opacity-100 hover:text-theme-body"
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

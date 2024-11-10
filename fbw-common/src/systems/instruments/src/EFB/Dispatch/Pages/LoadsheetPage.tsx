// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { ZoomIn, ZoomOut, List } from 'react-bootstrap-icons';

import {
  t,
  TooltipWrapper,
  ScrollableContainer,
  isSimbriefDataLoaded,
  useAppDispatch,
  useAppSelector,
  setOfpScroll,
} from '@flybywiresim/flypad';

const loadsheetSections = [
  'All',
  'Summary and Fuel',
  'Routing and Impacts',
  'Times and Weights',
  'Flight Log',
  'Wind Information',
  'ATC Flight Plan',
  'Additional Info',
  'Runway Analysis',
  'Airport WX List',
  'NOTAM',
  'Company NOTAM',
];

export const LoadSheetWidget = () => {
  const loadsheet = useAppSelector((state) => state.simbrief.data.loadsheet);

  const ref = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = usePersistentProperty('LOADSHEET_FONTSIZE', '14');

  const [imageSize, setImageSize] = useState(60);

  const dispatch = useAppDispatch();

  const [isLoadsheetNavVisible, setLoadsheetNavVisible] = useState(false);

  const loadsheetNavRef = useRef(null);

  const [currentLoadsheetSection, setCurrentLoadsheetSection] = usePersistentProperty(
    'LOADSHEET_ACTIVE_SECTION',
    'All',
  );

  useEffect(() => {
    const pImages = ref.current?.getElementsByTagName('img');

    if (pImages) {
      for (let i = 0; i < pImages.length; i++) {
        pImages[i].style.width = `${imageSize}%`;
      }
    }
  }, [imageSize]);

  const [loadSheetStyle, setLoadSheetStyle] = useState({});

  useEffect(
    () =>
      setLoadSheetStyle({
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize}px`,
      }),
    [fontSize],
  );

  function handleFontIncrease() {
    let cFontSize = Number(fontSize);
    let cImageSize = imageSize;

    if (cFontSize < 26) {
      cFontSize += 2;
      cImageSize += 5;
      handleScaling(cFontSize, cImageSize);
    }
  }

  function handleFontDecrease() {
    let cFontSize = Number(fontSize);
    let cImageSize = imageSize;

    if (cFontSize > 14) {
      cFontSize -= 2;
      cImageSize -= 5;
      handleScaling(cFontSize, cImageSize);
    }
  }

  const handleScaling = (cFontSize, cImageSize) => {
    setFontSize(String(cFontSize));
    setImageSize(cImageSize);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (loadsheetNavRef.current && !loadsheetNavRef.current.contains(event.target)) {
      setLoadsheetNavVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  const filterLoadsheetSection = useCallback(
    (section) => {
      if (section != 'All') {
        const sectionMarkerPattern = new RegExp(
          `<!--BKMK///${section}///\\d-->[\\s\\S]*?(?=<!--BKMK///(?!${section})[^/]+///\\d-->|$)`,
          'g',
        );

        const match = loadsheet.match(sectionMarkerPattern);

        if (match && match.length > 0) {
          return match[0].replace(new RegExp(`<!--BKMK///${section}///\\d-->`), '').trim();
        }
      } else {
        return loadsheet;
      }
    },
    [loadsheet],
  );

  const { ofpScroll } = useAppSelector((state) => state.dispatchPage);

  return (
    <div className="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
      {isSimbriefDataLoaded() ? (
        <>
          <button
            onClick={() => setLoadsheetNavVisible((prev) => !prev)}
            className="relative rounded-lg bg-theme-secondary px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
            ref={loadsheetNavRef}
          >
            <List size={30} />
            <div
              className={`absolute left-0 top-full mt-2 w-60 rounded-lg bg-theme-secondary p-4 transition-all duration-75 ${
                isLoadsheetNavVisible
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-[-40px] opacity-0'
              }`}
            >
              {loadsheetSections.map((section) => (
                <button
                  key={section}
                  className="block w-full rounded-md px-3 py-2 text-left transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  onClick={() => setCurrentLoadsheetSection(section)}
                >
                  {section}
                </button>
              ))}
            </div>
          </button>
          <div className="absolute right-16 top-6 overflow-hidden rounded-md bg-theme-secondary">
            <TooltipWrapper text={t('Dispatch.Ofp.TT.ReduceFontSize')}>
              <button
                type="button"
                onClick={handleFontDecrease}
                className="px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
              >
                <ZoomOut size={30} />
              </button>
            </TooltipWrapper>

            <TooltipWrapper text={t('Dispatch.Ofp.TT.IncreaseFontSize')}>
              <button
                type="button"
                onClick={handleFontIncrease}
                className="px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
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
              dangerouslySetInnerHTML={{
                __html: `<pre>\n\n${filterLoadsheetSection(currentLoadsheetSection)}\n</pre>`,
              }}
            />
          </ScrollableContainer>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center space-y-8">
          <h1 className="max-w-4xl text-center">{t('Dispatch.Ofp.YouHaveNotYetImportedAnySimBriefData')}</h1>
        </div>
      )}
    </div>
  );
};

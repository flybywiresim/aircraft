// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { ZoomIn, ZoomOut } from 'react-bootstrap-icons';

import {
  t,
  TooltipWrapper,
  ScrollableContainer,
  isSimbriefDataLoaded,
  useAppDispatch,
  useAppSelector,
  setOfpScroll,
} from '@flybywiresim/flypad';

import supportedOFPLayouts from '../../Apis/Simbrief/ofpLayouts.json';

export const LoadSheetWidget = () => {
  const loadsheet = useAppSelector((state) => state.simbrief.data.loadsheet);

  const ofpLayout = useAppSelector((state) => state.simbrief.data.ofpLayout);

  const loadsheetSections = supportedOFPLayouts[ofpLayout] || null;

  const ref = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = usePersistentProperty('LOADSHEET_FONTSIZE', '14');

  const [imageSize, setImageSize] = useState(60);

  const dispatch = useAppDispatch();

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

  const filterLoadsheetSection = useCallback(
    (section) => {
      if (section !== 'All') {
        const currentIndex = loadsheetSections.indexOf(section);

        const nextSection =
          currentIndex !== -1 && currentIndex + 1 < loadsheetSections.length
            ? loadsheetSections[currentIndex + 1]
            : null;

        const sectionMarkerPattern = new RegExp(
          `<!--BKMK///${section}///\\d-->[\\s\\S]*?(?=<!--BKMK///${nextSection || ''}///\\d-->|$)`,
          'g',
        );

        const filteredLoadsheet = loadsheet.match(sectionMarkerPattern);

        if (filteredLoadsheet && filteredLoadsheet.length > 0) {
          return `
            \n<pre>${filteredLoadsheet[0]
              .replace(/^<div [^>]+>/, '')
              .replace(/<\/div>$/, '')
              .replace(/font-size:\s*\d+px;?/g, '')
              .replace(/font-family:\s*[^;]+;/g, '')
              .replace(/font-size:\s*\d+px;?/g, '')
              .replace(/line-height:\s*\d+(\.\d+)?(px)?;?/g, '')}
            </pre>\n`;
        }
      } else
        return `
          \n${loadsheet
            .replace(/^<div [^>]+>/, '')
            .replace(/<\/div>$/, '')
            .replace(/font-size:\s*\d+px;?/g, '')
            .replace(/font-family:\s*[^;]+;/g, '')
            .replace(/font-size:\s*\d+px;?/g, '')
            .replace(/line-height:\s*\d+(\.\d+)?(px)?;?/g, '')}
          \n`;
    },
    [loadsheet],
  );

  const { ofpScroll } = useAppSelector((state) => state.dispatchPage);

  return (
    <div className="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
      {isSimbriefDataLoaded() ? (
        <>
          {loadsheetSections && (
            <div className="relative w-60">
              <SelectInput
                className="w-60"
                value={currentLoadsheetSection}
                onChange={(value) => setCurrentLoadsheetSection(value as string)}
                options={loadsheetSections.map((section) => ({
                  value: section,
                  displayValue: `${section}`,
                  borderColor: 'text-theme-body',
                }))}
                maxHeight={32}
              />
            </div>
          )}
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
                __html: filterLoadsheetSection(currentLoadsheetSection),
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

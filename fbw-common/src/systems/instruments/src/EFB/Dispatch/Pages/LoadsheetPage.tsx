// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useRef, useState, useEffect } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'react-bootstrap-icons';

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

  const [isSimbriefLoadsheetNavigationEnabled] = usePersistentProperty('CONFIG_SIMBRIEF_LOADSHEET_NAVIGATION');

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

  function handleSectionUp() {
    const currentIndex = loadsheetSections.indexOf(currentLoadsheetSection);
    if (currentIndex > 0) {
      const previousSection = loadsheetSections[currentIndex - 1];
      setCurrentLoadsheetSection(previousSection);
    }
  }

  function handleSectionDown() {
    const currentIndex = loadsheetSections.indexOf(currentLoadsheetSection);
    if (currentIndex < loadsheetSections.length - 1) {
      const nextSection = loadsheetSections[currentIndex + 1];
      setCurrentLoadsheetSection(nextSection);
    }
  }

  function filterLoadsheetSection(section) {
    const cleanStyles = (html) => {
      return html
        .replace(/line-height:\s*\d+(\.\d+)?(px)?;?/g, '')
        .replace(/font-size:\s*\d+px;?/g, '')
        .replace(/font-family:\s*[^;]+;/g, '')
        .replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '');
    };

    if (['Maps', 'Map', 'UAD Charts'].includes(section)) {
      const anchorPattern = /<a\s+class="ofpmaplink"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      const filteredAnchors = [...loadsheet.matchAll(anchorPattern)].map((match) => ({
        href: match[1],
        innerHTML: match[2],
      }));

      return `
            ${filteredAnchors.map(({ href, innerHTML }) => `<a href="${href}" target="_blank">${innerHTML}</a>`).join('\n')}
        `;
    }

    if (section !== 'All') {
      const currentIndex = loadsheetSections.indexOf(section);
      let nextSection = currentIndex + 1 < loadsheetSections.length ? loadsheetSections[currentIndex + 1] : null;
      if (['Maps', 'Map', 'UAD Charts'].includes(nextSection)) {
        nextSection = currentIndex + 2 < loadsheetSections.length ? loadsheetSections[currentIndex + 2] : null;
      }

      const sectionMarkerPattern = new RegExp(
        `<!--BKMK///${section}///\\d-->[\\s\\S]*?(?=<!--BKMK///${nextSection || ''}///\\d-->|$)`,
        'g',
      );

      const filteredLoadsheet = loadsheet.match(sectionMarkerPattern);
      if (filteredLoadsheet && filteredLoadsheet.length > 0) {
        return `\n<pre>${cleanStyles(filteredLoadsheet[0])}</pre>\n`;
      } else {
        return `\nInfo not available or section not enabled in Simbrief.\n`;
      }
    }
    return `\n${cleanStyles(loadsheet)}</pre>\n`;
  }

  const handleScaling = (cFontSize, cImageSize) => {
    setFontSize(String(cFontSize));
    setImageSize(cImageSize);
  };

  const { ofpScroll } = useAppSelector((state) => state.dispatchPage);

  return (
    <div className="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
      {isSimbriefDataLoaded() ? (
        <>
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
          {loadsheetSections && isSimbriefLoadsheetNavigationEnabled === 'ENABLED' && (
            <>
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
              <div className="absolute bottom-6 right-16 overflow-hidden rounded-md bg-theme-secondary">
                <div className="flex flex-col">
                  <TooltipWrapper text={t('Dispatch.Ofp.TT.PreviousLoadsheetSection')}>
                    <button
                      type="button"
                      onClick={handleSectionUp}
                      className="px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body disabled:pointer-events-none disabled:opacity-10"
                      disabled={currentLoadsheetSection === 'All'}
                    >
                      <ChevronUp size={30} />
                    </button>
                  </TooltipWrapper>
                  <TooltipWrapper text={t('Dispatch.Ofp.TT.NextLoadsheetSection')}>
                    <button
                      type="button"
                      onClick={handleSectionDown}
                      className="px-3 py-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body disabled:pointer-events-none disabled:opacity-10"
                      disabled={currentLoadsheetSection === loadsheetSections[loadsheetSections.length - 1]}
                    >
                      <ChevronDown size={30} />
                    </button>
                  </TooltipWrapper>
                </div>
              </div>
            </>
          )}
          <ScrollableContainer
            height={51}
            onScrollStop={(scroll) => dispatch(setOfpScroll(scroll))}
            initialScroll={ofpScroll}
            triggerScrollReset={currentLoadsheetSection}
          >
            <div
              ref={ref}
              className="image-theme"
              style={loadSheetStyle}
              dangerouslySetInnerHTML={{
                __html:
                  isSimbriefLoadsheetNavigationEnabled === 'ENABLED'
                    ? filterLoadsheetSection(currentLoadsheetSection)
                    : loadsheet,
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

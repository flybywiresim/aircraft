// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState, memo } from 'react';
import { useInteractionEvents } from '@flybywiresim/fbw-sdk';
import { MailboxStatusMessage } from '@datalink/common';
import { Checkerboard } from './Checkerboard';

interface MessageViewData {
  wordOffset: number;
  lineOffset: number;
  highlightActive: boolean;
  view: string[][];
  pageCount: number;
}

type MessageVisualizationProps = {
  messageUid: number;
  message: string;
  backgroundColor: [number, number, number];
  keepNewlines?: boolean;
  messageIsReminder: boolean;
  ignoreHighlight: boolean;
  cssClass: string;
  yStart: number;
  deltaY: number;
  seperatorLine?: number;
  watchdogIndices?: number[];
  updateSystemStatusMessage: (status: MailboxStatusMessage) => void;
  reachedEndOfMessage: (uid: number, reachedEnd: boolean) => void;
};

const renderMessageView = (
  view: MessageViewData,
  backgroundIdx: number,
  yStart: number,
  deltaY: number,
  reminder: boolean,
  ignoreHighlight: boolean,
  watchdogIndices: number[],
): React.ReactNode => {
  const renderWord = (
    word: string,
    highlight: boolean,
    watchdog: boolean,
    backgroundActive: boolean,
    coordinate?: [number, number],
  ): React.ReactNode => {
    const monitoring = watchdog && !ignoreHighlight;
    let className = 'message-tspan';
    if (!reminder) {
      if (backgroundActive) {
        className += ' message-onbackground';
      } else if (monitoring) {
        className += ' message-monitoring';
      } else if (highlight) {
        className += ' message-highlight';
      }
    }

    return (
      <tspan
        x={coordinate ? coordinate[0] : undefined}
        dy={coordinate ? coordinate[1] : undefined}
        className={className}
      >
        {`${word.replace(/@/gi, '')}\xa0`}
      </tspan>
    );
  };

  return view.view.map((line, lineIndex) => (
    <>
      {line.map((word, wordIndex) => {
        const highlightWord = view.highlightActive || word.startsWith('@') === true;

        const node = renderWord(
          word,
          highlightWord,
          watchdogIndices.findIndex((elem) => elem === view.wordOffset) !== -1,
          backgroundIdx <= lineIndex,
          wordIndex === 0 ? [224, lineIndex === 0 ? yStart : deltaY] : undefined,
        );

        view.highlightActive = highlightWord && word.endsWith('@') === false;
        view.wordOffset += 1;

        return node;
      })}
    </>
  ));
};

const createMessageView = (message: string, keepNewlines: boolean, pageIndex: number): MessageViewData => {
  // remove new lines if not required
  if (!keepNewlines) {
    message = message.replace(/\n/gi, ' ');
  }

  // replace forced new line strings by newlines
  message = message.replace(/_/gi, '\n');

  // split the string into words, but keep the newlines
  const wordsAndNewlines = message.split(/(\n)|\s+/).filter(Boolean);

  // create the lines with respect to the newlines
  const lines: string[][] = [[]];
  wordsAndNewlines.forEach((word) => {
    if (word === '\n') {
      // create a new line only if words are inserted in the last line
      if (lines.length > 0 && lines[lines.length - 1].length > 0) {
        lines.push([]);
      }
      return;
    }

    // get the character count of the line (incl. whitespaces per word)
    let totalLineLength = lines[lines.length - 1].reduce((sum, str) => sum + str.length, 0);
    totalLineLength += lines[lines.length - 1].length - 1;

    // get the length of the new word and ignore the highlight characters
    const newWordLength = word.replace('@', '').length;

    // check if we reached the maximum number of characters (words + whitespaces)
    if (totalLineLength + newWordLength + 1 <= 30) {
      lines[lines.length - 1].push(word);
    } else {
      lines.push([word]);
    }
  });

  const pageChunks: string[][][] = [];
  let visibleLines: string[][] | undefined = undefined;
  let highlighted = false;
  let wordOffset = 0;

  // split the lines into chunks
  // the first page shows only new lines -> add five lines
  // all following pages show the last line of the previous pages -> split into four lines
  pageChunks.push(lines.slice(0, 5));
  for (let i = 5; i < lines.length; i += 4) {
    pageChunks.push(lines.slice(i, i + 4));
  }

  const chunkViewIndex = Math.max(0, Math.min(pageChunks.length - 1, pageIndex));

  // calculate the rendering parameters before the unshift as the original page is relevant
  const predecessorWords = pageChunks
    .slice(0, chunkViewIndex)
    .reduce((acc, value) => acc.concat(value), [])
    .reduce((acc, value) => acc.concat(value), []);
  wordOffset = predecessorWords.length;

  // get all highlight words and check the last one if it is the start or end of a highlight marker
  const highlights = predecessorWords.filter((str) => str.startsWith('@') || str.endsWith('@'));
  if (highlights.length !== 0) {
    highlighted = highlights[highlights.length - 1].endsWith('@') === false;
  }

  // repeat the last line of the previous page
  for (let i = pageChunks.length - 1; i >= 1; --i) {
    pageChunks[i].unshift(pageChunks[i - 1][i === 1 ? 4 : 3]);
  }

  // get the word offset for the page and ignore special newline entries
  visibleLines = pageChunks[chunkViewIndex];

  return {
    wordOffset,
    lineOffset: chunkViewIndex === 0 ? 0 : 5 + (chunkViewIndex - 1) * 4,
    highlightActive: highlighted,
    view: visibleLines,
    pageCount: pageChunks.length,
  };
};

export const MessageVisualization: React.FC<MessageVisualizationProps> = memo(
  ({
    messageUid,
    message,
    backgroundColor,
    messageIsReminder,
    keepNewlines = false,
    ignoreHighlight,
    cssClass,
    yStart,
    deltaY,
    seperatorLine = null,
    watchdogIndices = [],
    updateSystemStatusMessage,
    reachedEndOfMessage,
  }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const maxLines = 5;

    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEMINUS', 'A32NX_DCDU_BTN_MPR_POEMINUS'], () => {
      if (pageCount === 0) {
        return;
      }

      reachedEndOfMessage(messageUid, pageCount === 1);
      if (pageIndex > 0) {
        updateSystemStatusMessage(MailboxStatusMessage.NoMessage);
        setPageIndex(pageIndex - 1);
      } else {
        updateSystemStatusMessage(MailboxStatusMessage.NoMorePages);
      }
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEPLUS', 'A32NX_DCDU_BTN_MPR_POEPLUS'], () => {
      if (pageCount === 0) {
        return;
      }

      // actual pageIndex is the one below and the index starts at 0 -> increase by one
      reachedEndOfMessage(messageUid, pageCount <= pageIndex + 2);
      if (pageCount > pageIndex + 1) {
        updateSystemStatusMessage(MailboxStatusMessage.NoMessage);
        setPageIndex(pageIndex + 1);
      } else {
        updateSystemStatusMessage(MailboxStatusMessage.NoMorePages);
      }
    });

    if (message.length === 0) {
      return <></>;
    }

    const messageView = createMessageView(message, keepNewlines, pageIndex);
    const messageViewLineEnd = messageView.lineOffset + messageView.view.length;
    if (messageView.pageCount !== pageCount) {
      reachedEndOfMessage(messageUid, messageView.pageCount === 1);
      setPageCount(messageView.pageCount);
      setPageIndex(0);
    }

    // no text defined
    if (messageView.pageCount === 0) {
      return <></>;
    }

    // calculate the position of the background rectangle
    let backgroundY = 520;
    let contentHeight = 120;
    let backgroundNeeded = false;
    if (backgroundColor[0] !== 0 || backgroundColor[1] !== 0 || backgroundColor[2] !== 0) {
      if (seperatorLine) {
        backgroundNeeded = true;
        if (seperatorLine <= messageView.lineOffset) {
          // first line contains downlink message
          contentHeight += messageView.view.length * 220;
        } else if (seperatorLine < messageViewLineEnd) {
          // mix of uplink and downlink message
          contentHeight += (messageViewLineEnd - seperatorLine) * 220;
          backgroundY += (messageView.view.length - (messageViewLineEnd - seperatorLine)) * 220;
        } else {
          backgroundNeeded = false;
        }
      } else {
        contentHeight += messageView.view.length * 220;
        backgroundNeeded = true;
      }
    }
    const rgb = `rgb(${backgroundColor[0]},${backgroundColor[1]},${backgroundColor[2]})`;
    let backgroundIdx = maxLines;
    if (backgroundNeeded) {
      if (seperatorLine) {
        backgroundIdx = seperatorLine - messageView.lineOffset;
      } else {
        backgroundIdx = 0;
      }
    }

    return (
      <>
        {backgroundNeeded && (
          <Checkerboard x={130} y={backgroundY} width={3600} height={contentHeight} cellSize={10} fill={rgb} />
        )}
        <text className={cssClass}>
          {renderMessageView(
            messageView,
            backgroundIdx,
            yStart,
            deltaY,
            messageIsReminder,
            ignoreHighlight,
            watchdogIndices,
          )}
        </text>
        {pageCount > 1 && (
          <>
            <text className="status-atsu" fill="white" x="65%" y="2480">
              PG
            </text>
            <text className="status-atsu" fill="white" x="65%" y="2720">
              {pageIndex + 1} / {pageCount}
            </text>
          </>
        )}
      </>
    );
  },
);

//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export function wordWrap(text: string, maxLength: number) {
    const result = [];
    let line = [];
    let length = 0;

    text.split(' ').forEach((word) => {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(' ').toUpperCase());
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });

    if (line.length > 0) {
        result.push(line.join(' ').toUpperCase());
    }

    return result;
}

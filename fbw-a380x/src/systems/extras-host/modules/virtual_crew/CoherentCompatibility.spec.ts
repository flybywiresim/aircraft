// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * The instruments of the simulator run in Coherent GT, which only supports ES2017. esbuild transpiles the newer syntax,
 * but not the newer built-in functions: one of them makes the module fail when it is loaded, which the tests (run in
 * Node.js) do not show.
 */
const UNSUPPORTED_APIS: [RegExp, string][] = [
  [/\.flatMap\(/, 'Array.prototype.flatMap (ES2019), use reduce or ArrayUtils.flatMap'],
  [/\.flat\(/, 'Array.prototype.flat (ES2019)'],
  [/Object\.fromEntries\(/, 'Object.fromEntries (ES2019)'],
  [/\.matchAll\(/, 'String.prototype.matchAll (ES2020)'],
  [/\.replaceAll\(/, 'String.prototype.replaceAll (ES2021)'],
  [/\.trimStart\(|\.trimEnd\(/, 'String.prototype.trimStart/trimEnd (ES2019)'],
  [/\.at\(-?\d/, 'Array.prototype.at (ES2022)'],
  [/\.findLast(Index)?\(/, 'Array.prototype.findLast (ES2023)'],
  [/Promise\.allSettled\(|Promise\.any\(/, 'Promise.allSettled/any (ES2020/2021)'],
  [/structuredClone\(/, 'structuredClone'],
];

const SHIPPED_SOURCES = [
  __dirname,
  join(__dirname, '../../../shared/src/VirtualCrew.ts'),
  join(__dirname, '../../../instruments/src/EFB/Pages/CrewPage.tsx'),
  join(__dirname, '../../../instruments/src/EFB/Pages/VirtualCrewPage.tsx'),
];

const sourceFiles = (path: string): string[] =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((entry) => sourceFiles(join(path, entry)))
    : /\.tsx?$/.test(path) && !/\.(spec|testing)\.tsx?$/.test(path)
      ? [path]
      : [];

describe('virtual crew compatibility with Coherent GT', () => {
  it('uses no built-in function newer than ES2017 in the shipped code', () => {
    const violations = SHIPPED_SOURCES.flatMap(sourceFiles).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        // comments may mention the functions
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .flatMap((line) =>
          UNSUPPORTED_APIS.filter(([pattern]) => pattern.test(line)).map(([, api]) => `${file}: ${api}`),
        ),
    );
    expect(violations).toEqual([]);
  });
});

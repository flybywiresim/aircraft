// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { BuildInfo } from './BuildInfo';

describe('BuildInfo.getVersionInfo()', () => {
    it('should throw error on malformed version info strings.', () => {
        expect(() => BuildInfo.getVersionInfo('v0.0.0master.00000000')).toThrow();
        expect(() => BuildInfo.getVersionInfo('v0.0.0-master.012345678')).toThrow();
        expect(() => BuildInfo.getVersionInfo('v0.0-master.01234567')).toThrow();
        expect(() => BuildInfo.getVersionInfo('version0.0.0-master.0123456')).toThrow();
    });
    it('should not throw error on well formed version info strings.', () => {
        expect(() => BuildInfo.getVersionInfo('v0.0.0-master.0000000')).not.toThrow();
        expect(() => BuildInfo.getVersionInfo('0.10.0-version-selfcheck.9e48327')).not.toThrow();
        expect(() => BuildInfo.getVersionInfo('v0.10.0-version-selfcheck.9e48327')).not.toThrow();
    });
    it('should return correct version info.', () => {
        expect(BuildInfo.getVersionInfo('v0.0.0-master.0000000')).toStrictEqual({
            version: '0.0.0',
            major: 0,
            minor: 0,
            patch: 0,
            branch: 'master',
            commit: '0000000',
        });
        expect(BuildInfo.getVersionInfo('v0.10.0-version-selfcheck.9e48327')).toStrictEqual({
            version: '0.10.0',
            major: 0,
            minor: 10,
            patch: 0,
            branch: 'version-selfcheck',
            commit: '9e48327',
        });
    });
});

describe('BuildInfo.BuildInfo.versionCompare()', () => {
    it('should not throw error on well formed version strings.', () => {
        expect(() => BuildInfo.versionCompare('v0.0.0', 'v0.0.0')).not.toThrow();
        expect(() => BuildInfo.versionCompare('0.0.0', 'v1.0.0')).not.toThrow();
        expect(() => BuildInfo.versionCompare('v0.1.0', '0.0.1')).not.toThrow();
    });
    it('should throw error when malformed version strings are provided.', () => {
        expect(() => BuildInfo.versionCompare('', '')).toThrow();
        expect(() => BuildInfo.versionCompare('v1.0.0', '')).toThrow();
        expect(() => BuildInfo.versionCompare('', 'v1.0.0')).toThrow();
        expect(() => BuildInfo.versionCompare('v.1.0.0', 'v1.0.0')).toThrow();
    });
    it('should return correct version comparison.', () => {
        expect(BuildInfo.versionCompare('v0.0.0', 'v0.0.0')).toBe(0);
        expect(BuildInfo.versionCompare('v0.0.0', 'v0.0.1')).toBe(-1);
        expect(BuildInfo.versionCompare('v0.0.1', 'v0.0.0')).toBe(1);
        expect(BuildInfo.versionCompare('v0.0.0', 'v0.1.0')).toBe(-1);
        expect(BuildInfo.versionCompare('v0.1.0', 'v0.0.0')).toBe(1);
        expect(BuildInfo.versionCompare('v0.0.0', 'v1.0.0')).toBe(-1);
        expect(BuildInfo.versionCompare('v1.0.0', 'v0.0.0')).toBe(1);
    });
});

// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftVersionChecker } from './AircraftVersionChecker';

describe('AircraftVersionChecker.getVersionInfo()', () => {
    it('should throw error on malformed version info strings.', () => {
        expect(() => AircraftVersionChecker.getVersionInfo('v0.0.0master.00000000')).toThrow();
        expect(() => AircraftVersionChecker.getVersionInfo('v0.0.0-master.012345678')).toThrow();
        expect(() => AircraftVersionChecker.getVersionInfo('v0.0-master.01234567')).toThrow();
        expect(() => AircraftVersionChecker.getVersionInfo('version0.0.0-master.0123456')).toThrow();
    });
    it('should not throw error on well formed version info strings.', () => {
        expect(() => AircraftVersionChecker.getVersionInfo('v0.0.0-master.0000000')).not.toThrow();
        expect(() => AircraftVersionChecker.getVersionInfo('0.10.0-version-selfcheck.9e48327')).not.toThrow();
        expect(() => AircraftVersionChecker.getVersionInfo('v0.10.0-version-selfcheck.9e48327')).not.toThrow();
    });
    it('should return correct version info.', () => {
        expect(AircraftVersionChecker.getVersionInfo('v0.0.0-master.0000000')).toStrictEqual({
            version: '0.0.0',
            major: 0,
            minor: 0,
            patch: 0,
            branch: 'master',
            commit: '0000000',
        });
        expect(AircraftVersionChecker.getVersionInfo('v0.10.0-version-selfcheck.9e48327')).toStrictEqual({
            version: '0.10.0',
            major: 0,
            minor: 10,
            patch: 0,
            branch: 'version-selfcheck',
            commit: '9e48327',
        });
    });
});

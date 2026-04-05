// Copyright (c) 2021-2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { describe, beforeEach, it, expect, vi } from 'vitest';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { FlightPlanManager } from './FlightPlanManager';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';
import {
  FlightPlanBatchChangeEvent,
  FlightPlanEvents,
  FlightPlanSetFixInfoEntryEvent,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { FlightPlanBatch } from '@fmgc/flightplanning/plans/FlightPlanBatch';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

describe('FlightPlanManager', () => {
  const ctx = { syncClientID: Math.round(Math.random() * 10_000_000), batchStack: [] };
  const fpm = new FlightPlanManager(ctx, testEventBus, new A320FlightPlanPerformanceData(), ctx.syncClientID, true);

  beforeEach(() => {
    setupTestDatabase();

    fpm.deleteAll();
  });

  it('can create a flight plan', () => {
    fpm.create(1);

    expect(fpm.get(1)).not.toBeNull();
  });

  it('can delete a flight plan', () => {
    fpm.create(1);
    fpm.delete(1);

    expect(() => fpm.get(1)).toThrow();
  });

  it('can copy a flight plan', async () => {
    fpm.create(1);

    const flightPlan = fpm.get(1);

    await flightPlan.setOriginAirport('CYYZ');
    await flightPlan.setOriginRunway('CYYZ06R');

    fpm.copy(1, 2);

    const copied = fpm.get(2);

    expect(copied.originAirport).toEqual(expect.objectContaining({ ident: 'CYYZ' }));
    expect(copied.originRunway).toEqual(expect.objectContaining({ ident: 'CYYZ06R' }));
  });

  it('can swap two flight plans', async () => {
    fpm.create(1);

    const flightPlanA = fpm.get(1);

    await flightPlanA.setOriginAirport('CYYZ');
    await flightPlanA.setOriginRunway('CYYZ06R');

    fpm.create(2);

    const flightPlanB = fpm.get(2);

    await flightPlanB.setOriginAirport('CYVR');
    await flightPlanB.setOriginRunway('CYVR08R');

    fpm.swap(1, 2);

    const newA = fpm.get(2);

    expect(newA.originAirport).toEqual(expect.objectContaining({ ident: 'CYYZ' }));
    expect(newA.originRunway).toEqual(expect.objectContaining({ ident: 'CYYZ06R' }));

    const newB = fpm.get(1);

    expect(newB.originAirport).toEqual(expect.objectContaining({ ident: 'CYVR' }));
    expect(newB.originRunway).toEqual(expect.objectContaining({ ident: 'CYVR08R' }));
  });

  describe('batches', () => {
    it('can open a flight plan batch', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlanService.batchChange').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const batch = await fpm.openBatch('test_batch');

      expect(batch).toBeTruthy();
      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          syncClientID: ctx.syncClientID,
          type: 'open',
          batchStack: [expect.objectContaining<Partial<FlightPlanBatch>>({ id: batch.id, name: 'test_batch' })],
          batch: expect.objectContaining<Partial<FlightPlanBatch>>({ id: batch.id, name: 'test_batch' }),
        } satisfies Partial<FlightPlanBatchChangeEvent>),
      );

      await fpm.closeBatch(batch.id);
    });

    it('can open a flight plan batch and then close it', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      const batch = await fpm.openBatch('test_batch');

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlanService.batchChange').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const closedBatch = await fpm.closeBatch(batch.id);

      expect(closedBatch.id).toBe(batch.id);
      expect(closedBatch.name).toBe(batch.name);
      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ type: 'close' } satisfies Partial<FlightPlanBatchChangeEvent>),
      );
    });

    it('cannot close a batch that is not the innermost one', async () => {
      const batch1 = await fpm.openBatch('test_batch_1');
      const batch2 = await fpm.openBatch('test_batch_2');

      await expect(fpm.closeBatch(batch1.id)).rejects.toThrow();

      await fpm.closeBatch(batch2.id);
      await fpm.closeBatch(batch1.id);
    });

    it('contains currently open batches in flight plan events', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      fpm.create(0);
      const fp = fpm.get(0);

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlan.setFixInfoEntry').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const batch1 = await fpm.openBatch('test_batch_1');
      const batch2 = await fpm.openBatch('test_batch_2');

      const fix = (await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS'))[0];
      fp.setFixInfoEntry(1, { fix });

      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          batchStack: [
            expect.objectContaining<FlightPlanBatch>({ id: batch1.id, name: batch1.name }),
            expect.objectContaining<FlightPlanBatch>({ id: batch2.id, name: batch2.name }),
          ],
          index: 1,
        } satisfies Partial<FlightPlanSetFixInfoEntryEvent>),
      );
    });
  });
});

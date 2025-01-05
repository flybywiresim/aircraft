// Copyright (c) Microsoft Corporation
// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: MIT

import { BasicConsumer, Consumer, Handler, Subscription } from '@microsoft/msfs-sdk';

export interface ArincConsumer<T> extends Consumer<T> {
  /**
   * Quantizes the Arinc429 event data to consume only at the specified decimal precision.
   * @param precision The decimal precision to snap to.
   * @returns A new consumer with the applied precision filter.
   */
  withArinc429Precision(precision: number): Consumer<T>;

  /**
   * Filter the subscription to consume only when the SSM value changes.
   * @returns A new consumer with the applied ssm filter.
   */
  whenArinc429SsmChanged(): Consumer<T>;
}

// would be easier to implement if the base class made better use of protected
export class BasicArincConsumer<T> extends BasicConsumer<T> {
  /** @inheritdoc */
  constructor(
    private readonly arincSubscribe: (handler: Handler<T>, paused: boolean) => Subscription,
    private arincState: any = {},
    private readonly currentArincHandler?: (data: T, state: any, next: Handler<T>) => void,
  ) {
    super(arincSubscribe, arincState, currentArincHandler);
  }

  /** @inheritdoc */
  private arincWith(data: T, handler: Handler<T>): void {
    if (this.currentArincHandler !== undefined) {
      this.currentArincHandler(data, this.arincState, handler);
    } else {
      handler(data);
    }
  }

  /** @inheritdoc */
  public withArinc429Precision(precision: number): ArincConsumer<T> {
    return new BasicArincConsumer<T>(
      this.arincSubscribe,
      { lastValue: 0, hasLastValue: false },
      this.getWithArinc429PrecisionHandler(precision),
    );
  }

  private getWithArinc429PrecisionHandler(precision: number): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      const dataValue = (data as any).value;
      const multiplier = 10 ** precision;

      const currentValueAtPrecision = Math.round(dataValue * multiplier) / multiplier;
      if (
        currentValueAtPrecision !== state.lastValue ||
        state.hasNormalOps !== (data as any).isNormalOperation() ||
        state.isNoComputedData !== (data as any).isNoComputedData() ||
        state.isFailureWarning !== (data as any).isFailureWarning()
      ) {
        state.lastValue = currentValueAtPrecision;
        state.hasNormalOps = (data as any).isNormalOperation();
        state.isNoComputedData = (data as any).isNoComputedData();
        state.isFailureWarning = (data as any).isFailureWarning();
        this.arincWith(data, next);
      }
    };
  }

  /** @inheritdoc */
  public whenArinc429SsmChanged(): ArincConsumer<T> {
    return new BasicArincConsumer<T>(
      this.arincSubscribe,
      { lastValue: 0, hasLastValue: false },
      this.getWhenArinc429SsmChangedHandler(),
    );
  }

  private getWhenArinc429SsmChangedHandler(): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      if ((data as any).ssm !== state.lastSsm) {
        state.lastSsm = (data as any).ssm;
        this.arincWith(data, next);
      }
    };
  }
}

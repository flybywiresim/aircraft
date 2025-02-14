// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { PropsWithChildren, useState } from 'react';
import { Failure, FailuresOrchestrator, useUpdate, FailureDefinition } from '@flybywiresim/fbw-sdk';

interface FailuresOrchestratorContext {
  allFailures: Readonly<Readonly<Failure>[]>;
  activeFailures: Set<number>;
  activate(identifier: number): Promise<void>;
  deactivate(identifier: number): Promise<void>;
}

const createOrchestrator = (failures: FailureDefinition[]) => new FailuresOrchestrator(failures);

const Context = React.createContext<FailuresOrchestratorContext>({
  allFailures: [],
  activeFailures: new Set<number>(),
  activate: () => Promise.resolve(),
  deactivate: () => Promise.resolve(),
});

export interface FailuresOrchestratorProviderProps {
  failures: FailureDefinition[];
}

export const FailuresOrchestratorProvider: React.FC<PropsWithChildren<FailuresOrchestratorProviderProps>> = ({
  failures,
  children,
}) => {
  const [orchestrator] = useState(() => createOrchestrator(failures));

  const [allFailures] = useState(() => orchestrator.getAllFailures());
  const [activeFailures, setActiveFailures] = useState<Set<number>>(() => new Set<number>());

  useUpdate(() => {
    orchestrator.update();

    const af = orchestrator.getActiveFailures();
    if (!areEqual(activeFailures, af)) {
      setActiveFailures(af);
    }
  });

  return (
    <Context.Provider
      value={{
        allFailures,
        activeFailures,
        activate: (identifier) => orchestrator.activate(identifier),
        deactivate: (identifier) => orchestrator.deactivate(identifier),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export function useFailuresOrchestrator() {
  const context = React.useContext(Context);
  if (context === undefined) {
    throw new Error('useFailuresOrchestrator must be used within a FailuresOrchestratorProvider');
  }

  return context;
}

function areEqual<T>(as: Set<T>, bs: Set<T>) {
  if (as.size !== bs.size) return false;
  for (const a of as) {
    if (!bs.has(a)) {
      return false;
    }
  }

  return true;
}

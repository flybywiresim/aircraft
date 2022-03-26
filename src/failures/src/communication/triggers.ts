export enum FailuresTriggersSuffixes {
    NewFailuresState = 'NEW_FAILURES_STATE',

    ActivateFailure = 'ACTIVATE_FAILURE',

    DeactivateFailure = 'DEACTIVATE_FAILURE',

    RequestFailuresState = 'REQUEST_FAILURES_STATE',
}

export interface FailuresTriggers {
    NewFailuresState: string,

    ActivateFailure: string,

    DeactivateFailure: string,

    RequestFailuresState: string,
}

export function PrefixedFailuresTriggers(prefix: string): FailuresTriggers {
    return {
        NewFailuresState: `${prefix}_${FailuresTriggersSuffixes.NewFailuresState}`,
        ActivateFailure: `${prefix}_${FailuresTriggersSuffixes.ActivateFailure}`,
        DeactivateFailure: `${prefix}_${FailuresTriggersSuffixes.DeactivateFailure}`,
        RequestFailuresState: `${prefix}_${FailuresTriggersSuffixes.RequestFailuresState}`,
    };
}

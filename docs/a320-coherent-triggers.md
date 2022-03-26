# A32NX CoherentGT Triggers

## FMGC

### Type `Type_2_Message`

See `FMMessage` in `src/shared/src/FmMessages.ts`.

### Triggers

- A32NX_FMGC_SEND_MESSAGE_TO_MCDU
    - Sends a Type II message to the MCDU (both at the moment)
    - The `efisTarget` and `efisText` options are ignored by the MCDU
    - Payload: `[Type_2_Message]`

- A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID
    - Removes a previously sent Type II message from the MCDU
    - The `efisTarget` option is ignored by the MCDU
    - Payload: `[text: string]`
    - `text`:
        -  The MCDU text of the message to remove

## Failures

### Triggers

- A32NX_NEW_FAILURES_STATE
    - Dataflow: Failures orchestrator -> Remote failures providers
    - Notifies any remote failures providers of available, active and changing failures
    - Payload: `[active: number[], changing: number[]]`
        - `all`: every failure currently active
        - `changing`: every failure currently changing

- A32NX_ACTIVATE_FAILURE
    - Dataflow: Remote failures providers -> Failures orchestrator
    - Requests a failure to be activated through the failure orchestrator
    - Payload: `[identifier: number]`
    - `identifier`: failure identifier

- A32NX_DEACTIVATE_FAILURE
    - Dataflow: Remote failures providers -> Failures orchestrator
    - Requests a failure to be deactivated through the failure orchestrator
    - Payload: `[identifier: number]`
    - `identifier`: failure identifier

- A32NX_REQUEST_FAILURES_STATE
    - Dataflow: Remote failures providers -> Failures orchestrator
    - Requests the orchestrator to immediately send a `A32NX_NEW_FAILURES_STATE` message
    - Payload: `[]`
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export class A380FmsError extends FmsError {
  public details?: string;

  constructor(
    public type: FmsErrorType,
    details?: string,
  ) {
    super(type);
    this.details = details;
  }
}

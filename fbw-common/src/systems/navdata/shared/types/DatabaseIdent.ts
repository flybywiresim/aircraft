export interface DatabaseIdent {
  /** who this data comes from */
  provider: string;
  /** yycc where yy = last 2 digits of effective year, cc = sequential cycle number */
  airacCycle: string;
  /** UTC ISO8601 calender date YYYY-MM-DD */
  effectiveFrom: string;
  /** UTC ISO8601 calender date YYYY-MM-DD, inclusive of first day of next cycle */
  effectiveTo: string;
}

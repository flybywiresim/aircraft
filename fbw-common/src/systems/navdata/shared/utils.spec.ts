import { iso8601CalendarDate } from './utils';

describe('iso8601CalendarDate', () => {
  it('should return an iso8601 formatted date', () => {
    expect(iso8601CalendarDate(2022, 1, 1)).toBe('2022-01-01');

    expect(iso8601CalendarDate(2022, 12, 31)).toBe('2022-12-31');
  });

  it('should use the given seperator', () => {
    expect(iso8601CalendarDate(2022, 1, 1, '')).toBe('20220101');

    expect(iso8601CalendarDate(2022, 1, 1, '@')).toBe('2022@01@01');
  });
});

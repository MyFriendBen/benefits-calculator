import { telHref } from './footerPhone';

describe('telHref', () => {
  it('keeps only the digits of a display-formatted number', () => {
    expect(telHref('1-(888)-892-1162')).toBe('tel:18888921162');
    expect(telHref('(866) 760-6489')).toBe('tel:8667606489');
    expect(telHref('1-844-438-6827')).toBe('tel:18444386827');
  });
});

import { getAcuteNeeds } from './updateScreen';

describe('getAcuteNeeds', () => {
  it('sends the selected needs as option keys', () => {
    expect(getAcuteNeeds({ food: true, housing: false, support: true })).toEqual(['food', 'support']);
  });

  it('sends an empty list once the step is answered with nothing selected', () => {
    expect(getAcuteNeeds({ food: false })).toEqual([]);
  });

  it('sends nothing before the step is answered, so saved needs are left alone', () => {
    expect(getAcuteNeeds({})).toBeNull();
  });
});

import { render } from '@testing-library/react';
import { useScrollToTop } from './useScrollToTop';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { act } from '@testing-library/react';

describe('useScrollToTop', () => {
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = mockScrollTo;
  });

  it('should scroll to top on mount', () => {
    const TestComponent = () => {
      useScrollToTop();
      return null;
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should scroll to top when location changes', () => {
    let navigateFn: ReturnType<typeof useNavigate>;

    const TestComponent = () => {
      useScrollToTop();
      navigateFn = useNavigate();
      return null;
    };

    render(
      <MemoryRouter initialEntries={['/page1']}>
        <Routes>
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);

    // Navigate to a different route to trigger location change
    act(() => {
      navigateFn('/page2');
    });

    expect(mockScrollTo).toHaveBeenCalledTimes(2);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });
});

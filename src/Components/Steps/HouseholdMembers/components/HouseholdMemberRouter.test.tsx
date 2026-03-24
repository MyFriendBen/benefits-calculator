import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberRouter from './HouseholdMemberRouter';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('./HouseholdMemberBasicInfoPage', () => ({
  __esModule: true,
  default: () => <div data-testid="basic-info-page">BasicInfoPage</div>,
}));

jest.mock('./HouseholdMemberForm', () => ({
  __esModule: true,
  default: () => <div data-testid="member-form">MemberForm</div>,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderRouter = (page: string, householdSize = 3) => {
  const contextValue = {
    formData: { householdSize },
  } as any;

  return render(
    <Context.Provider value={contextValue}>
      <MemoryRouter initialEntries={[`/co/test-uuid/step-5/${page}`]}>
        <Routes>
          <Route path="/:whiteLabel/:uuid/step-:stepId/:page" element={<HouseholdMemberRouter />} />
        </Routes>
      </MemoryRouter>
    </Context.Provider>
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HouseholdMemberRouter', () => {
  describe('page 0', () => {
    // Note: in normal user flow, only householdSize > 1 users ever reach page 0.
    // HouseholdSize navigates size-1 users directly to page 1 (skipping page 0).
    // These tests verify the router's own routing logic, independent of how users arrive.
    it('renders HouseholdMemberBasicInfoPage when page is 0 and householdSize > 1', () => {
      renderRouter('0', 3);
      expect(screen.getByTestId('basic-info-page')).toBeInTheDocument();
      expect(screen.queryByTestId('member-form')).not.toBeInTheDocument();
    });

    it('renders HouseholdMemberBasicInfoPage when page is 0 and householdSize is 2', () => {
      renderRouter('0', 2);
      expect(screen.getByTestId('basic-info-page')).toBeInTheDocument();
    });
  });

  describe('page 1+', () => {
    it('renders HouseholdMemberForm when page is 1', () => {
      renderRouter('1', 3);
      expect(screen.getByTestId('member-form')).toBeInTheDocument();
      expect(screen.queryByTestId('basic-info-page')).not.toBeInTheDocument();
    });

    it('renders HouseholdMemberForm when page is 2', () => {
      renderRouter('2', 3);
      expect(screen.getByTestId('member-form')).toBeInTheDocument();
      expect(screen.queryByTestId('basic-info-page')).not.toBeInTheDocument();
    });

    it('renders HouseholdMemberForm when page is 3', () => {
      renderRouter('3', 3);
      expect(screen.getByTestId('member-form')).toBeInTheDocument();
      expect(screen.queryByTestId('basic-info-page')).not.toBeInTheDocument();
    });

    it('renders HouseholdMemberForm on page 1 for a single-member household', () => {
      renderRouter('1', 1);
      expect(screen.getByTestId('member-form')).toBeInTheDocument();
      expect(screen.queryByTestId('basic-info-page')).not.toBeInTheDocument();
    });
  });
});

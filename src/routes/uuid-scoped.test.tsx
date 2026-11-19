import { MemoryRouter, useRoutes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { buildUUIDScopedRoute } from './uuid-scoped';
import { useStepId } from '../Components/RouterUtil/useStepId';

jest.mock('../Components/RouterUtil/ValidateUuid', () => {
  const { Outlet } = require('react-router-dom');
  return { __esModule: true, default: () => <Outlet /> };
});
jest.mock('../Components/Steps/SelectLanguage', () => ({ __esModule: true, default: () => <div>language step</div> }));
jest.mock('../Components/Steps/Disclaimer/Disclaimer', () => ({
  __esModule: true,
  default: () => <div>disclaimer step</div>,
}));
jest.mock('../Components/Steps/HouseholdMembers/components/HouseholdMemberRouter', () => ({
  __esModule: true,
  default: () => <div>household member router</div>,
}));
jest.mock('../Components/Confirmation/Confirmation', () => ({
  __esModule: true,
  default: () => <div>confirmation</div>,
}));
jest.mock('../Components/QuestionComponentContainer/QuestionComponentContainer', () => {
  const { useStepId: stepId } = require('../Components/RouterUtil/useStepId');
  return { __esModule: true, default: () => <div>question step {stepId()}</div> };
});
jest.mock('./results', () => ({ __esModule: true, default: [] }));

const Routes = () =>
  useRoutes([{ path: ':whiteLabel', children: [buildUUIDScopedRoute({ householdMemberStepNumber: 4 })] }]);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  );

describe('UUID-scoped routes', () => {
  it('opens the language step at step-1', () => {
    renderAt('/co/abc/step-1');
    expect(screen.getByText('language step')).toBeInTheDocument();
  });

  it('opens the disclaimer at step-2, ahead of the step segment', () => {
    renderAt('/co/abc/step-2');
    expect(screen.getByText('disclaimer step')).toBeInTheDocument();
  });

  it('matches a questionnaire step by its step-<id> segment and exposes the id', () => {
    renderAt('/co/abc/step-7');
    expect(screen.getByText('question step 7')).toBeInTheDocument();
  });

  it('routes the household member step and its page', () => {
    renderAt('/co/abc/step-4/2');
    expect(screen.getByText('household member router')).toBeInTheDocument();
  });

  it('routes confirm-information ahead of the step segment', () => {
    renderAt('/co/abc/confirm-information');
    expect(screen.getByText('confirmation')).toBeInTheDocument();
  });

  it('sends a segment that is not a step to step-1', () => {
    renderAt('/co/abc/not-a-step');
    expect(screen.getByText('language step')).toBeInTheDocument();
  });

  it('sends the bare uuid to step-1', () => {
    renderAt('/co/abc');
    expect(screen.getByText('language step')).toBeInTheDocument();
  });
});

describe('useStepId', () => {
  const Probe = () => <div data-testid="id">{String(useStepId())}</div>;
  const renderProbe = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Switch />
      </MemoryRouter>,
    );
  const Switch = () => useRoutes([{ path: ':stepSegment', element: <Probe /> }]);

  it('returns what follows the step- prefix', () => {
    renderProbe('/step-12');
    expect(screen.getByTestId('id')).toHaveTextContent('12');
  });

  it('is undefined for a segment without the prefix', () => {
    renderProbe('/results');
    expect(screen.getByTestId('id')).toHaveTextContent('undefined');
  });
});

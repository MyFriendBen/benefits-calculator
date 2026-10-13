import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import MemberCard from './MemberCard';

const messages = {
  'householdDataBlock.member-income': 'Annual Income: ',
  'householdDataBlock.memberAgeParenthetical': '({age})',
};

const baseProps = {
  memberIndex: 1,
  relationship: <>Spouse</>,
  age: '35',
  income: '$24,000',
  isCurrentMember: false,
  isCompleted: true,
  isEditable: true,
  canDelete: true,
  editAriaLabel: 'edit household member',
  deleteAriaLabel: 'delete household member',
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

const renderCard = (overrides = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <MemberCard {...baseProps} {...overrides} />
    </IntlProvider>,
  );

describe('MemberCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the relationship, age parenthetical, and income', () => {
    renderCard();
    expect(screen.getByText(/Spouse/)).toBeInTheDocument();
    expect(screen.getByText(/\(35\)/)).toBeInTheDocument();
    expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
  });

  it('omits the age parenthetical when age is null', () => {
    renderCard({ age: null });
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('hides the income row when income is null', () => {
    renderCard({ income: null });
    expect(screen.queryByText(/Annual Income/i)).not.toBeInTheDocument();
  });

  it('renders an editable card as a real button that calls onEdit', () => {
    renderCard();
    const button = screen.getByRole('button', { name: 'edit household member' });
    expect(button.tagName).toBe('BUTTON');
    fireEvent.click(button);
    expect(baseProps.onEdit).toHaveBeenCalledWith(1);
  });

  it('activates onEdit once per Enter and Space press', () => {
    renderCard();
    screen.getByRole('button', { name: 'edit household member' }).focus();
    // Native <button> activation — no custom onKeyDown. Asserted via real key events (not
    // fireEvent.keyDown, which skips the browser's click synthesis) so a regression that
    // re-adds a hand-rolled handler shows up here as a double fire.
    userEvent.keyboard('{Enter}');
    expect(baseProps.onEdit).toHaveBeenCalledTimes(1);
    userEvent.keyboard('[Space]');
    expect(baseProps.onEdit).toHaveBeenCalledTimes(2);
    expect(baseProps.onEdit).toHaveBeenCalledWith(1);
  });

  it('renders a non-editable card as plain text with no edit button', () => {
    renderCard({ isEditable: false, isCurrentMember: true });
    expect(screen.queryByRole('button', { name: 'edit household member' })).not.toBeInTheDocument();
    expect(screen.getByText(/Spouse/)).toBeInTheDocument();
  });

  it('shows only the construction icon for the current member (not the completed check)', () => {
    const { container } = renderCard({ isCurrentMember: true, isEditable: false });
    // Exactly one status badge, and it is the current (construction) icon.
    expect(container.querySelectorAll('.household-member-status-icon')).toHaveLength(1);
    expect(container.querySelector('.current-icon')).toBeInTheDocument();
    expect(container.querySelector('.completed-icon')).not.toBeInTheDocument();
  });

  it('shows only the completed check icon for an editable member', () => {
    const { container } = renderCard({ isCurrentMember: false, isEditable: true });
    expect(container.querySelectorAll('.household-member-status-icon')).toHaveLength(1);
    expect(container.querySelector('.completed-icon')).toBeInTheDocument();
    expect(container.querySelector('.current-icon')).not.toBeInTheDocument();
  });

  it('renders no status badge for an incomplete placeholder member', () => {
    const { container } = renderCard({ isCurrentMember: false, isEditable: false, isCompleted: false });
    expect(container.querySelectorAll('.household-member-status-icon')).toHaveLength(0);
  });

  it('marks an editable card with the clickable-affordance class', () => {
    const { container } = renderCard({ isEditable: true });
    expect(container.querySelector('.member-added-container')).toHaveClass('editable-household-member');
  });

  it('withholds the clickable affordance from a completed member being revisited', () => {
    // Revisiting a finished member makes their card both completed and current, but it has no
    // edit button — so it must not advertise a hover/click that does nothing.
    const { container } = renderCard({ isCompleted: true, isCurrentMember: true, isEditable: false });
    const card = container.querySelector('.member-added-container');
    expect(card).toHaveClass('completed-household-member');
    expect(card).toHaveClass('current-household-member');
    expect(card).not.toHaveClass('editable-household-member');
  });

  it('calls onDelete with the index when the trash button is clicked', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'delete household member' }));
    expect(baseProps.onDelete).toHaveBeenCalledWith(1, expect.any(HTMLElement));
  });

  it('hides the trash button when canDelete is false', () => {
    renderCard({ canDelete: false });
    expect(screen.queryByRole('button', { name: 'delete household member' })).not.toBeInTheDocument();
  });
});

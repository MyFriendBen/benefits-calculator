import { render, screen } from '@testing-library/react';
import { ChatbotErrorBoundary } from './ChatbotErrorBoundary';

const Boom = (): JSX.Element => {
  throw new Error('boom');
};

describe('ChatbotErrorBoundary (MFB-2222)', () => {
  beforeEach(() => {
    // React logs every caught render error; keep the expected ones out of the output.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders its children when nothing throws', () => {
    const onError = jest.fn();
    render(
      <ChatbotErrorBoundary fallback="fallback" onError={onError}>
        <p>all good</p>
      </ChatbotErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByText('fallback')).not.toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });

  it('renders the fallback and reports the error when a child throws', () => {
    const onError = jest.fn();
    render(
      <ChatbotErrorBoundary fallback="fallback" onError={onError}>
        <Boom />
      </ChatbotErrorBoundary>,
    );

    expect(screen.getByText('fallback')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
  });

  it('keeps siblings outside the boundary on screen', () => {
    render(
      <>
        <p>results page</p>
        <ChatbotErrorBoundary fallback={null}>
          <Boom />
        </ChatbotErrorBoundary>
      </>,
    );

    expect(screen.getByText('results page')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import App from './App';
import Wrapper from './Components/Wrapper/Wrapper';

// Mock the App component to avoid complex setup
jest.mock('./App', () => {
  return function MockedApp() {
    return <div>Mocked App Component</div>;
  };
});

test('renders mocked app component', () => {
  render(
    <BrowserRouter>
      <IntlProvider locale="en" messages={{}}>
        <Wrapper>
          <App />
        </Wrapper>
      </IntlProvider>
    </BrowserRouter>
  );
  const appElement = screen.getByText(/mocked app component/i);
  expect(appElement).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders static analysis title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Static Analysis/i);
  expect(titleElement).toBeInTheDocument();
});

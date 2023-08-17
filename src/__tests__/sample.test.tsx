import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('Layout', () => {
  test('should render the correct button text', () => {
    render(<App />);
    const button = screen.queryByRole('button');
    expect(button).toBeInTheDocument();
  });
  test('should render the image', () => {
    render(<App />);
    const image = screen.queryByRole('img');
    expect(image).toBeInTheDocument();
  });
});

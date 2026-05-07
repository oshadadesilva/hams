import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home page', () => {
  it('renders the application heading', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', {
        name: /healthcare appointment management system/i,
      }),
    ).toBeInTheDocument();
  });
});

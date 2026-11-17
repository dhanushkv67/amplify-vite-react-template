import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC7 animated list on filter change', () => {
  it('uses motion library and CSS animation class when search changes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<App />, { initialEntries: ['/browse'] });
    const grid = screen.getByTestId('browse-pet-grid');
    expect(grid).toHaveAttribute('data-motion', 'framer-motion');
    await user.type(screen.getByRole('searchbox'), 'a');
    expect(grid).toHaveClass('browse-pet-grid--animating');
  });
});

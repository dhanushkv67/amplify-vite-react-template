import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC5 search filters visible pets', () => {
  it('keeps only pets matching name or short description', async () => {
    const user = userEvent.setup();
    renderWithRouter(<App />, { initialEntries: ['/browse'] });
    await user.type(screen.getByRole('searchbox'), 'fluffy');
    for (const card of screen.getAllByTestId(/pet-card-/)) {
      expect(card.textContent?.toLowerCase()).toContain('fluffy');
    }
  });
});

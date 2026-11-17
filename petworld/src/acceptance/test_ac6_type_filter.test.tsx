import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC6 type filter', () => {
  it('shows only pets of selected type', async () => {
    const user = userEvent.setup();
    renderWithRouter(<App />, { initialEntries: ['/browse'] });
    await user.selectOptions(screen.getByLabelText(/pet type/i), 'dog');
    screen.getAllByTestId(/pet-card-/).forEach((c) => expect(c).toHaveAttribute('data-pet-type', 'dog'));
  });
});

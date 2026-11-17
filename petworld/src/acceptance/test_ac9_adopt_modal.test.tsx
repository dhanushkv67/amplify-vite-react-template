import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
import { getPetById } from '../lib/pets';
describe('AC9 Adopt modal', () => {
  it('shows pet name, Close, no server-save copy', async () => {
    const pet = getPetById('dog-1') ?? { name: 'Expected Pet' };
    const user = userEvent.setup();
    renderWithRouter(<App />, { initialEntries: ['/pets/dog-1'] });
    await user.click(await screen.findByRole('button', { name: /adopt/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(pet.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByText(/saved.*server/i)).not.toBeInTheDocument();
  });
});

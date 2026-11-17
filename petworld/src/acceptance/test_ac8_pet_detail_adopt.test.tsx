import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
import { getAllPets } from '../lib/pets';
describe('AC8 pet detail photo and Adopt', () => {
  it('shows photo and Adopt for a dataset id', async () => {
    const id = getAllPets()[0]?.id ?? 'pet-missing';
    renderWithRouter(<App />, { initialEntries: [`/pets/${id}`] });
    expect(await screen.findByRole('img', { name: /pet photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adopt/i })).toBeInTheDocument();
  });
});

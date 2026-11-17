import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC4 Browse eight in-app pets', () => {
  it('shows eight pets with no fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderWithRouter(<App />, { initialEntries: ['/browse'] });
    expect(await screen.findAllByTestId(/pet-card-/)).toHaveLength(8);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

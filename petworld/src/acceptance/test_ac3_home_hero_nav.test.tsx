import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC3 Home hero, featured pets, nav', () => {
  it('shows hero animation, two featured pets, Home/Browse/About+Contact links', () => {
    renderWithRouter(<App />, { initialEntries: ['/'] });
    expect(screen.getByTestId('home-hero-animation')).toBeInTheDocument();
    expect(screen.getAllByTestId(/featured-pet-/)).toHaveLength(2);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse pets/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about.*contact/i })).toBeInTheDocument();
  });
});

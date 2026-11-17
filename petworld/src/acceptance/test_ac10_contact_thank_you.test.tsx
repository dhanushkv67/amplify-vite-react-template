import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
describe('AC10 contact thank-you', () => {
  it('shows thank-you on valid submit without fetch', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderWithRouter(<App />, { initialEntries: ['/about'] });
    await user.type(screen.getByLabelText(/^name/i), 'Alex');
    await user.type(screen.getByLabelText(/^email/i), 'alex@example.com');
    await user.type(screen.getByLabelText(/^message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send|submit/i }));
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

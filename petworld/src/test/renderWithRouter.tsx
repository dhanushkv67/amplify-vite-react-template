import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
export function renderWithRouter(ui: ReactElement, o?: { initialEntries?: string[] }) {
  return render(<MemoryRouter initialEntries={o?.initialEntries??['/']}>{ui}</MemoryRouter>);
}

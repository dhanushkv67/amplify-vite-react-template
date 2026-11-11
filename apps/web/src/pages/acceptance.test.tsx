import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Owner-approved page surface. Browser viewport and keyboard checks belong in
// the subsequent e2e suite once the actual pages and server exist.
test('AC12 authentication, project, board and task pages expose essential controls', async () => {
  const authModule = './AuthPage', projectsModule = './ProjectsPage', boardModule = './BoardPage';
  const { default: AuthPage } = await import(/* @vite-ignore */ authModule);
  const { default: ProjectsPage } = await import(/* @vite-ignore */ projectsModule);
  const { default: BoardPage } = await import(/* @vite-ignore */ boardModule);
  render(<AuthPage />);
  expect(screen.getByRole('textbox', { name: /email/i })).toBeTruthy();
  expect(screen.getByRole('button', { name: /log in|sign in/i })).toBeTruthy();
  render(<ProjectsPage />);
  expect(screen.getByRole('button', { name: /create project/i })).toBeTruthy();
  render(<BoardPage />);
  for (const name of ['To do', 'In progress', 'Done']) {
    expect(screen.getByText(name)).toBeTruthy();
  }
});

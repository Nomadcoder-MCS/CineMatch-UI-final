import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with Router
 * Use this instead of RTL's render to ensure router context is available
 */
export function renderWithRouter(ui, { route = '/', ...renderOptions } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
}

/**
 * Render with BrowserRouter (for components that don't need specific routes)
 */
export function renderWithBrowserRouter(ui, renderOptions = {}) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>,
    renderOptions
  );
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';


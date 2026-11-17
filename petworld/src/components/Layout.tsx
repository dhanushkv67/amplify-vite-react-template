import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div>
      <header>
        <nav aria-label="Main">
          <Link to="/">Home</Link>
          {' · '}
          <Link to="/browse">Browse pets</Link>
          {' · '}
          <Link to="/about">About + Contact</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

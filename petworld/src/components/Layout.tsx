import { Link, Outlet } from 'react-router-dom';
export function Layout() {
  return (
    <div>
      <header>
        <nav aria-label="Main">
          <Link to="/">Home</Link>
          {' \u00b7 '}
          <Link to="/browse">Browse pets</Link>
          {' \u00b7 '}
          <Link to="/about">About + Contact</Link>
        </nav>
      </header>
      <main><Outlet /></main>
    </div>
  );
}

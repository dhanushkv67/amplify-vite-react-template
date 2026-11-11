import { AuthProvider, useAuth } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectPage from './pages/ProjectPage';

function PrivateHome() {
  const { user, logout } = useAuth();
  const match = /^\/projects\/([1-9]\d*)\/?$/.exec(window.location.pathname);
  return <><nav><a href="/projects">Projects</a> · Signed in as {user?.email} · 
    <button onClick={() => { void logout(); }}>Log out</button></nav>
    {match ? <ProjectPage projectId={match[1]} currentUserId={user?.id ?? ""} /> : <ProjectsPage />}
  </>;
}

export default function App() {
  return <AuthProvider><ProtectedRoute fallback={<AuthPage />}><PrivateHome /></ProtectedRoute></AuthProvider>;
}

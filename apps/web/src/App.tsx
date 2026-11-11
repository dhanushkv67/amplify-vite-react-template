import { AuthProvider, useAuth } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectPage from './pages/ProjectPage';
import BoardPage from './pages/BoardPage';

function PrivateHome() {
  const { user, logout } = useAuth();
  const match = /^\/projects\/([1-9]\d*)(?:\/(board|tasks\/[1-9]\d*))?\/?$/.exec(window.location.pathname);
  return <><nav><a href="/projects">Projects</a> · Signed in as {user?.email} · 
    <button onClick={() => { void logout(); }}>Log out</button></nav>
    {match?.[2] ? <BoardPage projectId={match[1]} /> : match ? <ProjectPage projectId={match[1]} currentUserId={user?.id ?? ""} /> : <ProjectsPage />}
  </>;
}

export default function App() {
  return <AuthProvider><ProtectedRoute fallback={<AuthPage />}><PrivateHome /></ProtectedRoute></AuthProvider>;
}

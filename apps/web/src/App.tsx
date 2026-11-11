import { AuthProvider, useAuth } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';

function PrivateHome() {
  const { user, logout } = useAuth();
  return <main><h1>Project board</h1><p>Signed in as {user?.email}</p>
    <button onClick={() => { void logout(); }}>Log out</button></main>;
}

export default function App() {
  return <AuthProvider><ProtectedRoute fallback={<AuthPage />}><PrivateHome /></ProtectedRoute></AuthProvider>;
}

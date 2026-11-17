import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { AboutPage } from './pages/AboutPage';
import { PetDetailPage } from './pages/PetDetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="pets/:id" element={<PetDetailPage />} />
      </Route>
    </Routes>
  );
}

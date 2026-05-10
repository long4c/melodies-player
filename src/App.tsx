import HomePage from './pages/HomePage';
import MelodyPage from './pages/MelodyPage';
import SavedMelodiesPage from './pages/SavedMelodiesPage';

export default function App() {
  const path = window.location.pathname;

  if (path === '/m') {
    return <MelodyPage />;
  }

  if (path === '/saved') {
    return <SavedMelodiesPage />;
  }

  return <HomePage />;
}

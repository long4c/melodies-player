import HomePage from './pages/HomePage';
import MelodyPage from './pages/MelodyPage';

export default function App() {
  const path = window.location.pathname;

  if (path === '/m') {
    return <MelodyPage />;
  }

  return <HomePage />;
}

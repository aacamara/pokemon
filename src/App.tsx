import { Routes, Route, Link } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import PokemonDetailPage from './pages/PokemonDetailPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>⚡</span>
          <span className="brand-text">Coveo Pokédex</span>
        </Link>
        <nav className="app-header__nav">
          <a
            className="repo-link"
            href="https://github.com/aacamara/coveo-pokemon"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/pokemon/:name" element={<PokemonDetailPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>
          Built with <code>@coveo/atomic-react</code> · indexed via the Coveo Web Crawler
        </span>
        <span>Aziz Camara — Senior Director, Technical Success challenge</span>
      </footer>
    </div>
  );
}

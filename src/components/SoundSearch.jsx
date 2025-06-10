import { useState } from 'react';
import { searchSounds } from '../services/freesound';
import SoundCard from './SoundCard';
import style from "../style/soundSearch.module.scss"

const SoundSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const sounds = await searchSounds(query);
      setResults(sounds);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="heading">Search for Sounds</h2>
      <form onSubmit={handleSearch} className={style.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter sound keywords..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {results.length > 0 ? (
        <div className={style.resultGrid}>
          {results.map((sound) => (
            <SoundCard key={sound.id} sound={sound} />
          ))}
        </div>
      ) : (
        !isLoading && <p>Search Result will show here</p>
      )}
    </div>
  );
};

export default SoundSearch;
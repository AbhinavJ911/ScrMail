import { useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative glass rounded-2xl flex items-center overflow-hidden group-hover:border-brand-500/30 transition-all duration-300">
          <div className="pl-5">
            <HiOutlineSearch className="text-xl text-gray-400 group-hover:text-brand-400 transition-colors" />
          </div>
          <input
            type="text"
            id="email-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emails by keyword (e.g., Quant, Interview, Receipt)..."
            className="w-full bg-transparent px-4 py-4 text-white placeholder-gray-500 outline-none text-base"
            disabled={loading}
          />
          <button
            type="submit"
            id="email-search-button"
            disabled={loading || !query.trim()}
            className="mr-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium text-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;

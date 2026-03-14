import { useState, useEffect } from 'react';
import API from '../utils/api';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import EmailCard from '../components/EmailCard';
import EmailModal from '../components/EmailModal';
import SearchHistory from '../components/SearchHistory';

const Dashboard = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [history, setHistory] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setLoading(true);
    setError('');
    setEmails([]);

    try {
      // Save search to history
      await API.post('/api/history', { keyword: query });

      // Search emails
      const res = await API.get(`/api/email/search?q=${encodeURIComponent(query)}`);

      setEmails(res.data.emails);
      setTotalResults(res.data.total);

      // Refresh history
      fetchHistory();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to search emails. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await API.delete(`/api/history/${id}`);
      setHistory(history.filter((h) => h._id !== id));
    } catch (err) {
      console.error('Failed to delete history:', err);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">ScrMail</span> Dashboard
          </h1>
          <p className="text-gray-400">Search your Gmail inbox using keywords</p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Email Results - Main Area */}
          <div className="lg:col-span-3">
            {/* Status messages */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Searching your emails for "<span className="text-brand-400">{searchQuery}</span>"...</p>
              </div>
            )}

            {error && (
              <div className="glass rounded-2xl p-6 border-red-500/30 bg-red-500/5 animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && emails.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-sm">
                    Found <span className="text-brand-400 font-semibold">{totalResults}</span> results for "<span className="text-white">{searchQuery}</span>"
                  </p>
                </div>
                <div className="space-y-4">
                  {emails.map((email) => (
                    <EmailCard
                      key={email.id}
                      email={email}
                      onReadMore={() => setSelectedEmail(email)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && emails.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-400 text-lg">No emails found for "<span className="text-white">{searchQuery}</span>"</p>
                <p className="text-gray-500 text-sm mt-2">Try a different keyword</p>
              </div>
            )}

            {!loading && !error && emails.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-300 text-xl font-medium mb-2">Start searching</p>
                <p className="text-gray-500">Enter a keyword above to search through your Gmail inbox</p>
              </div>
            )}
          </div>

          {/* Search History - Sidebar */}
          <div className="lg:col-span-1">
            <SearchHistory
              history={history}
              onSearch={handleSearch}
              onDelete={handleDeleteHistory}
            />
          </div>
        </div>
      </main>

      {/* Email Modal */}
      {selectedEmail && (
        <EmailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

import { HiOutlineClock, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';

const SearchHistory = ({ history, onSearch, onDelete }) => {
  // Format relative time
  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineClock className="text-lg text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
          Search History
        </h3>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <HiOutlineSearch className="text-3xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No searches yet</p>
          <p className="text-gray-600 text-xs mt-1">Your search keywords will appear here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {history.map((item) => (
            <div
              key={item._id}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
              onClick={() => onSearch(item.keyword)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/20 transition-colors">
                  <HiOutlineSearch className="text-sm text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 font-medium truncate group-hover:text-brand-300 transition-colors">
                    {item.keyword}
                  </p>
                  <p className="text-xs text-gray-500">{timeAgo(item.timestamp)}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item._id);
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                title="Delete"
              >
                <HiOutlineTrash className="text-sm text-gray-500 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistory;

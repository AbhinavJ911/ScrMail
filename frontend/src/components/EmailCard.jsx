import { HiOutlineMail, HiOutlineUser, HiOutlineCalendar } from 'react-icons/hi';

const EmailCard = ({ email, onReadMore }) => {
  // Parse sender name from the "From" header
  const parseSender = (from) => {
    const match = from.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
    return {
      name: match ? match[1].trim() : from,
      email: match ? match[2].trim() : from,
    };
  };

  const sender = parseSender(email.from);

  // Format date
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass rounded-2xl p-5 hover:border-brand-500/20 transition-all duration-300 group animate-fade-in cursor-pointer">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/10">
          <span className="text-white font-semibold text-sm">
            {sender.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <HiOutlineUser className="text-gray-500 flex-shrink-0 text-sm" />
              <p className="text-sm font-medium text-gray-200 truncate">
                {sender.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 flex-shrink-0 ml-4">
              <HiOutlineCalendar className="text-sm" />
              <span className="text-xs">{formatDate(email.date)}</span>
            </div>
          </div>

          {/* Subject */}
          <h3 className="text-base font-semibold text-white mb-2 group-hover:text-brand-300 transition-colors truncate">
            {email.subject}
          </h3>

          {/* Snippet */}
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-3">
            {email.snippet}
          </p>

          {/* Read More */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReadMore();
            }}
            className="inline-flex items-center gap-1.5 text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors group/btn"
          >
            <HiOutlineMail className="text-base" />
            Read More
            <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailCard;

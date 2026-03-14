import { useEffect, useRef } from 'react';
import { HiOutlineX, HiOutlineUser, HiOutlineCalendar, HiOutlineMail } from 'react-icons/hi';

const EmailModal = ({ email, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Parse sender
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
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl shadow-brand-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{sender.name}</p>
              <p className="text-xs text-gray-400 truncate">{sender.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <HiOutlineX className="text-xl text-gray-400" />
          </button>
        </div>

        {/* Subject & Date */}
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white mb-2">{email.subject}</h2>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <HiOutlineCalendar className="text-base" />
            <span>{formatDate(email.date)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {email.body ? (
            <div
              className="prose prose-invert prose-sm max-w-none 
                [&_a]:text-brand-400 [&_a]:no-underline [&_a:hover]:text-brand-300
                [&_img]:max-w-full [&_img]:rounded-lg
                [&_table]:border-collapse [&_td]:border [&_td]:border-white/10 [&_td]:p-2
                [&_th]:border [&_th]:border-white/10 [&_th]:p-2
                text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          ) : (
            <p className="text-gray-400 italic">No email body available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;

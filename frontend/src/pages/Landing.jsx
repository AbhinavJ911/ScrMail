import { FcGoogle } from 'react-icons/fc';
import { HiOutlineMail, HiOutlineSearch, HiOutlineClock } from 'react-icons/hi';

const Landing = () => {
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-3xl"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <HiOutlineMail className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold gradient-text">ScrMail</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-32 md:pt-24">
        <div className="animate-slide-up flex flex-col items-center text-center max-w-3xl">
          {/* Badge */}
          <div className="glass rounded-full px-5 py-2 mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-gray-300">Powered by Gmail API</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Search Your Inbox
            <br />
            <span className="gradient-text">Smarter & Faster</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl leading-relaxed">
            Connect your Gmail account and instantly search through thousands of emails with powerful keyword search. Find what you need in seconds.
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            id="google-sign-in-button"
            className="group flex items-center gap-3 bg-white text-gray-800 px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:scale-105 transition-all duration-300 animate-glow"
          >
            <FcGoogle className="text-2xl" />
            <span>Sign in with Google</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure OAuth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Read-only access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No data stored</span>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
              <HiOutlineSearch className="text-2xl text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
            <p className="text-gray-400 text-sm">Search through your entire Gmail inbox using any keyword instantly.</p>
          </div>

          <div className="glass rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <HiOutlineMail className="text-2xl text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Full Email View</h3>
            <p className="text-gray-400 text-sm">Preview email snippets and click to read the complete email content.</p>
          </div>

          <div className="glass rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <HiOutlineClock className="text-2xl text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Search History</h3>
            <p className="text-gray-400 text-sm">Your search keywords are saved so you can quickly repeat past searches.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-500 text-sm border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} ScrMail. Built with ❤️ using MERN Stack.</p>
      </footer>
    </div>
  );
};

export default Landing;

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLogout, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <HiOutlineMail className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold gradient-text">ScrMail</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 glass rounded-full pl-1 pr-4 py-1">
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm text-gray-300 font-medium">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  id="logout-button"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 text-sm font-medium"
                >
                  <HiOutlineLogout className="text-lg" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl glass"
          >
            {mobileMenuOpen ? (
              <HiOutlineX className="text-xl text-gray-300" />
            ) : (
              <HiOutlineMenu className="text-xl text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-slide-up">
            {user && (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/30"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
                >
                  <HiOutlineLogout className="text-lg" />
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogOut, Award, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Award className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">AccountaBuddy</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {userProfile && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-gray-700">{userProfile.username}</span>
                      <div className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        <span>Rating: {userProfile.rating}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200">
            {user ? (
              <div className="flex flex-col space-y-4">
                {userProfile && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">{userProfile.username}</span>
                    <div className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                      <span>Rating: {userProfile.rating}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors w-full text-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
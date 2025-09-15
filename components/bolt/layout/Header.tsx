import React, { useState } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

interface HeaderProps {
  userType: 'seeker' | 'provider';
}

export default function Header({ userType }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t, isHydrated } = useI18n();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-2 md:px-4 py-2 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg trust-network-logo">
              <Shield className="w-5 md:w-6 h-5 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 ml-2 md:ml-3">
              {isHydrated ? t('app.title') : 'Lumio'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {isHydrated ? t(`role.${userType}`) : userType}
              </p>
            </div>
            {(user as any)?.avatar && (
              <img 
                src={(user as any).avatar} 
                alt={user.name}
                className="w-7 md:w-10 h-7 md:h-10 rounded-full object-cover"
              />
            )}
            <button
              onClick={handleLogoutClick}
              className="p-1 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md md:rounded-lg transition-colors"
              title={t('auth.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
}
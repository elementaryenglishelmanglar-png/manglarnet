'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  MenuIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  LogoutIcon,
} from '@/components/Icons';
import type { Usuario, Notification } from '@/types';

interface HeaderProps {
  title: string;
  currentUser: Usuario;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMenuToggle?: () => void;
}

export default function Header({
  title,
  currentUser,
  notifications = [],
  onNotificationClick,
  onMenuToggle,
}: HeaderProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const unreadCount = notifications.filter(
    (n) => !n.isRead && n.recipientId === currentUser.docenteId
  ).length;

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' años';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' meses';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' días';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' horas';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutos';
    return Math.floor(seconds) + ' segundos';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setNotificationsOpen(false);
  };

  return (
    <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-30 border-b border-apple-gray-light shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-apple-gray hover:text-manglar-orange hover:bg-manglar-orange-light rounded-lg transition-apple"
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-manglar-orange to-manglar-orange/80 items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-apple-gray-dark truncate tracking-tight">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {currentUser.role === 'docente' && (
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!isNotificationsOpen)}
              className="relative text-apple-gray hover:text-manglar-orange transition-apple focus-ring rounded-lg p-1"
              aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
              aria-expanded={isNotificationsOpen}
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span 
                  className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-manglar-orange ring-2 ring-white animate-pulse-gentle"
                  aria-hidden="true"
                />
              )}
            </button>
            {isNotificationsOpen && (
              <div 
                className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-20 border border-apple-gray-light bg-white animate-fade-in"
                role="dialog"
                aria-label="Panel de notificaciones"
                aria-modal="false"
              >
                <div className="p-2 border-b">
                  <h3 className="font-semibold text-apple-gray-dark" id="notifications-heading">Notificaciones</h3>
                </div>
                <div className="py-1 max-h-96 overflow-y-auto">
                  {notifications.filter((n) => n.recipientId === currentUser.docenteId).length >
                  0 ? (
                    notifications
                      .filter((n) => n.recipientId === currentUser.docenteId)
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`block w-full text-left px-4 py-3 text-sm text-apple-gray-dark hover:bg-manglar-orange-light transition-apple focus-ring rounded ${
                            !n.isRead ? 'bg-manglar-orange-light border-l-4 border-manglar-orange' : ''
                          }`}
                          aria-label={`${n.title}. ${n.message}`}
                          role="menuitem"
                        >
                          <p className="font-bold">{n.title}</p>
                          <p className="text-apple-gray text-xs font-light">{n.message}</p>
                          <p className="text-right text-xs text-apple-gray font-light mt-1">
                            {timeSince(n.timestamp)} ago
                          </p>
                        </button>
                      ))
                  ) : (
                    <p className="text-center text-apple-gray py-4 font-light">
                      No hay notificaciones.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 text-left focus-ring rounded-lg p-1"
            aria-label="Menú de usuario"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div className="hidden sm:block">
              <p className="font-semibold text-apple-gray-dark text-sm sm:text-base">
                {currentUser.fullName}
              </p>
              <p className="text-xs sm:text-sm text-apple-gray font-light capitalize">
                {currentUser.role}
              </p>
            </div>
            <div className="sm:hidden">
              <UserCircleIcon className="h-8 w-8 text-apple-gray" />
            </div>
            <ChevronDownIcon className="hidden sm:block" />
          </button>
          {isMenuOpen && (
            <div 
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-10 border border-apple-gray-light bg-white animate-fade-in"
              role="menu"
              aria-label="Menú de usuario"
            >
              <div className="py-1" role="group">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-apple-gray-dark hover:bg-manglar-orange-light transition-apple w-full text-left focus-ring rounded"
                  role="menuitem"
                  aria-label="Cerrar sesión"
                >
                  <LogoutIcon />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


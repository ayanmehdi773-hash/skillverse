import { useCallback, useEffect, useState } from 'react';
import {
  Bell, Heart, MessageCircle, Users, Send,
  CheckCheck, X, ExternalLink, Loader2
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  challenge_join: Users,
  submission: Send,
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function Notifications({ session }) {
  const user = session?.user;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase) {
      setNotifications([]);
      return;
    }

    loadNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((current) => [
            payload.new,
            ...current.filter((item) => item.id !== payload.new.id),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  const markOneAsRead = async (id) => {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };

  const markAllAsRead = async () => {
    if (!unreadCount) return;

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((items) =>
      items.map((item) => ({ ...item, is_read: true }))
    );
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#101827] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <h3 className="font-semibold text-white">Notifications</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={!unreadCount}
                  title="Mark all as read"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300 disabled:opacity-30"
                >
                  <CheckCheck size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {error && (
              <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <Loader2 size={17} className="animate-spin" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Bell size={28} className="mx-auto mb-3 text-slate-600" />
                  <p className="font-medium text-slate-300">You're all caught up</p>
                  <p className="mt-1 text-xs text-slate-500">
                    New activity will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = iconMap[notification.type] || Bell;

                  return (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => markOneAsRead(notification.id)}
                      className={`flex w-full gap-3 border-b border-white/[0.06] px-4 py-4 text-left transition hover:bg-white/[0.05] ${
                        !notification.is_read ? 'bg-cyan-400/[0.06]' : ''
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                        <Icon size={18} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-5 text-slate-200">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {timeAgo(notification.created_at)}
                        </span>
                      </span>

                      {!notification.is_read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-center text-[11px] text-slate-500">
                Showing your latest 40 notifications
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, TreePine, UserCheck, GitMerge, Edit, Trash2 } from 'lucide-react';
import { useMarkAsRead } from '../hooks/useNotifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  person_added: Edit,
  person_updated: Edit,
  claim_submitted: UserCheck,
  claim_approved: UserCheck,
  claim_rejected: UserCheck,
  merge_proposed: GitMerge,
  merge_approved: GitMerge,
  deletion_approved: Trash2,
};

interface NotificationGroupProps {
  treeName: string | null;
  notifications: Notification[];
  onClose?: () => void;
}

export function NotificationGroup({ treeName, notifications, onClose }: NotificationGroupProps) {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
      onClose?.();
    }
  };

  return (
    <div>
      {treeName && (
        <div className="flex items-center gap-2 px-3 py-2">
          <TreePine className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {treeName}
          </span>
        </div>
      )}
      <div>
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type] || Bell;
          return (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 ${
                !notification.isRead ? 'bg-secondary/30' : ''
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

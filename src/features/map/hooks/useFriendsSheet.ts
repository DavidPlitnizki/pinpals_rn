import { useState } from 'react';

export interface Friend {
  id: string;
  name: string;
  avatarUri?: string;
  unread: number;
  lastMessage?: string;
}

export interface Group {
  id: string;
  name: string;
  membersCount: number;
  unread: number;
  lastMessage?: string;
}

export interface Recent {
  id: string;
  name: string;
  type: 'friend' | 'group';
  unread: number;
}

// No friends/groups data source yet (Phase 2) — sheet renders empty until then.
export function useFriendsSheet() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filteredFriends: Friend[] = [];
  const filteredGroups: Group[] = [];
  const recents: Recent[] = [];
  const hasUnread = false;

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
    setQuery('');
  }

  return {
    visible,
    query,
    setQuery,
    filteredFriends,
    filteredGroups,
    recents,
    hasUnread,
    open,
    close,
  };
}

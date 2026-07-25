import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

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

const FRIENDS: Friend[] = [];

const RECENTS: Recent[] = [];

const GROUPS: Group[] = [];

export function useFriendsSheet() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);

  const filteredFriends = useMemo(() => {
    if (!debouncedQuery.trim()) return FRIENDS;
    const lower = debouncedQuery.toLowerCase();
    return FRIENDS.filter((f) => f.name.toLowerCase().includes(lower));
  }, [debouncedQuery]);

  const filteredGroups = useMemo(() => {
    if (!debouncedQuery.trim()) return GROUPS;
    const lower = debouncedQuery.toLowerCase();
    return GROUPS.filter((g) => g.name.toLowerCase().includes(lower));
  }, [debouncedQuery]);

  const hasUnread = FRIENDS.some((f) => f.unread > 0) || GROUPS.some((g) => g.unread > 0);

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
    recents: RECENTS,
    hasUnread,
    open,
    close,
  };
}

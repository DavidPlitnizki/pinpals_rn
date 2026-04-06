import { useMemo, useState } from "react";

import { useDebouncedValue } from "../../../hooks/useDebouncedValue";

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
  type: "friend" | "group";
  unread: number;
}

const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "Alice",  unread: 2, lastMessage: "See you there!" },
  { id: "2", name: "Bob",    unread: 0, lastMessage: "Sounds good" },
  { id: "3", name: "Carol",  unread: 1, lastMessage: "Where are you?" },
  { id: "4", name: "Dan",    unread: 0, lastMessage: "Let's go hiking" },
  { id: "5", name: "Eva",    unread: 0, lastMessage: "Great spot!" },
];

const MOCK_RECENTS: Recent[] = [
  { id: "1",  name: "Alice",          type: "friend", unread: 2 },
  { id: "g1", name: "Weekend Hikers", type: "group",  unread: 3 },
  { id: "3",  name: "Carol",          type: "friend", unread: 1 },
  { id: "g3", name: "Coffee Crew",    type: "group",  unread: 1 },
  { id: "2",  name: "Bob",            type: "friend", unread: 0 },
];

const MOCK_GROUPS: Group[] = [
  { id: "g1", name: "Weekend Hikers", membersCount: 5, unread: 3, lastMessage: "Trail starts at 9am" },
  { id: "g2", name: "City Explorers",  membersCount: 8, unread: 0, lastMessage: "New spot found!" },
  { id: "g3", name: "Coffee Crew",     membersCount: 3, unread: 1, lastMessage: "Meet at the usual?" },
];

export function useFriendsSheet() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const filteredFriends = useMemo(() => {
    if (!debouncedQuery.trim()) return MOCK_FRIENDS;
    const lower = debouncedQuery.toLowerCase();
    return MOCK_FRIENDS.filter((f) => f.name.toLowerCase().includes(lower));
  }, [debouncedQuery]);

  const filteredGroups = useMemo(() => {
    if (!debouncedQuery.trim()) return MOCK_GROUPS;
    const lower = debouncedQuery.toLowerCase();
    return MOCK_GROUPS.filter((g) => g.name.toLowerCase().includes(lower));
  }, [debouncedQuery]);

  const hasUnread =
    MOCK_FRIENDS.some((f) => f.unread > 0) ||
    MOCK_GROUPS.some((g) => g.unread > 0);

  function open() {
    setVisible(true);
  }

  function close() {
    setVisible(false);
    setQuery("");
  }

  return { visible, query, setQuery, filteredFriends, filteredGroups, recents: MOCK_RECENTS, hasUnread, open, close };
}

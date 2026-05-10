import React from 'react';
import { userApi } from '../utils/api';

export default function useMembers(user) {
  const [members, setMembers] = React.useState([]);
  const [membersLoading, setMembersLoading] = React.useState(false);

  const loadMembers = React.useCallback(async ({ silent = false } = {}) => {
    if (!user) return;
    if (!silent) setMembersLoading(true);

    try {
      const others = await userApi.list();

      // Add the current user locally so the Members page includes "you."
      setMembers([
        {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          color: user.color,
          online: true,
        },
        ...(Array.isArray(others) ? others : []),
      ]);
    } catch {
      setMembers(user ? [user] : []);
    } finally {
      if (!silent) setMembersLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (!user) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }

    loadMembers();
  }, [loadMembers, user]);

  return { members, membersLoading, loadMembers };
}
import { create } from 'zustand';
import type {
  AlertRule,
  AlertRuleWithLocation,
  AlertHistoryWithRule,
  NotificationPreferences,
} from '@/src/types/alerts.types';

interface AlertState {
  // Alert rules
  alertRules: AlertRuleWithLocation[];
  selectedAlertRule: AlertRule | null;

  // Alert history (notifications)
  alertHistory: AlertHistoryWithRule[];
  unreadCount: number;

  // Notification preferences
  notificationPreferences: NotificationPreferences | null;

  // Loading states
  isLoadingRules: boolean;
  isLoadingHistory: boolean;
  isLoadingPreferences: boolean;

  // Dialog states
  isAlertDialogOpen: boolean;
  alertDialogLocationId: string | null;
  editingRuleId: string | null;

  // Actions for alert rules
  setAlertRules: (rules: AlertRuleWithLocation[]) => void;
  addAlertRule: (rule: AlertRuleWithLocation) => void;
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => void;
  removeAlertRule: (id: string) => void;
  setSelectedAlertRule: (rule: AlertRule | null) => void;
  toggleAlertRule: (id: string, isActive: boolean) => void;

  // Actions for alert history
  setAlertHistory: (history: AlertHistoryWithRule[]) => void;
  addAlertHistory: (history: AlertHistoryWithRule) => void;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;

  // Actions for notification preferences
  setNotificationPreferences: (prefs: NotificationPreferences | null) => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;

  // Loading state actions
  setIsLoadingRules: (isLoading: boolean) => void;
  setIsLoadingHistory: (isLoading: boolean) => void;
  setIsLoadingPreferences: (isLoading: boolean) => void;

  // Dialog actions
  openAlertDialog: (locationId?: string, editingRuleId?: string) => void;
  closeAlertDialog: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  // Initial state
  alertRules: [],
  selectedAlertRule: null,
  alertHistory: [],
  unreadCount: 0,
  notificationPreferences: null,
  isLoadingRules: false,
  isLoadingHistory: false,
  isLoadingPreferences: false,
  isAlertDialogOpen: false,
  alertDialogLocationId: null,
  editingRuleId: null,

  // Alert rules actions
  setAlertRules: (rules) => set({ alertRules: rules }),

  addAlertRule: (rule) =>
    set((state) => ({
      alertRules: [rule, ...state.alertRules],
    })),

  updateAlertRule: (id, updates) =>
    set((state) => ({
      alertRules: state.alertRules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      ),
      selectedAlertRule:
        state.selectedAlertRule?.id === id
          ? { ...state.selectedAlertRule, ...updates }
          : state.selectedAlertRule,
    })),

  removeAlertRule: (id) =>
    set((state) => ({
      alertRules: state.alertRules.filter((rule) => rule.id !== id),
      selectedAlertRule:
        state.selectedAlertRule?.id === id ? null : state.selectedAlertRule,
    })),

  setSelectedAlertRule: (rule) => set({ selectedAlertRule: rule }),

  toggleAlertRule: (id, isActive) =>
    set((state) => ({
      alertRules: state.alertRules.map((rule) =>
        rule.id === id ? { ...rule, is_active: isActive } : rule
      ),
    })),

  // Alert history actions
  setAlertHistory: (history) => set({ alertHistory: history }),

  addAlertHistory: (history) =>
    set((state) => ({
      alertHistory: [history, ...state.alertHistory],
      unreadCount: state.unreadCount + 1,
    })),

  markAlertAsRead: (id) =>
    set((state) => ({
      alertHistory: state.alertHistory.map((h) =>
        h.id === id ? { ...h, is_read: true, read_at: new Date().toISOString() } : h
      ),
    })),

  markAllAlertsAsRead: () =>
    set((state) => ({
      alertHistory: state.alertHistory.map((h) => ({
        ...h,
        is_read: true,
        read_at: h.is_read ? h.read_at : new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  // Notification preferences actions
  setNotificationPreferences: (prefs) => set({ notificationPreferences: prefs }),

  updateNotificationPreferences: (updates) =>
    set((state) => ({
      notificationPreferences: state.notificationPreferences
        ? { ...state.notificationPreferences, ...updates }
        : null,
    })),

  // Loading state actions
  setIsLoadingRules: (isLoading) => set({ isLoadingRules: isLoading }),
  setIsLoadingHistory: (isLoading) => set({ isLoadingHistory: isLoading }),
  setIsLoadingPreferences: (isLoading) => set({ isLoadingPreferences: isLoading }),

  // Dialog actions
  openAlertDialog: (locationId, editingRuleId) =>
    set({
      isAlertDialogOpen: true,
      alertDialogLocationId: locationId || null,
      editingRuleId: editingRuleId || null,
    }),

  closeAlertDialog: () =>
    set({
      isAlertDialogOpen: false,
      alertDialogLocationId: null,
      editingRuleId: null,
    }),
}));

// Selector hooks for better performance
export const useAlertRules = () => useAlertStore((state) => state.alertRules);
export const useAlertHistory = () => useAlertStore((state) => state.alertHistory);
export const useUnreadAlertCount = () => useAlertStore((state) => state.unreadCount);
export const useNotificationPreferences = () =>
  useAlertStore((state) => state.notificationPreferences);
export const useIsAlertDialogOpen = () =>
  useAlertStore((state) => state.isAlertDialogOpen);

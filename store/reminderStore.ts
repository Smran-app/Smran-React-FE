import { create } from 'zustand';

export interface Reminder {
  id: string;
  title: string;
  link?: string;
  date: Date;
  repeat: string;
  profile: string;
  notifyBefore: number;
  snoozeDuration: number;
  isOn: boolean;
  isImage?: boolean;
  image?: any;
}

interface ReminderState {
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  toggleReminder: (id: string, val: boolean) => void;
  removeReminder: (id: string) => void;
}

// Initial mock data
const INITIAL_REMINDERS: Reminder[] = [
    {
        id: '1',
        title: 'Morning Meditation',
        link: 'https://calm.com',
        date: new Date(),
        repeat: 'Daily',
        profile: 'Important',
        notifyBefore: 10,
        snoozeDuration: 5,
        isOn: true,
    },
    {
        id: '2',
        title: 'Water the plants',
        date: new Date(),
        repeat: 'Weekly',
        profile: 'Low',
        notifyBefore: 0,
        snoozeDuration: 0,
        isOn: true,
        isImage: true,
        // image: require('../assets/adaptive-icon.png')
    }
];

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: INITIAL_REMINDERS,
  addReminder: (reminder) => set((state) => ({ reminders: [reminder, ...state.reminders] })),
  toggleReminder: (id, val) => set((state) => ({
    reminders: state.reminders.map((r) => r.id === id ? { ...r, isOn: val } : r)
  })),
  removeReminder: (id) => set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) })),
}));

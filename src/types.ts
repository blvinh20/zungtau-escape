export interface Participant {
  id: string;
  name: string;
  initials: string;
  color_class: string;
  colorClass?: string;
  avatar_url?: string;
}

export interface Activity {
  id: string;
  time: string;
  period: string;
  title: string;
  location: string;
  location_url?: string;
  description: string;
  imageUrl?: string;
  day: number;
}

export interface Expense {
  id: string;
  payer_id: string;
  reason: string;
  category: string;
  date: string;
  amount: number;
  created_at: string;
  participants?: Participant;
  expense_participants?: { participant_id: string }[];
}

export interface Memory {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: string;
  album: string;
  aspectRatio?: string;
}

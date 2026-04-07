export interface Participant {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
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
  payer: string;
  payerInitials: string;
  reason: string;
  date: string;
  amount: number;
  colorClass: string;
}

export interface Memory {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: string;
  aspectRatio?: string;
}

import { Participant } from '../../types';

export interface MemberBalance {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
  avatarUrl?: string;
  fundContributed: number;
  paidOnBehalf: number;
  fairShare: number;
  balance: number;
  isTreasurer: boolean;
}

export interface PaymentTransaction {
  from: { id: string; name: string; initials: string; avatarUrl?: string; colorClass: string };
  to: { id: string; name: string; initials: string; avatarUrl?: string; colorClass: string };
  amount: number;
}

export interface CategorySpend {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface SettlementStats {
  biggestExpense: { reason: string; amount: number; payerName: string };
  topContributor: { name: string; amount: number };
  biggestCategory: { category: string; amount: number };
  averagePerPerson: number;
  transactionCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Ẩm thực': 'bg-orange-400',
  'Di chuyển': 'bg-blue-400',
  'Giải trí': 'bg-purple-400',
  'Lưu trú': 'bg-emerald-400',
  'Khác': 'bg-gray-400',
};

export function computeMemberBalances(
  participants: Participant[],
  expenses: any[],
  fundContributions: any[],
  treasurerId: string
): MemberBalance[] {
  const totalSpending = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const fairShare = participants.length > 0 ? totalSpending / participants.length : 0;

  return participants.map(p => {
    const fundContributed = fundContributions
      .filter((c: any) => c.participant_id === p.id)
      .reduce((acc: number, c: any) => acc + Number(c.amount), 0);

    const paidOnBehalf = expenses
      .filter((e: any) => e.payer_id === p.id)
      .reduce((acc: number, e: any) => acc + Number(e.amount), 0);

    const isTreasurer = p.id === treasurerId;
    const effectivePaid = isTreasurer ? 0 : paidOnBehalf;
    const balance = Math.round((fundContributed + effectivePaid) - fairShare);

    return {
      id: p.id,
      name: p.name,
      initials: p.initials,
      colorClass: p.colorClass || p.color_class,
      avatarUrl: p.avatar_url,
      fundContributed,
      paidOnBehalf,
      fairShare: Math.round(fairShare),
      balance,
      isTreasurer,
    };
  });
}

export function computePaymentPlan(balances: MemberBalance[], treasurerId: string): PaymentTransaction[] {
  const treasurer = balances.find(b => b.isTreasurer);
  if (!treasurer) return [];

  const transactions: PaymentTransaction[] = [];

  for (const m of balances) {
    if (m.isTreasurer) continue;
    if (Math.abs(m.balance) < 1) continue;

    if (m.balance < 0) {
      // Nợ → nộp thêm cho thủ quỹ
      transactions.push({
        from: { id: m.id, name: m.name, initials: m.initials, avatarUrl: m.avatarUrl, colorClass: m.colorClass },
        to: { id: treasurer.id, name: treasurer.name, initials: treasurer.initials, avatarUrl: treasurer.avatarUrl, colorClass: treasurer.colorClass },
        amount: Math.abs(Math.round(m.balance)),
      });
    } else {
      // Thừa → thủ quỹ refund
      transactions.push({
        from: { id: treasurer.id, name: treasurer.name, initials: treasurer.initials, avatarUrl: treasurer.avatarUrl, colorClass: treasurer.colorClass },
        to: { id: m.id, name: m.name, initials: m.initials, avatarUrl: m.avatarUrl, colorClass: m.colorClass },
        amount: Math.round(m.balance),
      });
    }
  }

  return transactions;
}

export function computeCategoryBreakdown(expenses: any[]): CategorySpend[] {
  const map = new Map<string, number>();
  expenses.forEach(e => {
    const cat = e.category || 'Khác';
    map.set(cat, (map.get(cat) || 0) + Number(e.amount));
  });

  const total = [...map.values()].reduce((a, b) => a + b, 0);

  return [...map.entries()]
    .map(([category, sum]) => ({
      category,
      total: sum,
      percentage: total > 0 ? (sum / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || 'bg-gray-400',
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeStats(
  expenses: any[],
  fundContributions: any[],
  participantCount: number
): SettlementStats {
  const biggest = expenses.length > 0
    ? expenses.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, expenses[0])
    : null;

  const contributorTotals = new Map<string, number>();
  fundContributions.forEach(c => {
    const name = c.participants?.name || '';
    contributorTotals.set(name, (contributorTotals.get(name) || 0) + Number(c.amount));
  });
  const topContributor = [...contributorTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const categories = computeCategoryBreakdown(expenses);

  return {
    biggestExpense: {
      reason: biggest?.reason || 'N/A',
      amount: Number(biggest?.amount || 0),
      payerName: biggest?.participants?.name || 'N/A',
    },
    topContributor: { name: topContributor?.[0] || 'N/A', amount: topContributor?.[1] || 0 },
    biggestCategory: { category: categories[0]?.category || 'N/A', amount: categories[0]?.total || 0 },
    averagePerPerson: participantCount > 0
      ? Math.round(expenses.reduce((a, e) => a + Number(e.amount), 0) / participantCount)
      : 0,
    transactionCount: expenses.length,
  };
}

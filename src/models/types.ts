export type Pricing = Record<string, number>;

export type Budget = {
  isActive: boolean;
  amount: number;
  startDate: string;
  endDate: string;
};

export type Company = {
  id: number;
  name: string;
};

export type Site = {
  id: number;
  companyId: number;
  siteName: string;
  siteAddress: string;
  pin: string;
  pricing: Pricing;
  budget: Budget;
};

export type TicketItemMap = Record<string, number>;

export type Ticket = {
  id: number;
  ref: string;
  createdAt: string;
  companyId: number;
  companyName: string;
  siteId: number;
  siteName: string;
  guardName: string;
  phone: string;
  email: string;
  items: TicketItemMap;
  notes?: string;
  totalCost: number;
};

export interface MomoTransactionItem {
  id: string;
  ref: string;
  client: string;
  canal: string;
  amount: string;
  status: "Rapproché" | "En attente" | "Échoué";
  date: string;
}

export const momoTransactions: MomoTransactionItem[] = [
  {
    id: "t1",
    ref: "MOMO-2026-09-04829",
    client: "ABANDA Eric",
    canal: "MTN MoMo",
    amount: "250 000 FCFA",
    status: "Rapproché",
    date: "Aujourd'hui, 16:42",
  },
  {
    id: "t2",
    ref: "OM-2026-09-03217",
    client: "NKOULOU Sandrine",
    canal: "Orange Money",
    amount: "150 000 FCFA",
    status: "Rapproché",
    date: "Aujourd'hui, 14:18",
  },
  {
    id: "t3",
    ref: "MOMO-2026-09-04831",
    client: "FOKAM Emmanuel",
    canal: "MTN MoMo",
    amount: "300 000 FCFA",
    status: "En attente",
    date: "Aujourd'hui, 11:05",
  },
  {
    id: "t4",
    ref: "OM-2026-09-03220",
    client: "EBALE Marthe",
    canal: "Orange Money",
    amount: "100 000 FCFA",
    status: "En attente",
    date: "Hier, 18:30",
  },
  {
    id: "t5",
    ref: "MOMO-2026-09-04825",
    client: "TCHINDA Raoul",
    canal: "MTN MoMo",
    amount: "500 000 FCFA",
    status: "Rapproché",
    date: "Hier, 09:12",
  },
  {
    id: "t6",
    ref: "OM-2026-09-03198",
    client: "MBASSI Paul",
    canal: "Orange Money",
    amount: "75 000 FCFA",
    status: "Échoué",
    date: "03 Sept 2026",
  },
  {
    id: "t7",
    ref: "MOMO-2026-09-04810",
    client: "TCHOUNGUI Alain",
    canal: "MTN MoMo",
    amount: "400 000 FCFA",
    status: "Rapproché",
    date: "02 Sept 2026, 17:20",
  },
  {
    id: "t8",
    ref: "OM-2026-09-03185",
    client: "NDONGO Valérie",
    canal: "Orange Money",
    amount: "600 000 FCFA",
    status: "Rapproché",
    date: "02 Sept 2026, 12:45",
  },
  {
    id: "t9",
    ref: "MOMO-2026-09-04802",
    client: "KAMGA Pascal",
    canal: "MTN MoMo",
    amount: "180 000 FCFA",
    status: "Rapproché",
    date: "01 Sept 2026, 15:10",
  },
  {
    id: "t10",
    ref: "OM-2026-09-03162",
    client: "BISSOHONG Jean",
    canal: "Orange Money",
    amount: "90 000 FCFA",
    status: "Rapproché",
    date: "31 Août 2026",
  },
];

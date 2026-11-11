export interface PromoterItem {
  id: string;
  name: string;
  programme: string;
  city: string;
  available: number;
  total: number;
  priceRange: string;
  status: "Active" | "Complet";
  updated: string;
}

export const promotersData: PromoterItem[] = [
  {
    id: "p1",
    name: "Société Immobilière du Cameroun (SIC)",
    programme: "Cité des Cerisiers – Olembé",
    city: "Yaoundé",
    available: 45,
    total: 120,
    priceRange: "18 – 35 M FCFA",
    status: "Active",
    updated: "Aujourd'hui",
  },
  {
    id: "p2",
    name: "MAETUR",
    programme: "Lotissement Mendong Extension",
    city: "Yaoundé",
    available: 180,
    total: 350,
    priceRange: "8 – 15 M FCFA",
    status: "Active",
    updated: "Hier",
  },
  {
    id: "p3",
    name: "SIPIM SA",
    programme: "Cité des Cadres – Bonamoussadi",
    city: "Douala",
    available: 22,
    total: 80,
    priceRange: "25 – 55 M FCFA",
    status: "Active",
    updated: "02 Sept 2026",
  },
  {
    id: "p4",
    name: "Groupe Ngo & Fils",
    programme: "Green Villas Bastos",
    city: "Yaoundé",
    available: 8,
    total: 30,
    priceRange: "45 – 120 M FCFA",
    status: "Active",
    updated: "01 Sept 2026",
  },
  {
    id: "p5",
    name: "CFC Habitat (Interne)",
    programme: "Résidence CFC Nsimeyong",
    city: "Yaoundé",
    available: 0,
    total: 60,
    priceRange: "22 – 38 M FCFA",
    status: "Complet",
    updated: "30 Août 2026",
  },
  {
    id: "p6",
    name: "PROMETAL Cameroun",
    programme: "Cité Eco – Logbessou",
    city: "Douala",
    available: 95,
    total: 200,
    priceRange: "12 – 22 M FCFA",
    status: "Active",
    updated: "28 Août 2026",
  },
];

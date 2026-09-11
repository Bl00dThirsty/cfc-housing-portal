"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TrafficSourceDatum = {
  label: string;
  source: string;
  visitors: number;
};

const sourcesData: TrafficSourceDatum[] = [
  { label: "89.4k", source: "MTN Mobile Money (MoMo)", visitors: 89_400 },
  { label: "55.2k", source: "Orange Money (OM)", visitors: 55_200 },
  { label: "38.1k", source: "Virements SYSTAC / Banques", visitors: 38_100 },
  { label: "30.4k", source: "Agences CFC (Centre/Littoral)", visitors: 30_400 },
  { label: "22.7k", source: "Diaspora & Canaux Externes", visitors: 22_700 },
];

const campaignsData: TrafficSourceDatum[] = [
  { label: "46.8k", source: "Campagne Épargne Habitat 2026", visitors: 46_800 },
  { label: "28.0k", source: "Programme Logements Olembé", visitors: 28_000 },
  { label: "17.7k", source: "Partenariat Fonction Publique", visitors: 17_700 },
  { label: "12.9k", source: "Salon Immobilier Douala", visitors: 12_900 },
  { label: "9.3k", source: "Diaspora Invest Cameroun", visitors: 9300 },
];

const referrersData: TrafficSourceDatum[] = [
  { label: "38.4k", source: "Portail MINHDU Officiel", visitors: 38_400 },
  { label: "24.9k", source: "Réseaux Sociaux / WhatsApp", visitors: 24_900 },
  { label: "15.7k", source: "Guichet MINDCAF Foncier", visitors: 15_700 },
  { label: "11.8k", source: "Presse / Médias Économiques", visitors: 11_800 },
  { label: "8.6k", source: "Banques Partenaires (BEAC)", visitors: 8600 },
];

function renderValueLabel(props: LabelProps) {
  const { height, value, y } = props;

  return (
    <text
      className="fill-foreground font-semibold"
      dominantBaseline="middle"
      dx={-10}
      fontSize={12}
      textAnchor="end"
      x="100%"
      y={Number(y) + Number(height) / 2}
    >
      {value}
    </text>
  );
}

function TrafficSourceBarChart({ data }: { data: TrafficSourceDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            left: 0,
            right: 48,
            top: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid horizontal={false} vertical={false} />
          <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
          <XAxis dataKey="visitors" hide type="number" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TrafficSourceDatum;
                return (
                  <div className="rounded-lg border bg-popover p-2 text-xs text-popover-foreground shadow-md">
                    <span className="font-semibold">{item.source}:</span> {item.visitors.toLocaleString()} épargnants
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar barSize={36} dataKey="visitors" fill="#94a3b8" fillOpacity={0.3} radius={6}>
            <LabelList className="fill-foreground font-medium" dataKey="source" fontSize={13} offset={12} position="insideLeft" />
            <LabelList content={renderValueLabel} dataKey="label" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopTrafficSources() {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal text-base">Canaux de Collecte & Provenance</CardTitle>
        <CardAction>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Options"
          >
            <Ellipsis className="size-4" />
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs defaultValue="sources" className="flex flex-col gap-3">
          <TabsList className="w-full justify-start border-b px-2.5" variant="line">
            <TabsTrigger className="flex-none font-normal" value="sources">
              Canaux de Paiement
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="campaigns">
              Campagnes & Programmes
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="referrers">
              Partenaires & Référants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="px-4">
            <TrafficSourceBarChart data={sourcesData} />
          </TabsContent>

          <TabsContent value="campaigns" className="px-4">
            <TrafficSourceBarChart data={campaignsData} />
          </TabsContent>
          <TabsContent value="referrers" className="px-4">
            <TrafficSourceBarChart data={referrersData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

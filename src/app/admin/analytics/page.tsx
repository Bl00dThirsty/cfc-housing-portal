import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalyticsKpiStrip } from "./_components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { RealtimeVisitors } from "./_components/realtime-visitors";
import { TopPages } from "./_components/top-pages";
import { TopTrafficSources } from "./_components/top-traffic-sources";
import { TrafficQuality } from "./_components/traffic-quality";
import { EpargnantsTab } from "./_components/epargnants-tab";
import { CanauxCollecteTab } from "./_components/canaux-collecte-tab";
import { SimulationsTab } from "./_components/simulations-tab";
import { DossiersDucTab } from "./_components/dossiers-duc-tab";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tableau de Bord & Indicateurs de Performance (CFC)
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Suivi de la campagne Épargne Habitat, des flux de collecte Mobile Money / SYSTAC et de la conversion vers le Guichet Unique DUC.
        </p>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="audience">Épargnants</TabsTrigger>
            <TabsTrigger value="acquisition">Canaux de Collecte</TabsTrigger>
            <TabsTrigger value="engagement">Simulations</TabsTrigger>
            <TabsTrigger value="conversions">Dossiers DUC</TabsTrigger>
          </TabsList>

          <AnalyticsToolbar />
        </div>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <AnalyticsKpiStrip />

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TrafficQuality />
            </div>
            <div className="xl:col-span-5">
              <RealtimeVisitors />
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TopPages />
            </div>
            <div className="xl:col-span-5 xl:col-start-8">
              <TopTrafficSources />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <EpargnantsTab />
        </TabsContent>

        <TabsContent value="acquisition">
          <CanauxCollecteTab />
        </TabsContent>

        <TabsContent value="engagement">
          <SimulationsTab />
        </TabsContent>

        <TabsContent value="conversions">
          <DossiersDucTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

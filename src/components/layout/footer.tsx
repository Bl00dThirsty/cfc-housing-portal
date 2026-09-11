import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, PhoneCall, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="relative h-10 w-36 bg-white p-1 rounded-lg">
              <Image
                src="/images/logo-cfc.png"
                alt="Crédit Foncier du Cameroun"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Institution financière publique spécialisée dans le financement de l&apos;habitat social et de la promotion immobilière au Cameroun.
            </p>
            <div className="flex items-center gap-1.5 text-cfc-gold text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conforme Réglementation COBAC & BEAC</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Services Dématérialisés</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/simulator" className="hover:text-white transition-colors">Simulateur Épargne Habitat</Link></li>
              <li><Link href="/onboarding" className="hover:text-white transition-colors">Création Dossier Unique (DUC)</Link></li>
              <li><Link href="/portal" className="hover:text-white transition-colors">Guichet Unique Documentaire</Link></li>
              <li><Link href="/portal" className="hover:text-white transition-colors">Suivi des 6 Phases de Crédit</Link></li>
            </ul>
          </div>

          {/* Col 3: Partenaires */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Écosystème Partenaires</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>MINDCAF (Domaines & Cadastre)</li>
              <li>Bureaux d&apos;Études Techniques (BET)</li>
              <li>Chambre des Notaires du Cameroun</li>
              <li>Promoteurs Agréés (MAETUR, SIC)</li>
              <li>Agrégateurs Mobile Money (MTN, Orange)</li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Siège & Agences</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cfc-gold shrink-0 mt-0.5" />
                <span>Siège Social : Boulevard du 20 Mai, Yaoundé, Cameroun</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-cfc-gold shrink-0" />
                <span>+237 222 23 23 23 / 699 00 00 00</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cfc-gold shrink-0" />
                <span>contact@creditfoncier.cm</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Crédit Foncier du Cameroun. Tous droits réservés.</p>
          <p>Conforme Loi n° 2024/001 (Archives & SAE) · Loi n° 2024/017 (Protection des données)</p>
        </div>
      </div>
    </footer>
  );
}

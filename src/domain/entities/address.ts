export type AddressKind =
  | "house"
  | "road"
  | "neighbourhood"
  | "city"
  | "county"
  | "state"
  | "country"
  | "other";

export type AddressSuggestion = {
  placeId: string;
  label: string;
  shortLabel: string;
  kind: AddressKind;
  lat: number | null;
  lon: number | null;
  osmType: string;
  osmId: string;
  postcode: string | null;
  countryCode: string | null;
};

export type SelectedAddress = AddressSuggestion & {
  source: "nominatim" | "catalogue" | "manual";
};

export type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
  house_number?: string;
};

export type NominatimResult = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  address?: NominatimAddress;
};

const KIND_LABELS: Record<AddressKind, string> = {
  house: "Adresse précise",
  road: "Rue / avenue",
  neighbourhood: "Quartier",
  city: "Ville",
  county: "Département",
  state: "Région",
  country: "Pays",
  other: "Lieu",
};

export function addressKindLabel(kind: AddressKind): string {
  return KIND_LABELS[kind];
}

export function classifyAddress(result: NominatimResult): AddressKind {
  const address = result.address ?? {};
  const type = result.type ?? "";

  if (type === "house" || address.house_number) return "house";
  if (result.class === "highway" || type === "road" || type === "residential") return "road";
  if (address.quarter || address.neighbourhood || address.suburb) return "neighbourhood";
  if (address.city || address.town || address.village) return "city";
  if (address.county) return "county";
  if (address.state) return "state";
  if (address.country) return "country";
  return "other";
}

function shortLabelFor(result: NominatimResult, kind: AddressKind): string {
  const address = result.address ?? {};
  const parts: string[] = [];

  if (kind === "house") {
    const street = address.road;
    const number = address.house_number;
    if (street) parts.push(number ? `${number} ${street}` : street);
  }

  const locality =
    address.quarter ??
    address.neighbourhood ??
    address.suburb ??
    address.city ??
    address.town ??
    address.village ??
    address.county ??
    address.state;

  if (locality && !parts.includes(locality)) parts.push(locality);
  if (parts.length === 0) parts.push(result.display_name.split(",")[0]);

  return parts.slice(0, 3).join(", ");
}

export function toSuggestion(result: NominatimResult): AddressSuggestion {
  const kind = classifyAddress(result);
  const lat = Number.parseFloat(result.lat);
  const lon = Number.parseFloat(result.lon);

  return {
    placeId: String(result.place_id),
    label: result.display_name,
    shortLabel: shortLabelFor(result, kind),
    kind,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    osmType: result.osm_type ?? "",
    osmId: String(result.osm_id ?? ""),
    postcode: result.address?.postcode ?? null,
    countryCode: result.address?.country_code ?? null,
  };
}

/**
 * Catalogue de repli : la couverture OpenStreetMap est incomplète au
 * Cameroun. Tant que l'utilisateur n'a pas saisi au moins trois caractères,
 * on lui propose les localités connues plutôt qu'une liste vide.
 */
export const CAMEROON_PLACES: ReadonlyArray<{
  label: string;
  shortLabel: string;
  kind: AddressKind;
  city: string;
  region: string;
}> = [
  { label: "Yaoundé, Centre, Cameroun", shortLabel: "Yaoundé", kind: "city", city: "Yaoundé", region: "Centre" },
  { label: "Douala, Littoral, Cameroun", shortLabel: "Douala", kind: "city", city: "Douala", region: "Littoral" },
  { label: "Bafoussam, Ouest, Cameroun", shortLabel: "Bafoussam", kind: "city", city: "Bafoussam", region: "Ouest" },
  { label: "Garoua, Nord, Cameroun", shortLabel: "Garoua", kind: "city", city: "Garoua", region: "Nord" },
  { label: "Maroua, Extrême-Nord, Cameroun", shortLabel: "Maroua", kind: "city", city: "Maroua", region: "Extrême-Nord" },
  { label: "Ngaoundéré, Adamaoua, Cameroun", shortLabel: "Ngaoundéré", kind: "city", city: "Ngaoundéré", region: "Adamaoua" },
  { label: "Bamenda, Nord-Ouest, Cameroun", shortLabel: "Bamenda", kind: "city", city: "Bamenda", region: "Nord-Ouest" },
  { label: "Buea, Sud-Ouest, Cameroun", shortLabel: "Buea", kind: "city", city: "Buea", region: "Sud-Ouest" },
  { label: "Limbé, Sud-Ouest, Cameroun", shortLabel: "Limbé", kind: "city", city: "Limbé", region: "Sud-Ouest" },
  { label: "Kribi, Sud, Cameroun", shortLabel: "Kribi", kind: "city", city: "Kribi", region: "Sud" },
  { label: "Ebolowa, Sud, Cameroun", shortLabel: "Ebolowa", kind: "city", city: "Ebolowa", region: "Sud" },
  { label: "Bertoua, Est, Cameroun", shortLabel: "Bertoua", kind: "city", city: "Bertoua", region: "Est" },
  { label: "Dschang, Ouest, Cameroun", shortLabel: "Dschang", kind: "city", city: "Dschang", region: "Ouest" },
  { label: "Edéa, Littoral, Cameroun", shortLabel: "Edéa", kind: "city", city: "Edéa", region: "Littoral" },
  { label: "Kumba, Sud-Ouest, Cameroun", shortLabel: "Kumba", kind: "city", city: "Kumba", region: "Sud-Ouest" },
  { label: "Bastos, Yaoundé, Cameroun", shortLabel: "Bastos, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Biyem-Assi, Yaoundé, Cameroun", shortLabel: "Biyem-Assi, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Makepe, Yaoundé, Cameroun", shortLabel: "Makepe, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Mfandini, Yaoundé, Cameroun", shortLabel: "Mfandini, Yaondé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Nlongkak, Yaoundé, Cameroun", shortLabel: "Nlongkak, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Ekounou, Yaoundé, Cameroun", shortLabel: "Ekounou, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Mendong, Yaoundé, Cameroun", shortLabel: "Mendong, Yaoundé", kind: "neighbourhood", city: "Yaoundé", region: "Centre" },
  { label: "Akwa, Douala, Cameroun", shortLabel: "Akwa, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Bonanjo, Douala, Cameroun", shortLabel: "Bonanjo, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Bonapriso, Douala, Cameroun", shortLabel: "Bonapriso, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Ndokotti, Douala, Cameroun", shortLabel: "Ndokotti, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Deido, Douala, Cameroun", shortLabel: "Deido, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Logbessou, Douala, Cameroun", shortLabel: "Logbessou, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
  { label: "Bepanda, Douala, Cameroun", shortLabel: "Bepanda, Douala", kind: "neighbourhood", city: "Douala", region: "Littoral" },
];

export function catalogueSuggestions(query: string): AddressSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  return CAMEROON_PLACES.filter((place) =>
    place.label.toLowerCase().includes(needle),
  )
    .slice(0, 6)
    .map((place, index) => ({
      placeId: `catalogue-${index}-${place.city.toLowerCase()}`,
      label: place.label,
      shortLabel: place.shortLabel,
      kind: place.kind,
      lat: null,
      lon: null,
      osmType: "catalogue",
      osmId: place.city,
      postcode: null,
      countryCode: "cm",
    }));
}

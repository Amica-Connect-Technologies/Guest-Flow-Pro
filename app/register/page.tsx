"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { registrationsApi } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

// ── Country config ───────────────────────────────────────────────────────────
const COUNTRY_CONFIG: Record<string, { code: string; flag: string; cities: string[] }> = {
  Italy: {
    code: "+39",
    flag: "🇮🇹",
    cities: [
      "Rome", "Milan", "Naples", "Turin", "Genoa", "Florence",
      "Bari", "Verona", "Venice", "Cosenza", "Padova", "Trieste",
      "Parma", "Prato", "Taranto", "Reggio di Calabria", "Perugia", "Ravenna",
      "Livorno", "Rimini", "Cagliari", "Salerno", "Giugliano in Campania", "Monza",
      "Sassari", "Bergamo", "Trento", "Pescara", "Forlì", "Siracusa",
      "Vicenza", "Udine", "Andria", "Cesena", "Pesaro", "Barletta",
      "Alessandria", "Mestre", "Treviso", "Busto Arsizio", "Brindisi", "Fiumicino",
      "Torre del Greco", "Sesto San Giovanni", "Pozzuoli", "Cinisello Balsamo", "Aprilia", "Casoria",
      "Carpi", "Asti", "Ragusa", "Caserta", "Gela", "Altamura",
      "Imola", "Quartu Sant’Elena", "Acilia", "Calimera", "Viterbo", "Potenza",
      "Pomezia", "Vittoria", "Castellammare di Stabia", "Vigevano", "Afragola", "Legnano",
      "Fano", "Carrara", "Matera", "Anzio", "Faenza", "Crotone",
      "Acerra", "Savona", "Marano di Napoli", "Molfetta", "Cerignola", "Cuneo",
      "Foligno", "Trani", "Manfredonia", "Bitonto", "Bagheria", "Gallarate",
      "San Remo", "Velletri", "Portici", "Pordenone", "Teramo", "Cava de’ Tirreni",
      "Acireale", "Rho", "Ercolano", "Mazara del Vallo", "Rovigo", "Aversa",
      "Battipaglia", "Scandicci", "San Severo", "Misterbianco", "Empoli", "Sesto Fiorentino",
      "Chieti", "Collegno", "Scafati", "Nettuno", "Monopoli", "Campi Bisenzio",
      "Rivoli", "Paderno Dugnano", "Corato", "San Benedetto del Tronto", "Martina Franca", "Lecco",
      "Cologno Monzese", "Lissone", "Marino", "Ascoli Piceno", "Rieti", "Vercelli",
      "Paterno", "Seregno", "Cascina", "Lodi", "Alcamo", "Gravina in Puglia",
      "Biella", "San Giorgio a Cremano", "Alghero", "Civitanova Marche", "San Donà di Piave", "Desio",
      "Merano", "Monterotondo", "Vasto", "Avezzano", "Corigliano Calabro", "Torre Annunziata",
      "Barcellona-Pozzo di Gotto", "Rovereto", "Carini", "Albano Laziale", "Cantù", "Pomigliano d’Arco",
      "Fondi", "San Giuliano Milanese", "Iesi", "Monreale", "Ciampino", "Schio",
      "Saronno", "Formia", "Grugliasco", "Maddaloni", "Melito di Napoli", "Modugno",
      "Pioltello", "Caivano", "Caltagirone", "Belluno", "Casalecchio di Reno", "Cento",
      "Brugherio", "Francavilla Fontana", "Cernusco sul Naviglio", "Limbiate", "Osimo", "Augusta",
      "Mugnano di Napoli", "Formigine", "Canicattì", "Corsico", "Conegliano", "Licata",
      "Angri", "Adrano", "Somma Vesuviana", "Castelfranco Veneto", "Abbiategrasso", "Lugo",
      "Sant’Antimo", "Venaria Reale", "Termoli", "Casale Monferrato", "Piombino", "San Donato Milanese",
      "Arzano", "Mascalucia", "Massafra", "Santa Maria Capua Vetere", "Favara", "Villaricca",
      "Montebelluna", "Vibo Valentia", "Lucera", "Nardò", "Treviglio", "Partinico",
      "Gubbio", "Avola", "Oristano", "Ostuni", "San Giuseppe Vesuviano", "Rosignano Marittimo",
      "Monfalcone", "Milazzo", "Manduria", "Desenzano del Garda", "Rapallo", "Marigliano",
      "Misilmeri", "Mondragone", "Frattamaggiore", "Selargius", "Poggibonsi", "Carmagnola",
      "Canosa di Puglia", "Aci Catena", "Parabiago", "Mogliano Veneto", "Spinea", "Chiavari",
      "Lido di Iesolo", "Mirano", "Vittorio Veneto", "Fidenza", "Albignasego", "Garbagnate Milanese",
      "Borgo Panigale", "Gioia del Colle", "Iesolo", "Giarre", "Tortona", "Carbonia",
      "San Giovanni Rotondo", "Lainate", "Sant’Anastasia", "Bresso", "Boscoreale", "Putignano",
      "Galatina", "Vimercate", "Assèmini", "Vignola", "Conversano", "Valdagno",
      "Porto Sant’Elpidio", "Falconara Marittima", "Enna", "San Giovanni Lupatoto", "Arzignano", "Seriate",
      "Mariano Comense", "Bacoli", "Bagno a Ripoli", "Iglesias", "Correggio", "Termini Imerese",
      "Sora", "Qualiano", "Ruvo di Puglia", "Portogruaro", "Fossano", "Magenta",
      "Mirandola", "Montevarchi", "Pompei", "Thiene", "San Giovanni la Punta", "Sezze",
      "Muggiò", "Albenga", "Giulianova", "Montecchio Maggiore", "Dalmine", "Capoterra",
      "Copertino", "Genzano di Roma", "Ventimiglia", "Bressanone", "Frascati", "Fucecchio",
      "Ceccano", "Poggiomarino", "Ortona", "Sulmona", "Palestrina", "Comacchio",
      "Ginosa", "Colle di Val d’Elsa", "Cardito", "Trezzano sul Naviglio", "Senago", "Casal di Principe",
      "Gorgonzola", "Floridia", "Martellago", "Sondrio", "Castrovillari", "Sestu",
      "Castel San Pietro Terme", "Montecatini Terme", "Bussolengo", "Cornaredo", "Piazza Armerina", "Rosolini",
      "Palo del Colle", "Romano di Lombardia", "Trecate", "Follonica", "Cormano", "Trentola",
      "Vico Equense", "Abano Terme", "Rivalta di Torino", "Pallazzolo sull’Oglio", "Oderzo", "Novate Milanese",
      "Sacile", "Viadana", "San Salvo", "Ischia", "Lastra a Signa", "Gallipoli",
      "Castellana Grotte", "Giovinazzo", "Casamassima", "Rovato", "Cassano d’Adda", "Gioia Tauro",
      "Scorzè", "Acqui Terme", "Casalgrande", "Monserrato", "Pozzallo", "Cusano Milanino",
      "Corbetta", "Adria", "San Mauro Torinese", "Ghedi", "Castelfidardo", "Bracciano",
      "Melzo", "Ciriè", "San Vito dei Normanni", "Pavullo nel Frignano", "Borgo San Lorenzo", "Calenzano",
      "Aci Sant’Antonio", "Marsciano", "Ariccia", "Melegnano", "Agliana", "Palmi",
      "Ribera", "Arcore", "Cordenons", "Carate Brianza", "Somma Lombardo", "Domodossola",
      "Marcon", "Polignano a Mare", "Forio", "Beinasco", "Maranello", "Castelfiorentino",
      "Sìnnai", "Figline Valdarno", "Carlentini", "Cercola", "Carovigno", "Nerviano",
      "Orta Nova", "Preganziol", "Medicina", "San Giovanni Valdarno", "Gussago", "Cassano al Ionio",
      "Alpignano", "Adelfia", "Reggello", "Vedelago", "Malnate", "Umbertide",
      "Palma Campania", "Castellaneta", "Castenaso", "Noale", "Bovolone", "San Cesareo",
      "Este", "Valeggio sul Mincio", "Tarquinia", "San Giovanni in Fiore", "Brusciano", "Codroipo",
      "Grottammare", "Lentate sul Seveso", "Palagiano", "Altopascio", "Todi", "Azzano Decimo",
      "Molinella", "Ponsacco", "Galliate", "Zevio", "Agrate Brianza", "Codogno",
      "Casalpusterlengo", "Pianezza", "Sorrento", "Mortara", "Frattaminore", "Sava",
      "Mottola", "Volpiano", "Capurso", "San Vito al Tagliamento", "Sansepolcro", "Sant’Arpino",
      "Dolo", "Taurianova", "Paola", "Surbo", "Ospitaletto", "Collecchio",
      "Rubiera", "Corridonia", "Malo", "Castellammare del Golfo", "Guastalla", "Sorso",
      "Leno", "Omegna", "Orbetello", "Chiaravalle", "Gualdo Tadino", "Santa Maria a Vico",
      "San Giorgio Ionico", "Rescaldina", "Montelupo Fiorentino", "Luino", "Trepuzzi", "Cirò Marina",
      "Riposto", "Cassina de’ Pecchi", "Castellanza", "Locorotondo", "Cefalù", "Amantea",
      "Sannicandro Garganico", "Varedo", "Travagliato", "Priverno", "Taglio", "Crevalcore",
      "Castel San Giorgio", "San Ferdinando di Puglia", "Maglie", "Formello", "Cervignano del Friuli", "Latiano",
      "Calolziocorte", "Squinzano", "Veglie", "Vieste", "Alzano Lombardo", "Manerbio",
      "Vetralla", "San Martino di Lupari", "Noceto", "Tempio Pausania", "Villacidro", "Melilli",
      "Casale sul Sile", "Vigodarzere", "Crispiano", "Sarezzo", "San Pietro Vernotico", "Turi",
      "Statte", "Múggia", "San Pietro in Casale", "Terrasini Favarotta", "Quartucciu", "Spilamberto",
      "Fontanafredda", "Salzano", "Villa San Giovanni", "Cavarzere", "Gricignano d’Aversa", "Cairo Montenotte",
      "Lipari", "Montegranaro", "Rionero in Vulture", "Canegrate", "Fagnano Olona", "Villa Literno",
      "Calvizzano", "Orzinuovi", "Porto Recanati", "Piano di Sorrento", "Biassono", "Spresiano",
      "Morbegno", "Russi", "San Prisco", "Solofra", "Occhiobello", "Raffadali",
      "Trezzo sull’Adda", "Cinisi", "Sant’Agata di Militello", "Monte di Procida", "Lizzanello", "Spilimbergo",
      "Baranzate", "Camposampiero", "Menfi", "Barrafranca", "Francofonte", "Marotta",
      "Casteldaccia", "Castenedolo", "Amelia", "Maniago", "Stradella", "Lonate Pozzolo",
      "Monte Sant’Angelo", "Taurisano", "Trecastagni", "Priolo Gargallo", "Margherita di Savoia", "Pulsano",
      "Caorle", "Paullo", "Arenzano", "Codigoro", "Cologno al Serio", "Santa Flavia",
      "Matino", "Guspini", "Santa Croce Camerina", "Mazzarino", "Cividale del Friuli", "Castano Primo",
      "Paceco", "Cave", "Isola del Liri", "Martinengo", "Grezzana", "Loano",
      "Cameri", "Sant’Antìoco", "Avigliano", "Riesi", "Taormina", "Melito di Porto Salvo",
      "Salò", "Cislago", "Montecchio Emilia", "Atripalda", "Bonate di Sopra", "Ravanusa",
      "Locate di Triulzi", "San Maurizio Canavese", "Randazzo", "Poirino", "Bordighera", "Piedimonte d’Alife",
      "Rignano Flaminio", "Mori", "Nizza Monferrato", "Procida", "Fiuggi", "Alassio",
      "Macerata Campania", "Goito", "Capodrise", "Salemi", "Conselve", "Mussomeli",
      "Polistena", "Campi Salentina", "Meldola", "Ozieri", "Boscotrecase", "Trescore Balneario",
      "Cittanova", "San Giorgio del Sannio", "Terralba", "Lurate Caccivio", "Casaluce", "Cesa",
      "Volterra", "Castel Bolognese", "Vaprio d’Adda", "Mareno di Piave", "Dolianova", "Elmas",
      "Magnago", "Vanzago", "Gassino Torinese", "Gaggiano", "Pasian di Prato", "Montescaglioso",
      "Maserada sul Piave", "Maserà di Padova", "Campobello di Licata", "Monteroni d’Arbia", "Foiano della Chiana", "Venturina",
      "Druento", "San Marzano di San Giuseppe", "Pandino", "Aradeo", "Albinea", "Ala",
      "Uta", "La Loggia", "Aragona", "Coccaglio", "Mozzate", "Parabita",
      "Càbras", "Cutrofiano", "Roccapiemonte", "Flero", "Gonzaga", "Roverbella",
      "Torre Boldone", "Lequile", "Triuggio", "Sant’Agnello", "Martano", "Serramanna",
      "Trebisacce", "Brembate", "Rignano sull’Arno", "Fiesso d’Artico", "Cogoleto", "Bruino",
      "San Sperate", "Decimomannu", "Casapulla", "Sortino", "Tuscania", "Rossano Veneto",
      "Minervino Murge", "Cellole", "Sanluri", "Marnate", "Verdello", "Santhià",
      "San Gavino Monreale", "San Giuseppe Iato", "Verolanuova", "Quarto d’Altino", "Origgio", "Vallo della Lucania",
      "Chiaramonte Gulfi", "Rovellasca", "Maracalagonis", "Pisogne", "Villa Guardia", "Mariglianella",
      "Monte Urano", "Manziana", "Cervaro", "Cairate", "Portico di Caserta", "Campomarino",
      "Carnate", "Agira", "Caccamo", "Grado", "Racalmuto", "Marmirolo",
      "Novoli", "Recale", "Palagianello", "Stra", "Solarino", "Soncino",
      "Cariati", "Città della Pieve", "Carmignano di Brenta", "Alife", "Borgo a Buggiano", "Bovezzo",
      "Vedano Olona", "Chiavenna", "Volta Mantovana", "Vietri sul Mare", "Porto Potenza Picena", "Staranzano",
      "Cambiago", "Camerano", "Borgetto", "Marcellina", "Borgo", "Noventa di Piave",
      "Settimo San Pietro", "Cimitile", "Sennori", "Lazise", "Barlassina", "Urbania",
      "Anacapri", "Melissano", "Sarnico", "Albiate", "Ceriano Laghetto", "Villa di Serio",
      "Villasor", "Carosino", "Oliena", "Gorle", "Carnago", "San Cipriano Picentino",
      "Canicattini Bagni", "San Vincenzo", "Poggio Rusco", "Sapri", "Montebello Vicentino", "Piedimonte San Germano",
      "Sommariva del Bosco", "Serra San Bruno", "Subbiano", "Canova", "Silandro", "Balestrate",
      "Marcallo con Casone", "Lesina", "Montenero di Bisaccia", "Gonnosfanàdiga", "Roccella Ionica", "San Polo d’Enza in Caviano",
      "Marineo", "Ceggia", "Cellino San Marco", "Strambino", "Abbadia San Salvatore", "Guidizzolo",
      "Carloforte", "Cambiano", "Serravalle Scrivia", "Poggiardo", "San Secondo Parmense", "Villanuova sul clisi",
      "Brolo", "Rosate", "Arbus", "San Tammaro", "Castelsardo", "Corigliano d’Otranto",
      "Genazzano", "Dello", "Casorezzo", "Serradifalco", "Acque Dolci", "Ossi",
      "Trezzano Rosa", "Solbiate Olona", "Vanzaghello", "Torchiarolo", "Maruggio", "Stornarella",
      "Boretto", "Grotte", "Albisola Marina", "Albizzate", "Arosio", "Calatabiano",
      "Sannazzaro de’ Burgondi", "Montanaro", "Camposano", "Diamante", "Canino", "Telgate",
      "Cividate al Piano", "Camogli", "Fragagnano", "Castelnuovo Scrivia", "Portoscuso", "Senorbì",
      "Santa Ninfa", "Robecchetto con Induno", "Cupello", "Osnago", "Amalfi", "Popoli",
      "Spadafora", "Murano", "Acquarica del Capo", "Breno", "Gonnesa", "Azzate",
      "San Giovanni Bianco", "Dorno", "Favignana", "Scilla", "Baiano", "Monastir",
      "Bogliasco", "San Paolo", "Edolo", "Vignanello", "Malgrate", "Livorno Ferraris",
      "Prizzi", "Decimoputzu", "Garda", "Fossalta di Piave", "Bova Marina", "Sant’Antonio di Susa",
      "Bozzolo", "Palau", "Sabbio Chiese", "Sori", "Altavilla Irpina", "Francavilla in Sinni",
      "Roccalumera", "Orgosolo", "Sardara", "Casazza", "Occhieppo Inferiore", "Allumiere",
      "Villasimìus", "Fonni", "Stigliano", "Passo Corese", "Marina di Pisa", "Nizza di Sicilia",
      "Sergnano", "Aci Bonaccorsi", "Lauro", "Zapponeta", "Furci Siculo", "Bonorva",
      "Casalmaiocco", "Marone", "San Lorenzo del Vallo", "Sperlonga", "Misano di Gera d’Adda", "Viguzzolo",
      "Bagnoli Irpino", "Arsiero", "Trescore Cremasco", "Castronuovo di Sicilia", "Poggio Moiano", "Riva Ligure",
      "Falcone", "Turriaco", "Licodia Eubea", "Bronzolo", "Pellestrina", "Chiusa Sclafani",
    ],
  },
  "United Kingdom": {
    code: "+44",
    flag: "🇬🇧",
    cities: [
      "London", "Birmingham", "Manchester", "Liverpool", "Leeds",
      "Sheffield", "Bristol", "Edinburgh", "Glasgow", "Cardiff",
      "Leicester", "Nottingham", "Coventry", "Bradford", "Belfast",
      "Newcastle upon Tyne", "Southampton", "Portsmouth", "Brighton",
      "Plymouth", "Reading", "Derby", "Wolverhampton", "Stoke-on-Trent",
      "Sunderland", "Oxford", "Cambridge", "Bath", "York", "Exeter",
      "Norwich", "Bournemouth", "Luton", "Aberdeen", "Swansea",
      "Milton Keynes", "Northampton", "Peterborough", "Middlesbrough",
      "Chester", "Dundee", "Swindon", "Kingston upon Hull",
    ],
  },
  Other: { code: "", flag: "🌍", cities: [] },
};

// ── Plans ────────────────────────────────────────────────────────────────────
const PLAN_META = [
  { id: "concierge"         as const, price: "£25", period: "/month", accent: "blue"   },
  { id: "checkin"           as const, price: "£50", period: "/month", accent: "violet" },
  { id: "concierge_checkin" as const, price: "£75", period: "/month", popular: true, accent: "cyan" },
  { id: "full"              as const, price: "£100", period: "/month", accent: "amber" },
];

// ── Form state ───────────────────────────────────────────────────────────────
interface Form {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  business_name: string;
  city: string;
  country: string;
  whatsapp_number: string;
  website: string;
  plan: "concierge" | "checkin" | "concierge_checkin" | "full";
  payment_method: "stripe" | "bank_transfer" | "invoice";
}

const empty: Form = {
  owner_name: "", email: "", phone: "", password: "", confirm_password: "",
  business_name: "", city: "", country: "", whatsapp_number: "", website: "",
  plan: "concierge",
  payment_method: "bank_transfer",
};

function getCode(country: string) {
  return COUNTRY_CONFIG[country]?.code ?? "";
}
function getCities(country: string) {
  return [...(COUNTRY_CONFIG[country]?.cities ?? [])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}
// Max subscriber digits (excluding country code)
function getMaxDigits(country: string): number {
  if (country === "Italy")          return 10;
  if (country === "United Kingdom") return 10;
  return 15;
}
function sanitizePhone(val: string, maxDigits: number): string {
  // Allow digits, spaces, hyphens only
  const cleaned = val.replace(/[^\d\s\-]/g, "");
  // Count only the digit characters
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length > maxDigits) return cleaned.slice(0, cleaned.length - (digits.length - maxDigits));
  return cleaned;
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{msg}</p>;
}

function Input({
  label, type = "text", value, onChange, placeholder, error, suffix,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-300 focus:ring-red-100 focus:border-red-400"
              : "border-slate-200 focus:ring-blue-50 focus:border-blue-400"
          } ${suffix ? "pr-12" : ""}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

type BankDetails = {
  account_name: string; bank_name: string; sort_code: string;
  account_number: string; iban: string; swift: string; reference: string;
};

// ── Page ──────────────────────────────────────────────────────────────────────
function RegisterPageInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as Form["plan"] | null;
  const validPlans: Form["plan"][] = ["concierge", "checkin", "concierge_checkin", "full"];
  const [form, setForm] = useState<Form>({
    ...empty,
    plan: planParam && validPlans.includes(planParam) ? planParam : "concierge",
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [cityCustom, setCityCustom] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [globalError, setGlobalError] = useState("");

  // Step 4 state
  const [registrationId, setRegistrationId] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // Translated plan + step config
  const plans = [
    { ...PLAN_META[0], name: t.register.plans.concierge.name,         tagline: t.register.plans.concierge.tagline,         features: t.register.plans.concierge.features },
    { ...PLAN_META[1], name: t.register.plans.checkin.name,           tagline: t.register.plans.checkin.tagline,           features: t.register.plans.checkin.features },
    { ...PLAN_META[2], name: t.register.plans.concierge_checkin.name, tagline: t.register.plans.concierge_checkin.tagline, features: t.register.plans.concierge_checkin.features },
    { ...PLAN_META[3], name: t.register.plans.full.name,              tagline: t.register.plans.full.tagline,              features: t.register.plans.full.features },
  ];
  const steps = [
    t.register.steps.account,
    t.register.steps.hotel,
    t.register.steps.plan,
    t.register.steps.payment,
  ];

  function set(key: keyof Form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.owner_name.trim())       e.owner_name = t.register.errors.nameRequired;
    if (!form.email.trim())            e.email = t.register.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.register.errors.emailInvalid;
    if (!form.password)                e.password = t.register.errors.passwordRequired;
    else if (form.password.length < 8) e.password = t.register.errors.passwordTooShort;
    if (!form.confirm_password)        e.confirm_password = t.register.errors.confirmPasswordRequired;
    else if (form.password !== form.confirm_password) e.confirm_password = t.register.errors.passwordMismatch;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.business_name.trim()) e.business_name = t.register.errors.businessNameRequired;
    if (!form.city.trim())          e.city = t.register.errors.cityRequired;

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.phone && phoneDigits.length < 7)
      e.phone = t.register.errors.phoneTooShort;

    const waDigits = form.whatsapp_number.replace(/\D/g, "");
    if (form.whatsapp_number && waDigits.length < 7)
      e.whatsapp_number = t.register.errors.whatsappTooShort;

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    setGlobalError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function back() {
    setGlobalError("");
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  // Step 3 → submit registration
  async function handleSubmit() {
    setLoading(true);
    setGlobalError("");
    try {
      const code = getCode(form.country);
      const fullPhone    = form.phone           ? `${code} ${form.phone}`.trim()           : "";
      const fullWhatsApp = form.whatsapp_number ? `${code} ${form.whatsapp_number}`.trim() : "";
      const result = await registrationsApi.register({
        owner_name: form.owner_name,
        business_name: form.business_name,
        email: form.email,
        password: form.password,
        phone: fullPhone,
        city: form.city,
        country: form.country,
        whatsapp_number: fullWhatsApp,
        website: form.website,
        plan: form.plan,
        payment_method: form.payment_method,
      });
      if ("checkout_url" in result) {
        window.location.href = result.checkout_url;
      } else if (form.payment_method === "bank_transfer") {
        // Show Step 4 with bank details + proof upload
        setRegistrationId(result.registration_id);
        setBankDetails(result.bank_details);
        setStep(4);
      } else {
        // Invoice — go straight to success
        const params = new URLSearchParams({
          method: result.method,
          business_name: result.business_name,
          plan: form.plan,
        });
        window.location.href = `/register/success?${params}`;
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : t.register.errors.registrationFailed);
    }
    setLoading(false);
  }

  // Step 4 → submit payment proof
  async function handleSubmitProof() {
    if (!transactionId.trim() && !proofFile) {
      setGlobalError(t.register.errors.proofRequired);
      return;
    }
    setSubmittingProof(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      if (transactionId.trim()) fd.append("transaction_id", transactionId.trim());
      if (paymentNote.trim())   fd.append("payment_note", paymentNote.trim());
      if (proofFile)            fd.append("payment_proof", proofFile);
      await registrationsApi.submitPaymentProof(registrationId, fd);
      const params = new URLSearchParams({
        method: "bank_transfer",
        business_name: form.business_name,
        plan: form.plan,
      });
      window.location.href = `/register/success?${params}`;
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : t.register.errors.submissionFailed);
    }
    setSubmittingProof(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  // Step 4 only shows for bank_transfer — hide it from the indicator for invoice/stripe
  const visibleSteps = form.payment_method === "bank_transfer" ? steps : steps.slice(0, 3);
  const progress = ((step - 1) / (visibleSteps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Mini logo bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="GuestFlow Pro"
          width={120}
          height={36}
          className="h-8 w-auto object-contain"
          priority
        />
        <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
          {t.register.alreadyRegistered}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* ── Premium step indicator ──────────────────────────────────────────── */}
      <div className="bg-white shadow-sm px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="max-w-2xl mx-auto flex items-start">
          {visibleSteps.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            const ICONS = [
              /* 1 — Account */
              <svg key="acc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>,
              /* 2 — Hotel */
              <svg key="htl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>,
              /* 3 — Plan */
              <svg key="pln" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>,
              /* 4 — Payment */
              <svg key="pay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>,
            ];
            return (
              <div key={n} className="flex items-start flex-1 last:flex-none">
                {/* Step node */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 0 }}>
                  <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    active
                      ? "w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-200 scale-105"
                      : done
                        ? "w-10 h-10 bg-emerald-500 shadow-sm shadow-emerald-100"
                        : "w-10 h-10 bg-slate-100"
                  }`}>
                    {done ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span className={active ? "text-white" : "text-slate-400"}>
                        {ICONS[i]}
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-center font-bold leading-tight transition-colors ${
                    active ? "text-[11px] text-blue-600" : done ? "text-[10px] text-emerald-600" : "text-[10px] text-slate-400"
                  }`} style={{ maxWidth: 58 }}>
                    {s.label}
                  </p>
                </div>
                {/* Connector line */}
                {i < visibleSteps.length - 1 && (
                  <div className={`flex-1 mx-2 mt-5 rounded-full transition-all duration-500 ${
                    done ? "h-0.5 bg-emerald-400" : "h-0.5 bg-slate-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* ── STEP 1: Account ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700">
                <h1 className="text-lg font-bold text-white">{t.register.step1.title}</h1>
                <p className="text-blue-200 text-sm mt-0.5">{t.register.step1.subtitle}</p>
              </div>
              <div className="p-6 space-y-4">
                <Input
                  label={t.register.step1.fullNameLabel}
                  value={form.owner_name}
                  onChange={(v) => set("owner_name", v)}
                  placeholder={t.register.step1.fullNamePlaceholder}
                  error={errors.owner_name}
                />

                <Input
                  label={t.register.step1.emailLabel}
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  placeholder={t.register.step1.emailPlaceholder}
                  error={errors.email}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step1.phoneLabel}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", sanitizePhone(e.target.value, 15))}
                    placeholder={t.register.step1.phonePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step1.passwordLabel}</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder={t.register.step1.passwordPlaceholder}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          errors.password ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-slate-200 focus:ring-blue-50 focus:border-blue-400"
                        }`}
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <FieldError msg={errors.password} />
                    {form.password && !errors.password && (
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            form.password.length >= i * 3
                              ? form.password.length >= 12 ? "bg-emerald-400" : "bg-amber-400"
                              : "bg-slate-200"
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step1.confirmPasswordLabel}</label>
                    <div className="relative">
                      <input
                        type={showCPw ? "text" : "password"}
                        value={form.confirm_password}
                        onChange={(e) => set("confirm_password", e.target.value)}
                        placeholder={t.register.step1.confirmPasswordPlaceholder}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          errors.confirm_password ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-slate-200 focus:ring-blue-50 focus:border-blue-400"
                        }`}
                      />
                      <button type="button" onClick={() => setShowCPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showCPw ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <FieldError msg={errors.confirm_password} />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={next}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {t.register.step1.continueButton}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <p className="text-center text-slate-400 text-xs mt-4">
                  {t.register.step1.haveAccount}{" "}
                  <Link href="/login" className="text-blue-600 font-semibold hover:underline">{t.register.step1.signIn}</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Business ──────────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-violet-700">
                <h1 className="text-lg font-bold text-white">{t.register.step2.title}</h1>
                <p className="text-violet-200 text-sm mt-0.5">{t.register.step2.subtitle}</p>
              </div>
              <div className="p-6 space-y-4">
                {/* Business type — locked to Hotel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step2.businessTypeLabel}</label>
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-800">{t.register.step2.businessTypeHotel}</p>
                      <p className="text-[11px] text-blue-500 mt-0.5">{t.register.step2.businessTypeNote}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full">{t.register.step2.businessTypeSelected}</span>
                  </div>
                </div>

                <Input
                  label={t.register.step2.hotelNameLabel}
                  value={form.business_name}
                  onChange={(v) => set("business_name", v)}
                  placeholder={t.register.step2.hotelNamePlaceholder}
                  error={errors.business_name}
                />

                {/* Country */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step2.countryLabel}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Italy", "United Kingdom", "Other"] as const).map((c) => {
                      const cfg = COUNTRY_CONFIG[c];
                      const active = form.country === c;
                      return (
                        <button key={c} type="button"
                          onClick={() => {
                            set("country", c);
                            set("city", "");
                            set("phone", "");
                            set("whatsapp_number", "");
                            setCityCustom(false);
                            setCitySearch("");
                            setCityDropdownOpen(false);
                          }}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                            active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                          }`}>
                          <span className="text-xl">{cfg.flag}</span>
                          <span className={`text-xs font-bold leading-tight ${active ? "text-blue-700" : "text-slate-600"}`}>{c}</span>
                          {cfg.code && <span className={`text-[10px] font-semibold ${active ? "text-blue-500" : "text-slate-400"}`}>{cfg.code}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step2.cityLabel}</label>
                  {getCities(form.country).length > 0 && !cityCustom ? (
                    <div ref={cityDropdownRef} className="relative">
                      <div className="relative">
                        <input
                          value={citySearch}
                          onChange={(e) => {
                            setCitySearch(e.target.value);
                            set("city", "");
                            setCityDropdownOpen(true);
                          }}
                          onFocus={() => setCityDropdownOpen(true)}
                          placeholder={form.city || t.register.step2.citySelectPlaceholder}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all ${
                            errors.city ? "border-red-300" : "border-slate-200"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                          {cityDropdownOpen ? "▲" : "▼"}
                        </span>
                      </div>
                      {cityDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          <div className="max-h-52 overflow-y-auto">
                            {(() => {
                              const q = citySearch.trim().toLowerCase();
                              const all = getCities(form.country);
                              const filtered = q
                                ? all.filter(c => c.toLowerCase().includes(q))
                                : all;
                              if (filtered.length === 0) {
                                return (
                                  <div className="px-4 py-3 text-sm text-slate-400 text-center">No cities found</div>
                                );
                              }
                              return filtered.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    set("city", c);
                                    setCitySearch(c);
                                    setCityDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                                    form.city === c ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-800"
                                  }`}
                                >
                                  {c}
                                </button>
                              ));
                            })()}
                          </div>
                          <div className="border-t border-slate-100">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCityCustom(true);
                                setCitySearch("");
                                set("city", "");
                                setCityDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 italic transition-colors"
                            >
                              + Other (type manually)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : cityCustom ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="Type your city name..."
                        className={`flex-1 bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all ${
                          errors.city ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {getCities(form.country).length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setCityCustom(false); set("city", ""); setCitySearch(""); }}
                          className="px-3 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
                        >
                          ← List
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder={t.register.step2.cityInputPlaceholder}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all ${
                        errors.city ? "border-red-300" : "border-slate-200"
                      }`}
                    />
                  )}
                  <FieldError msg={errors.city} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone with country code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step2.phoneNumberLabel}</label>
                    <div className="relative flex items-center">
                      {getCode(form.country) && (
                        <span className="absolute left-3 text-sm font-bold text-slate-600 select-none pointer-events-none z-10 bg-slate-50 pr-1">
                          {getCode(form.country)}
                        </span>
                      )}
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(e) => {
                          const val = sanitizePhone(e.target.value, getMaxDigits(form.country));
                          set("phone", val);
                          if (sameAsPhone) set("whatsapp_number", val);
                        }}
                        placeholder="000 000 0000"
                        maxLength={getMaxDigits(form.country) + 4}
                        className={`w-full bg-slate-50 border rounded-xl py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                            : "border-slate-200 focus:ring-blue-50 focus:border-blue-400"
                        } ${getCode(form.country) ? "pl-14 pr-4" : "px-4"}`}
                      />
                    </div>
                    {form.phone && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.register.step2.fullNumberPrefix} {getCode(form.country)} {form.phone}
                      </p>
                    )}
                    <FieldError msg={errors.phone} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {t.register.step2.whatsappLabel}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsPhone(checked);
                          if (checked) set("whatsapp_number", form.phone);
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                      />
                      <span className="text-xs font-medium text-slate-500">Same as phone number</span>
                    </label>

                    <div className="relative flex items-center">
                      {getCode(form.country) && (
                        <span className="absolute left-3 text-sm font-bold text-slate-600 select-none pointer-events-none z-10 bg-slate-50 pr-1">
                          {getCode(form.country)}
                        </span>
                      )}
                      <input
                        type="tel"
                        inputMode="numeric"
                        readOnly={sameAsPhone}
                        value={form.whatsapp_number}
                        onChange={(e) => set("whatsapp_number", sanitizePhone(e.target.value, getMaxDigits(form.country)))}
                        placeholder="000 000 0000"
                        maxLength={getMaxDigits(form.country) + 4}
                        className={`w-full border rounded-xl py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          sameAsPhone ? "bg-slate-100 cursor-not-allowed" : "bg-slate-50"
                        } ${
                          errors.whatsapp_number
                            ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                            : "border-slate-200 focus:ring-blue-50 focus:border-blue-400"
                        } ${getCode(form.country) ? "pl-14 pr-4" : "px-4"}`}
                      />
                    </div>
                    {form.whatsapp_number && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.register.step2.fullNumberPrefix} {getCode(form.country)} {form.whatsapp_number}
                      </p>
                    )}
                    <FieldError msg={errors.whatsapp_number} />
                    <p className="text-[10px] text-slate-400 mt-1">{t.register.step2.whatsappHelper}</p>
                  </div>

                  <Input
                    label={t.register.step2.websiteLabel}
                    type="url"
                    value={form.website}
                    onChange={(v) => set("website", v)}
                    placeholder={t.register.step2.websitePlaceholder}
                  />
                </div>

                {/* Summary box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{t.register.step2.accountSummary}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {form.owner_name.slice(0, 1).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{form.owner_name || "—"}</p>
                      <p className="text-xs text-slate-400 truncate">{form.email || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 sm:flex-none sm:w-28 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-slate-50 transition-colors"
                >
                  {t.register.step2.backButton}
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {t.register.step2.continueButton}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Plan + Payment ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.register.step3.title}</h2>
                <p className="text-slate-500 text-sm mt-1">{t.register.step3.subtitle}</p>
              </div>

              {globalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl text-center">
                  {globalError}
                </div>
              )}

              {/* Plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const selected = form.plan === plan.id;
                  const accentMap: Record<string, { border: string; shadow: string; radio: string; badge: string; price: string }> = {
                    blue:   { border: "border-blue-500",   shadow: "shadow-blue-100",   radio: "border-blue-500 bg-blue-500",   badge: "bg-blue-600",   price: "text-blue-700"   },
                    violet: { border: "border-violet-500", shadow: "shadow-violet-100", radio: "border-violet-500 bg-violet-500", badge: "bg-violet-600", price: "text-violet-700" },
                    cyan:   { border: "border-cyan-500",   shadow: "shadow-cyan-100",   radio: "border-cyan-500 bg-cyan-500",   badge: "bg-cyan-600",   price: "text-cyan-700"   },
                    amber:  { border: "border-amber-500",  shadow: "shadow-amber-100",  radio: "border-amber-500 bg-amber-500", badge: "bg-amber-600",  price: "text-amber-700"  },
                  };
                  const ac = accentMap[plan.accent] ?? accentMap.blue;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => set("plan", plan.id)}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all bg-white shadow-sm ${
                        selected ? `${ac.border} shadow-lg ${ac.shadow}` : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {plan.popular && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${ac.badge} text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm`}>
                          {t.register.step3.mostPopular}
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{plan.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5 leading-snug">{plan.tagline}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          selected ? ac.radio : "border-slate-300"
                        }`}>
                          {selected && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className={`text-2xl font-black ${selected ? ac.price : "text-slate-900"}`}>{plan.price}</span>
                        <span className="text-slate-400 text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {/* ── Payment method ──────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-bold text-slate-700">{t.register.step3.paymentMethodTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.register.step3.paymentMethodSubtitle}</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Bank Transfer — active */}
                  {(() => {
                    const selected = form.payment_method === "bank_transfer";
                    return (
                      <button
                        type="button"
                        onClick={() => set("payment_method", "bank_transfer")}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                          selected ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${selected ? "text-blue-700" : "text-slate-900"}`}>{t.register.step3.bankTransferName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.register.step3.bankTransferDesc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                        }`}>
                          {selected && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })()}

                  {/* Invoice / Pay Later — active */}
                  {(() => {
                    const selected = form.payment_method === "invoice";
                    return (
                      <button
                        type="button"
                        onClick={() => set("payment_method", "invoice")}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                          selected ? "bg-violet-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${selected ? "text-violet-700" : "text-slate-900"}`}>{t.register.step3.invoiceName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.register.step3.invoiceDesc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? "border-violet-500 bg-violet-500" : "border-slate-300"
                        }`}>
                          {selected && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })()}

                  {/* Credit / Debit Card — Stripe */}
                  {(() => {
                    const selected = form.payment_method === "stripe";
                    return (
                      <button type="button" onClick={() => set("payment_method", "stripe")}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${selected ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-100" : "bg-slate-100"}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke={selected ? "#2563EB" : "#94A3B8"} strokeWidth={1.8} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${selected ? "text-blue-700" : "text-slate-900"}`}>{t.register.step3.cardName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.register.step3.cardDesc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Summary strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {form.owner_name.slice(0,1).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{form.business_name || "—"} · {form.city || "—"}</p>
                    <p className="text-[11px] text-slate-400">{form.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">
                    {plans.find((p) => p.id === form.plan)?.price}{t.register.step3.perMonth}
                  </p>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {plans.find((p) => p.id === form.plan)?.name} {t.register.step3.planLabelSuffix} · {
                      form.payment_method === "stripe" ? t.register.step3.cardName
                      : form.payment_method === "invoice" ? t.register.step3.invoiceName
                      : t.register.step3.bankTransferName
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={back}
                  className="flex-none w-28 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-slate-50 transition-colors"
                >
                  {t.register.step3.backButton}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {t.register.step3.submitting}
                    </>
                  ) : (
                    <>
                      {t.register.step3.submitButton}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          {/* ── STEP 4: Bank Payment Proof ───────────────────────────────── */}
          {step === 4 && bankDetails && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t.register.step4.title}</h2>
                <p className="text-slate-500 text-sm mt-1">{t.register.step4.subtitle}</p>
              </div>

              {globalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl text-center">
                  {globalError}
                </div>
              )}

              {/* Bank account details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
                  <p className="text-sm font-bold text-white">{t.register.step4.bankDetailsTitle}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const text = Object.entries(bankDetails)
                        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                        .join("\n");
                      navigator.clipboard.writeText(text);
                    }}
                    className="text-[11px] font-semibold text-blue-200 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    {t.register.step4.copyAll}
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: t.register.step4.accountName, value: bankDetails.account_name },
                    { label: t.register.step4.bank,         value: bankDetails.bank_name },
                    { label: t.register.step4.sortCode,     value: bankDetails.sort_code },
                    { label: t.register.step4.accountNumber, value: bankDetails.account_number },
                    { label: t.register.step4.iban,         value: bankDetails.iban },
                    { label: t.register.step4.swift,        value: bankDetails.swift },
                    { label: t.register.step4.reference,    value: bankDetails.reference, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`flex items-center justify-between px-5 py-3 ${highlight ? "bg-amber-50" : ""}`}>
                      <span className="text-xs font-semibold text-slate-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(value)}
                          className="text-slate-300 hover:text-blue-500 transition-colors"
                          title={t.register.step4.copy}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                  <p className="text-[11px] text-amber-700">
                    <span className="font-bold">{t.register.step4.importantNote}</span>{" "}
                    {t.register.step4.importantNoteBody.split("{ref}")[0]}
                    <span className="font-bold">{bankDetails.reference}</span>
                    {t.register.step4.importantNoteBody.split("{ref}")[1]}
                  </p>
                </div>
              </div>

              {/* Proof upload form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-bold text-slate-700">{t.register.step4.confirmPaymentTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.register.step4.confirmPaymentSubtitle}</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Transaction ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step4.transactionIdLabel}</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={t.register.step4.transactionIdPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Screenshot upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step4.screenshotLabel}</label>
                    {proofPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proofPreview} alt="Payment proof" className="w-full max-h-64 object-cover" />
                        <button
                          type="button"
                          onClick={() => { setProofFile(null); setProofPreview(null); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-slate-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                          <p className="text-white text-xs font-semibold truncate">{proofFile?.name}</p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">{t.register.step4.uploadPrompt}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{t.register.step4.uploadHint}</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Optional note */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.register.step4.noteLabel} <span className="text-slate-400 font-normal">{t.register.step4.noteOptional}</span></label>
                    <textarea
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      rows={2}
                      placeholder={t.register.step4.notePlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Note: proof required */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-amber-700">
                  Please transfer the payment using the bank details above, then upload your transaction screenshot or enter your transaction ID. Your account will be activated once payment is confirmed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmitProof}
                  disabled={submittingProof}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {submittingProof ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t.register.step4.submitting}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t.register.step4.confirmButton}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}

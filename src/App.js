import { useState, useEffect } from "react";
import { db, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDocs } from "./firebase";

// ════════════════════════════════════════════════════════════════════
// LOCATZY — Plateforme mondiale de location (appartements & voitures)
// Commission admin : 15% sur chaque réservation
// ════════════════════════════════════════════════════════════════════

const COMMISSION_RATE = 0.15;

// 📧 CONFIGURATION EMAILJS - Remplacez par vos vraies clés
const EMAILJS_CONFIG = {
  serviceId: "service_41scm6k",
  templateId: "template_i6l3qbr",
  publicKey: "r52Uh9tQbOL86SlxA",
};

// 🌍 Liste mondiale de pays + villes (extrait — utilisateurs peuvent ajouter)
// 📱 Préfixes téléphoniques par pays (code + longueur attendue)
const PHONE_CODES = [
  { flag: "🇲🇦", country: "Maroc", code: "+212", length: 9 },
  { flag: "🇫🇷", country: "France", code: "+33", length: 9 },
  { flag: "🇺🇸", country: "USA / Canada", code: "+1", length: 10 },
  { flag: "🇨🇦", country: "Canada", code: "+1", length: 10 },
  { flag: "🇬🇧", country: "Royaume-Uni", code: "+44", length: 10 },
  { flag: "🇩🇪", country: "Allemagne", code: "+49", length: 11 },
  { flag: "🇪🇸", country: "Espagne", code: "+34", length: 9 },
  { flag: "🇮🇹", country: "Italie", code: "+39", length: 10 },
  { flag: "🇵🇹", country: "Portugal", code: "+351", length: 9 },
  { flag: "🇨🇭", country: "Suisse", code: "+41", length: 9 },
  { flag: "🇧🇪", country: "Belgique", code: "+32", length: 9 },
  { flag: "🇳🇱", country: "Pays-Bas", code: "+31", length: 9 },
  { flag: "🇬🇷", country: "Grèce", code: "+30", length: 10 },
  { flag: "🇹🇷", country: "Turquie", code: "+90", length: 10 },
  { flag: "🇯🇵", country: "Japon", code: "+81", length: 10 },
  { flag: "🇨🇳", country: "Chine", code: "+86", length: 11 },
  { flag: "🇰🇷", country: "Corée du Sud", code: "+82", length: 10 },
  { flag: "🇮🇳", country: "Inde", code: "+91", length: 10 },
  { flag: "🇹🇭", country: "Thaïlande", code: "+66", length: 9 },
  { flag: "🇻🇳", country: "Vietnam", code: "+84", length: 9 },
  { flag: "🇮🇩", country: "Indonésie", code: "+62", length: 10 },
  { flag: "🇲🇾", country: "Malaisie", code: "+60", length: 9 },
  { flag: "🇸🇬", country: "Singapour", code: "+65", length: 8 },
  { flag: "🇵🇭", country: "Philippines", code: "+63", length: 10 },
  { flag: "🇦🇺", country: "Australie", code: "+61", length: 9 },
  { flag: "🇧🇷", country: "Brésil", code: "+55", length: 11 },
  { flag: "🇲🇽", country: "Mexique", code: "+52", length: 10 },
  { flag: "🇦🇷", country: "Argentine", code: "+54", length: 10 },
  { flag: "🇪🇬", country: "Égypte", code: "+20", length: 10 },
  { flag: "🇹🇳", country: "Tunisie", code: "+216", length: 8 },
  { flag: "🇩🇿", country: "Algérie", code: "+213", length: 9 },
  { flag: "🇸🇳", country: "Sénégal", code: "+221", length: 9 },
  { flag: "🇨🇮", country: "Côte d'Ivoire", code: "+225", length: 10 },
  { flag: "🇨🇲", country: "Cameroun", code: "+237", length: 9 },
  { flag: "🇨🇩", country: "RD Congo", code: "+243", length: 9 },
  { flag: "🇿🇦", country: "Afrique du Sud", code: "+27", length: 9 },
  { flag: "🇰🇪", country: "Kenya", code: "+254", length: 9 },
  { flag: "🇳🇬", country: "Nigeria", code: "+234", length: 10 },
  { flag: "🇬🇭", country: "Ghana", code: "+233", length: 9 },
  { flag: "🇦🇪", country: "Émirats Arabes Unis", code: "+971", length: 9 },
  { flag: "🇸🇦", country: "Arabie Saoudite", code: "+966", length: 9 },
  { flag: "🇶🇦", country: "Qatar", code: "+974", length: 8 },
  { flag: "🇮🇱", country: "Israël", code: "+972", length: 9 },
  { flag: "🇱🇧", country: "Liban", code: "+961", length: 8 },
  { flag: "🇯🇴", country: "Jordanie", code: "+962", length: 9 },
  { flag: "🇭🇹", country: "Haïti", code: "+509", length: 8 },
];

const COUNTRIES = {
  "🇫🇷 France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Cannes", "Saint-Tropez", "Biarritz", "Avignon", "Aix-en-Provence", "Annecy", "Grenoble", "Tours"],
  "🇺🇸 USA": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Francisco", "Las Vegas", "Miami", "Seattle", "Boston", "Washington DC", "Dallas", "Atlanta", "Orlando", "Denver", "Portland", "San Diego", "Austin", "Nashville", "Honolulu"],
  "🇨🇦 Canada": ["Toronto", "Montréal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Québec", "Winnipeg", "Halifax", "Victoria"],
  "🇬🇧 Royaume-Uni": ["Londres", "Manchester", "Birmingham", "Liverpool", "Edinburgh", "Glasgow", "Bristol", "Oxford", "Cambridge", "Brighton"],
  "🇩🇪 Allemagne": ["Berlin", "Munich", "Hambourg", "Cologne", "Francfort", "Stuttgart", "Düsseldorf", "Dresde", "Leipzig"],
  "🇪🇸 Espagne": ["Madrid", "Barcelone", "Valence", "Séville", "Malaga", "Bilbao", "Palma de Majorque", "Grenade", "Ibiza", "Marbella"],
  "🇮🇹 Italie": ["Rome", "Milan", "Naples", "Turin", "Florence", "Venise", "Bologne", "Vérone", "Palerme", "Pise"],
  "🇵🇹 Portugal": ["Lisbonne", "Porto", "Faro", "Funchal", "Coimbra", "Braga", "Albufeira", "Cascais"],
  "🇨🇭 Suisse": ["Zurich", "Genève", "Bâle", "Lausanne", "Berne", "Lugano", "Davos", "Saint-Moritz", "Interlaken", "Montreux"],
  "🇧🇪 Belgique": ["Bruxelles", "Anvers", "Liège", "Gand", "Bruges", "Namur", "Mons", "Louvain"],
  "🇳🇱 Pays-Bas": ["Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Eindhoven", "Haarlem", "Maastricht"],
  "🇬🇷 Grèce": ["Athènes", "Thessalonique", "Santorin", "Mykonos", "Rhodes", "Crète", "Corfou"],
  "🇹🇷 Turquie": ["Istanbul", "Ankara", "Izmir", "Antalya", "Bodrum", "Fethiye", "Cappadoce", "Marmaris"],
  "🇯🇵 Japon": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Sapporo", "Hiroshima", "Nara", "Okinawa"],
  "🇨🇳 Chine": ["Pékin", "Shanghai", "Guangzhou", "Shenzhen", "Hong Kong", "Macao", "Chengdu", "Xi'an"],
  "🇰🇷 Corée du Sud": ["Séoul", "Busan", "Incheon", "Daegu", "Jeju"],
  "🇮🇳 Inde": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Goa", "Jaipur", "Agra", "Kerala"],
  "🇹🇭 Thaïlande": ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Koh Samui", "Krabi"],
  "🇻🇳 Vietnam": ["Hanoï", "Hô Chi Minh-Ville", "Da Nang", "Hué", "Hoi An", "Halong"],
  "🇮🇩 Indonésie": ["Jakarta", "Bali", "Yogyakarta", "Lombok", "Surabaya"],
  "🇲🇾 Malaisie": ["Kuala Lumpur", "Penang", "Langkawi", "Malacca"],
  "🇸🇬 Singapour": ["Singapour", "Sentosa"],
  "🇵🇭 Philippines": ["Manille", "Cebu", "Boracay", "Palawan", "Bohol"],
  "🇦🇺 Australie": ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast", "Adelaide", "Cairns"],
  "🇧🇷 Brésil": ["São Paulo", "Rio de Janeiro", "Salvador", "Brasília", "Fortaleza", "Recife"],
  "🇲🇽 Mexique": ["Mexico", "Cancún", "Playa del Carmen", "Tulum", "Guadalajara", "Puerto Vallarta"],
  "🇦🇷 Argentine": ["Buenos Aires", "Mendoza", "Bariloche", "Córdoba", "Ushuaia"],
  "🇪🇬 Égypte": ["Le Caire", "Alexandrie", "Charm el-Cheikh", "Hurghada", "Louxor", "Marsa Alam"],
  "🇲🇦 Maroc": ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Essaouira", "Chefchaouen", "Meknès", "Ouarzazate", "Tétouan", "Al Hoceima", "Nador"],
  "🇹🇳 Tunisie": ["Tunis", "Sousse", "Hammamet", "Djerba", "Monastir", "Sfax"],
  "🇩🇿 Algérie": ["Alger", "Oran", "Constantine", "Annaba", "Tlemcen", "Béjaïa"],
  "🇸🇳 Sénégal": ["Dakar", "Saint-Louis", "Thiès", "Mbour", "Saly", "Cap Skirring"],
  "🇨🇮 Côte d'Ivoire": ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro", "Grand-Bassam"],
  "🇨🇲 Cameroun": ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Kribi", "Limbé"],
  "🇨🇩 RD Congo": ["Kinshasa", "Lubumbashi", "Goma", "Bukavu", "Matadi"],
  "🇿🇦 Afrique du Sud": ["Le Cap", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth"],
  "🇰🇪 Kenya": ["Nairobi", "Mombasa", "Kisumu", "Diani", "Malindi"],
  "🇳🇬 Nigeria": ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"],
  "🇬🇭 Ghana": ["Accra", "Kumasi", "Cape Coast", "Tamale"],
  "🇦🇪 Émirats Arabes Unis": ["Dubaï", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Palm Jumeirah", "Marina"],
  "🇸🇦 Arabie Saoudite": ["Riyad", "Djeddah", "La Mecque", "Médine", "Dammam"],
  "🇶🇦 Qatar": ["Doha", "Lusail", "The Pearl"],
  "🇮🇱 Israël": ["Jérusalem", "Tel Aviv", "Haïfa", "Eilat", "Nazareth"],
  "🇱🇧 Liban": ["Beyrouth", "Tripoli", "Byblos", "Sidon"],
  "🇯🇴 Jordanie": ["Amman", "Aqaba", "Petra", "Wadi Rum", "Mer Morte"],
  "🇭🇹 Haïti": ["Port-au-Prince", "Cap-Haïtien", "Les Cayes", "Jacmel", "Pétion-Ville", "Labadie"],
};

// ─── DB (localStorage) ────────────────────────────────────────────────
const DB = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  init: () => {
    // Tout (comptes, réservations, avis, messages, favoris, notifications) est géré par Firebase.
    if (!localStorage.getItem("lcy_listings")) {
      DB.set("lcy_listings", []);
    }
    if (!localStorage.getItem("lcy_custom_cities")) localStorage.setItem("lcy_custom_cities", JSON.stringify({}));
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────
function getCitiesForCountry(country) {
  const predefined = COUNTRIES[country] || [];
  let custom = {};
  try { custom = JSON.parse(localStorage.getItem("lcy_custom_cities")) || {}; } catch {}
  const userAdded = custom[country] || [];
  return [...new Set([...predefined, ...userAdded])].sort();
}
function addCustomCity(country, city) {
  if (!country || !city || !city.trim()) return;
  let custom = {};
  try { custom = JSON.parse(localStorage.getItem("lcy_custom_cities")) || {}; } catch {}
  if (!custom[country]) custom[country] = [];
  const t = city.trim();
  const exists = custom[country].some(c => c.toLowerCase() === t.toLowerCase()) || (COUNTRIES[country] || []).some(c => c.toLowerCase() === t.toLowerCase());
  if (!exists) {
    custom[country].push(t);
    localStorage.setItem("lcy_custom_cities", JSON.stringify(custom));
  }
}
function datesOverlap(s1, e1, s2, e2) { return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1); }
function getBookedDates(listingId) {
  const bookings = JSON.parse(localStorage.getItem("lcy_bookings") || "[]");
  return bookings.filter(b => b.listingId === listingId && b.status === "confirmed").map(b => ({ from: b.from, to: b.to }));
}
function findConflict(listingId, from, to) {
  return getBookedDates(listingId).find(b => datesOverlap(from, to, b.from, b.to));
}
// ⭐ Note moyenne d'une annonce
function getListingRating(listingId) {
  const reviews = DB.get("lcy_reviews").filter(r => r.listingId === listingId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}
// 💬 ID unique pour conversation entre 2 personnes sur 1 annonce
// 🏆 Badges helpers
const ALL_BADGES = {
  newbie:       { icon: "🌟", label: "Nouveau membre", desc: "Bienvenue sur Locatzy !", color: "#3b82f6" },
  firstTrip:    { icon: "🎒", label: "Premier voyage", desc: "1ère réservation effectuée", color: "#f59e0b" },
  traveler:     { icon: "✈️", label: "Voyageur", desc: "5+ réservations", color: "#8b5cf6" },
  globetrotter: { icon: "🌍", label: "Globetrotteur", desc: "10+ réservations", color: "#06b6d4" },
  reviewer:     { icon: "✍️", label: "Critique", desc: "3+ avis publiés", color: "#ec4899" },
  newHost:      { icon: "🏡", label: "Nouveau propriétaire", desc: "1ère annonce publiée", color: "#10b981" },
  host:         { icon: "💼", label: "Hôte", desc: "3+ annonces actives", color: "#0891b2" },
  superhost:    { icon: "🏆", label: "Super Hôte", desc: "5+ avis avec note ≥ 4.5", color: "#eab308" },
  topEarner:    { icon: "💰", label: "Top Earner", desc: "1000€+ de gains", color: "#22c55e" },
};

function getUserBadges(userId) {
  const earned = [];
  const bookings = DB.get("lcy_bookings");
  const listings = DB.get("lcy_listings");
  const reviews = DB.get("lcy_reviews");

  // Nouveau membre (toujours)
  earned.push("newbie");

  // Réservations en tant que locataire
  const myBookings = bookings.filter(b => b.renterId === userId);
  if (myBookings.length >= 1) earned.push("firstTrip");
  if (myBookings.length >= 5) earned.push("traveler");
  if (myBookings.length >= 10) earned.push("globetrotter");

  // Avis laissés
  const myReviews = reviews.filter(r => r.userId === userId);
  if (myReviews.length >= 3) earned.push("reviewer");

  // Annonces publiées
  const myListings = listings.filter(l => l.ownerId === userId && l.status === "approved");
  if (myListings.length >= 1) earned.push("newHost");
  if (myListings.length >= 3) earned.push("host");

  // Super hôte : 5+ avis sur ses annonces avec moyenne ≥ 4.5
  const myListingIds = myListings.map(l => l.id);
  const reviewsOnMyListings = reviews.filter(r => myListingIds.includes(r.listingId));
  if (reviewsOnMyListings.length >= 5) {
    const avgRating = reviewsOnMyListings.reduce((s, r) => s + r.rating, 0) / reviewsOnMyListings.length;
    if (avgRating >= 4.5) earned.push("superhost");
  }

  // Top earner : 1000€+ de gains
  const bookingsOnMyListings = bookings.filter(b => b.ownerId === userId);
  const totalEarnings = bookingsOnMyListings.reduce((s, b) => s + b.ownerEarnings, 0);
  if (totalEarnings >= 1000) earned.push("topEarner");

  return earned;
}

function getConversationId(listingId, userA, userB) {
  return `${listingId}_${Math.min(userA, userB)}_${Math.max(userA, userB)}`;
}

// 🎁 Calcul du prix avec offre (si applicable)
function getPriceWithOffer(listing, days) {
  if (listing.offerMinDays && listing.offerPrice && days >= listing.offerMinDays) {
    return {
      pricePerDay: listing.offerPrice,
      total: days * listing.offerPrice,
      offerApplied: true,
      originalTotal: days * listing.price,
      saved: days * (listing.price - listing.offerPrice),
    };
  }
  return {
    pricePerDay: listing.price,
    total: days * listing.price,
    offerApplied: false,
  };
}

// ❤️ Favoris helpers
function isFavorite(userId, listingId) {
  if (!userId) return false;
  const favs = DB.get("lcy_favorites");
  return favs.some(f => f.userId === userId && f.listingId === listingId);
}
function toggleFavorite(userId, listingId) {
  if (!userId) return false;
  const favs = DB.get("lcy_favorites");
  const exists = favs.find(f => f.userId === userId && f.listingId === listingId);
  if (exists) {
    DB.set("lcy_favorites", favs.filter(f => !(f.userId === userId && f.listingId === listingId)));
    return false;
  } else {
    DB.set("lcy_favorites", [...favs, { id: Date.now(), userId, listingId, date: new Date().toISOString() }]);
    return true;
  }
}

// 🏘 Labels carburant / transmission
const FUEL_LABELS = {
  "essence": "⛽ Essence",
  "diesel": "🛢 Diesel",
  "hybrid-essence": "🔋 Hybride Essence",
  "hybrid-diesel": "🔋 Hybride Diesel",
  "electric": "⚡ Électrique",
  "gpl": "🔥 GPL",
};
const TRANS_LABELS = {
  "manual": "🕹 Manuelle",
  "automatic": "🤖 Automatique",
};

// 🏘 Types de biens (5 catégories)
const PROPERTY_TYPES = {
  "apartment": { icon: "🏠", label: "Appartement", labelShort: "Apparts", labelFull: "Logement entier", bgGradient: "linear-gradient(135deg,#fef3c7,#fde68a)", category: "lodging" },
  "house": { icon: "🏡", label: "Villa / Maison", labelShort: "Villas", labelFull: "Villa / Maison entière", bgGradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)", category: "lodging" },
  "hotel": { icon: "🏨", label: "Hôtel", labelShort: "Hôtels", labelFull: "Chambre / Suite d'hôtel", bgGradient: "linear-gradient(135deg,#fce7f3,#fbcfe8)", category: "lodging" },
  "car": { icon: "🚗", label: "Voiture", labelShort: "Voitures", labelFull: "Véhicule complet", bgGradient: "linear-gradient(135deg,#dbeafe,#bfdbfe)", category: "vehicle" },
  "moto": { icon: "🏍", label: "Moto", labelShort: "Motos", labelFull: "Moto / Scooter", bgGradient: "linear-gradient(135deg,#fed7aa,#fdba74)", category: "vehicle" },
};

// Helper : sait si c'est un type "logement" (avec chambres/personnes)
const isLodging = (type) => PROPERTY_TYPES[type]?.category === "lodging";
const isVehicle = (type) => PROPERTY_TYPES[type]?.category === "vehicle";

// ════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("lcy_dark") === "true");
  
  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("lcy_dark", newVal.toString());
  };
  const [filter, setFilter] = useState("all");
  const [country, setCountry] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    DB.init();
    reload();
    const s = localStorage.getItem("lcy_session");
    if (s) setUser(JSON.parse(s));
    // Charger EmailJS
    if (!window.emailjs && EMAILJS_CONFIG.publicKey !== "VOTRE_PUBLIC_KEY") {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      script.onload = () => { window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey }); };
      document.head.appendChild(script);
    }
    // 🔥 FIREBASE : écouter les annonces en temps réel (partagées par tous)
    const unsub = onSnapshot(collection(db, "listings"), (snapshot) => {
      const fbListings = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setListings(fbListings);
      DB.set("lcy_listings", fbListings); // garder une copie locale
    }, (err) => {
      console.log("Firebase listings error:", err);
    });
    // 🔥 FIREBASE : écouter les comptes en temps réel (partagés entre appareils)
    const unsubUsers = onSnapshot(collection(db, "users"), async (snapshot) => {
      const fbUsers = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id, id: d.id }));
      // Si aucun compte admin n'existe encore, le créer automatiquement
      if (!fbUsers.some(u => u.role === "admin")) {
        try {
          await addDoc(collection(db, "users"), {
            name: "Oualid", email: "blackberrywalid72@gmail.com", password: "Zaki_walid_123",
            role: "admin", country: "🌍 Global", joined: "2026-05-19",
          });
          return; // l'écoute se redéclenchera avec l'admin ajouté
        } catch (e) { console.log("Erreur création admin:", e); }
      }
      setUsers(fbUsers);
      DB.set("lcy_users", fbUsers); // garder une copie locale
    }, (err) => {
      console.log("Firebase users error:", err);
    });
    // 🔥 FIREBASE : écouter les réservations en temps réel (partagées entre appareils)
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snapshot) => {
      const fbBookings = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setBookings(fbBookings);
      DB.set("lcy_bookings", fbBookings); // garder une copie locale (pour les helpers de dates)
    }, (err) => {
      console.log("Firebase bookings error:", err);
    });
    // 🔥 FIREBASE : écouter les avis en temps réel
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const fbReviews = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setReviews(fbReviews);
      DB.set("lcy_reviews", fbReviews); // copie locale (pour les helpers de note)
    }, (err) => {
      console.log("Firebase reviews error:", err);
    });
    // 🔥 FIREBASE : écouter les messages en temps réel
    const unsubMessages = onSnapshot(collection(db, "messages"), (snapshot) => {
      const fbMessages = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setMessages(fbMessages);
      DB.set("lcy_messages", fbMessages); // copie locale
    }, (err) => {
      console.log("Firebase messages error:", err);
    });
    // 🔥 FIREBASE : écouter les favoris en temps réel
    const unsubFavorites = onSnapshot(collection(db, "favorites"), (snapshot) => {
      const fbFavorites = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setFavorites(fbFavorites);
      DB.set("lcy_favorites", fbFavorites); // copie locale (pour les helpers de favoris)
    }, (err) => {
      console.log("Firebase favorites error:", err);
    });
    // 🔥 FIREBASE : écouter les notifications en temps réel
    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const fbNotifications = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setNotifications(fbNotifications);
      DB.set("lcy_notifications", fbNotifications); // copie locale
    }, (err) => {
      console.log("Firebase notifications error:", err);
    });
    // 🔥 FIREBASE : écouter les demandes de versement
    const unsubPayouts = onSnapshot(collection(db, "payouts"), (snapshot) => {
      const fbPayouts = snapshot.docs.map(d => ({ ...d.data(), fbId: d.id }));
      setPayouts(fbPayouts);
    }, (err) => {
      console.log("Firebase payouts error:", err);
    });
    return () => { unsub(); unsubUsers(); unsubBookings(); unsubReviews(); unsubMessages(); unsubFavorites(); unsubNotifications(); unsubPayouts(); };
  }, []);

  // 💳 Détecter le retour de paiement Stripe et créer la réservation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paiement = params.get("paiement");
    if (!paiement) return;
    // Nettoyer l'adresse (enlever ?paiement=... de l'URL)
    const cleanUrl = window.location.origin + window.location.pathname;

    if (paiement === "annule") {
      localStorage.removeItem("lcy_pending_payment");
      flash("Paiement annulé", "#ef4444");
      window.history.replaceState({}, "", cleanUrl);
      return;
    }

    if (paiement === "reussi") {
      const raw = localStorage.getItem("lcy_pending_payment");
      if (!raw) { window.history.replaceState({}, "", cleanUrl); return; }
      // Attendre que les annonces et l'utilisateur soient chargés
      if (listings.length === 0 || !user) return;
      try {
        const pending = JSON.parse(raw);
        // Supprimer TOUT DE SUITE pour éviter une double réservation si l'effet se redéclenche
        localStorage.removeItem("lcy_pending_payment");
        const listing = listings.find(l => l.id === pending.listingId);
        if (listing) {
          // Créer la réservation maintenant que le paiement est confirmé
          book(listing, pending.from, pending.to, { ...pending.info, paymentMethod: "card", paid: true });
        }
      } catch (e) { console.log("Erreur création résa après paiement:", e); }
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [listings, user]);


  const reload = () => {
    setListings(DB.get("lcy_listings"));
  };

  const flash = (msg, color = "#10b981") => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };
  // Trouver l'id du compte admin (pour lui envoyer les notifs de modération/commission)
  const getAdminId = () => {
    const admin = users.find(u => u.role === "admin");
    return admin ? admin.id : null;
  };
  const addNotif = async (uid, msg, type) => {
    if (!uid) return; // pas de destinataire valide
    try {
      await addDoc(collection(db, "notifications"), { id: Date.now() + Math.random(), userId: uid, message: msg, type, read: false, date: new Date().toISOString() });
    } catch (e) { console.log("Erreur notification Firebase:", e); }
  };
  const sendEmail = (to, sub, body, params = {}) => {
    console.log(`📧 → ${to}\n${sub}\n${body}`);
    // EmailJS - envoi réel (si configuré)
    if (window.emailjs && EMAILJS_CONFIG.serviceId && to) {
      try {
        window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
          email: to,
          name: params.to_name || to,
          subject: sub,
          message: body,
          to_email: to,
          to_name: params.to_name || to,
          reset_code: params.reset_code || "",
          ...params,
        }, EMAILJS_CONFIG.publicKey).then(
          () => console.log("✅ Email envoyé à " + to),
          (err) => console.log("❌ Erreur email:", err)
        );
      } catch (e) { console.log("❌ EmailJS erreur:", e); }
    }
  };

  const login = (identifier, password) => {
    const id = identifier.trim();
    const found = users.find(u => {
      if (u.password !== password) return false;
      return u.email && u.email.toLowerCase() === id.toLowerCase();
    });
    if (!found) return flash("Identifiants incorrects", "#ef4444");
    setUser(found);
    localStorage.setItem("lcy_session", JSON.stringify(found));
    flash(`Bienvenue, ${found.name} !`);
    setPage(found.role === "admin" ? "admin" : "home");
    setModal(null);
  };
  const register = (data) => {
    // Vérifier doublon par email (dans les comptes Firebase déjà chargés)
    if (data.email && users.find(u => u.email && u.email.toLowerCase() === data.email.toLowerCase())) { return { ok: false, error: "Email déjà utilisé" }; }
    // Générer un code de vérification à 5 chiffres
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    // Sauvegarder l'inscription EN ATTENTE de vérification (pas encore dans lcy_users)
    localStorage.setItem("lcy_pending_" + data.email.toLowerCase(), JSON.stringify({
      data, code, expires: Date.now() + 900000 // 15 minutes
    }));
    // Envoyer le code par email
    sendEmail(data.email, "Votre code de confirmation Locatzy 🔐", `Bonjour ${data.name},\n\nBienvenue sur Locatzy ! Voici votre code de confirmation :\n\n👉 ${code}\n\nEntrez ce code sur le site pour activer votre compte.\nCe code expire dans 15 minutes.`, { to_name: data.name, reset_code: code });
    flash("📧 Code de confirmation envoyé !");
    setModal({ type: "verifyEmail", data: { email: data.email, name: data.name } });
    return { ok: true };
  };

  // Vérifier le code de confirmation d'email
  const verifyEmailCode = async (email, codeEntered) => {
    const raw = localStorage.getItem("lcy_pending_" + email.toLowerCase());
    if (!raw) { return { ok: false, error: "Aucune inscription en attente. Recommencez." }; }
    const pending = JSON.parse(raw);
    if (Date.now() > pending.expires) { return { ok: false, error: "Code expiré. Demandez un nouveau code." }; }
    if (codeEntered.trim() !== pending.code) { return { ok: false, error: "Code incorrect. Réessayez." }; }
    // Code correct → créer le compte dans Firebase (partagé entre appareils)
    const newU = { ...pending.data, role: "user", verified: true, joined: new Date().toISOString().split("T")[0] };
    try {
      const ref = await addDoc(collection(db, "users"), newU);
      const userWithId = { ...newU, fbId: ref.id, id: ref.id };
      localStorage.removeItem("lcy_pending_" + email.toLowerCase());
      setUser(userWithId);
      localStorage.setItem("lcy_session", JSON.stringify(userWithId));
      // Email de bienvenue
      sendEmail(newU.email, "Bienvenue sur Locatzy 🎉", `Bonjour ${newU.name},\n\nVotre compte Locatzy est activé !\n\nVous pouvez maintenant publier vos annonces et réserver des biens partout dans le monde.\n\nL'équipe Locatzy`, { to_name: newU.name, type: "welcome" });
      flash(`Compte activé ! Bienvenue ${newU.name} ! 🎉`);
      setModal(null);
      return { ok: true };
    } catch (e) {
      console.log("Erreur création compte Firebase:", e);
      return { ok: false, error: "Erreur lors de la création du compte. Réessayez." };
    }
  };

  // Renvoyer un nouveau code de confirmation
  const resendVerifyCode = (email) => {
    const raw = localStorage.getItem("lcy_pending_" + email.toLowerCase());
    if (!raw) { return { ok: false, error: "Aucune inscription en attente. Recommencez." }; }
    const pending = JSON.parse(raw);
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    pending.code = code;
    pending.expires = Date.now() + 900000;
    localStorage.setItem("lcy_pending_" + email.toLowerCase(), JSON.stringify(pending));
    sendEmail(email, "Votre nouveau code Locatzy 🔐", `Bonjour ${pending.data.name},\n\nVoici votre nouveau code de confirmation :\n\n👉 ${code}\n\nCe code expire dans 15 minutes.`, { to_name: pending.data.name, reset_code: code });
    flash("📧 Nouveau code envoyé !");
    return { ok: true };
  };
  const logout = () => { setUser(null); localStorage.removeItem("lcy_session"); setPage("home"); flash("Déconnecté"); };

  // Mot de passe oublié - envoyer un code
  const sendResetCode = (email) => {
    const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!found) { flash("Aucun compte avec cet email", "#ef4444"); return null; }
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    // Sauvegarder le code temporairement (15 minutes)
    localStorage.setItem("lcy_reset_" + email.toLowerCase(), JSON.stringify({ code, expires: Date.now() + 900000 }));
    sendEmail(email, "Code de réinitialisation Locatzy 🔐", `Bonjour ${found.name},\n\nVoici votre code pour réinitialiser votre mot de passe :\n\n👉 ${code}\n\nEntrez ce code sur le site pour choisir un nouveau mot de passe.\nCe code expire dans 15 minutes.`, { to_name: found.name, reset_code: code });
    flash("📧 Code envoyé par email !");
    return code;
  };

  // Vérifier le code et changer le mot de passe
  const resetPassword = async (email, code, newPassword) => {
    const stored = localStorage.getItem("lcy_reset_" + email.toLowerCase());
    if (!stored) { flash("Aucune demande de réinitialisation", "#ef4444"); return false; }
    const { code: savedCode, expires } = JSON.parse(stored);
    if (Date.now() > expires) { flash("Code expiré, recommencez", "#ef4444"); return false; }
    if (code !== savedCode) { flash("Code incorrect", "#ef4444"); return false; }
    const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!found || !found.fbId) { flash("Compte introuvable", "#ef4444"); return false; }
    try {
      await updateDoc(doc(db, "users", found.fbId), { password: newPassword });
      localStorage.removeItem("lcy_reset_" + email.toLowerCase());
      flash("✅ Mot de passe changé ! Connectez-vous.");
      return true;
    } catch (e) {
      console.log("Erreur reset password Firebase:", e);
      flash("Erreur, réessayez", "#ef4444");
      return false;
    }
  };

  const addListing = async (data) => {
    const newL = { ...data, id: Date.now(), ownerId: user.id, ownerName: user.name, ownerEmail: user.email, status: "pending", createdAt: new Date().toISOString().split("T")[0] };
    try {
      // 🔥 Enregistrer l'annonce dans Firebase (partagée par tous)
      await addDoc(collection(db, "listings"), newL);
      addNotif(getAdminId(), `Nouvelle annonce à modérer : "${data.title}" par ${user.name}`, "moderation");
      flash("✓ Annonce enregistrée ! En attente de validation par l'admin.");
      setModal(null);
      setPage("my");
    } catch (err) {
      console.log("Erreur ajout annonce Firebase:", err);
      flash("Erreur lors de l'enregistrement. Réessayez.", "#ef4444");
    }
  };

  // ✏️ Modifier une annonce existante
  const updateListing = async (listing, data) => {
    if (!listing.fbId) { flash("Erreur annonce", "#ef4444"); return; }
    try {
      // Nettoyer les données : enlever fbId, et remplacer les undefined par des valeurs vides
      // (Firebase refuse les valeurs "undefined")
      const clean = {};
      Object.keys(data).forEach(k => {
        if (k === "fbId") return; // ne pas renvoyer le fbId dans les données
        clean[k] = data[k] === undefined ? "" : data[k];
      });
      await updateDoc(doc(db, "listings", listing.fbId), { ...clean, status: "pending" });
      addNotif(getAdminId(), `Annonce modifiée à re-valider : "${data.title}" par ${user.name}`, "moderation");
      flash("✓ Annonce modifiée ! En attente de re-validation par l'admin.");
      setModal(null);
      setPage("my");
    } catch (err) {
      console.log("Erreur modification annonce Firebase:", err);
      flash("Erreur lors de la modification. Réessayez.", "#ef4444");
    }
  };

  // 📅 Mettre à jour les dates bloquées (indisponibilités) d'une annonce
  const updateBlockedDates = async (listing, blockedDates, noReturnDates) => {
    if (!listing.fbId) { flash("Erreur annonce", "#ef4444"); return; }
    try {
      const data = { blockedDates };
      if (noReturnDates !== undefined) data.noReturnDates = noReturnDates; // jours où le retour est interdit
      await updateDoc(doc(db, "listings", listing.fbId), data);
      flash("✓ Disponibilités mises à jour !");
    } catch (err) {
      console.log("Erreur maj disponibilités:", err);
      flash("Erreur, réessayez.", "#ef4444");
    }
  };

  // 💳 Paiement Stripe : mémorise la réservation, appelle le serveur, puis redirige vers Stripe
  const payerAvecStripe = async (listing, from, to, total, info = {}) => {
    try {
      // Mémoriser les détails de la réservation pour la créer au retour du paiement
      localStorage.setItem("lcy_pending_payment", JSON.stringify({
        listingId: listing.id, from, to, info, total,
      }));
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingTitle: listing.title,
          amount: total,
          from,
          to,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirige vers la page de paiement Stripe
      } else {
        flash("Erreur de paiement, réessayez", "#ef4444");
      }
    } catch (e) {
      console.log("Erreur paiement Stripe:", e);
      flash("Erreur de paiement, réessayez", "#ef4444");
    }
  };

  const book = async (listing, from, to, info = {}) => {
    if (!user) return setModal({ type: "login" });
    const conflict = findConflict(listing.id, from, to);
    if (conflict) { flash(`❌ Conflit avec une réservation du ${conflict.from} au ${conflict.to}`, "#ef4444"); return false; }
    const days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));
    const priceInfo = getPriceWithOffer(listing, days);
    const subtotal = priceInfo.total;
    const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
    const ownerEarnings = Math.round((subtotal - commission) * 100) / 100;
    const newB = {
      id: Date.now(),
      listingId: listing.id, listingTitle: listing.title, listingType: listing.type,
      ownerId: listing.ownerId, ownerName: listing.ownerName, ownerEmail: listing.ownerEmail,
      renterId: user.id, renterName: user.name, renterEmail: user.email,
      from, to, days,
      pricePerDay: priceInfo.pricePerDay,
      offerApplied: priceInfo.offerApplied,
      saved: priceInfo.saved || 0,
      subtotal, commission, ownerEarnings, total: subtotal,
      // Infos personnelles du locataire
      renterFullName: info.fullName || user.name,
      renterPhone: info.phone || "",
      renterIdType: info.idType || "",
      renterIdNumber: info.idNumber || "",
      renterNote: info.note || "",
      paymentMethod: info.paymentMethod || "onsite",
      status: "confirmed",
      createdAt: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, "bookings"), newB);
    } catch (e) {
      console.log("Erreur création réservation Firebase:", e);
      flash("Erreur lors de la réservation. Réessayez.", "#ef4444");
      return false;
    }
    addNotif(listing.ownerId, `🎉 ${info.fullName || user.name} a réservé "${listing.title}" du ${from} au ${to} — Vous gagnez ${ownerEarnings}€`, "new_booking");
    sendEmail(listing.ownerEmail, `Nouvelle réservation Locatzy`, `${info.fullName || user.name} a réservé du ${from} au ${to}. Tél: ${info.phone || "—"}. Gain: ${ownerEarnings}€`);
    addNotif(getAdminId(), `💰 ${user.name} → "${listing.title}" — Commission : ${commission}€`, "commission");
    sendEmail("blackberrywalid72@gmail.com", `Commission ${commission}€`, `Réservation: ${user.name} → ${listing.title}`);
    addNotif(user.id, `✓ Réservation confirmée : "${listing.title}" — Total ${subtotal}€`, "confirmation");
    flash(`✓ Réservation confirmée ! ${subtotal}€`);
    setModal(null);
  };

  // ⭐ Ajouter un avis
  const addReview = async (listingId, rating, comment) => {
    const newR = { id: Date.now(), listingId, userId: user.id, userName: user.name, rating, comment, date: new Date().toISOString() };
    try {
      await addDoc(collection(db, "reviews"), newR);
    } catch (e) {
      console.log("Erreur ajout avis Firebase:", e);
      flash("Erreur, réessayez", "#ef4444");
      return;
    }
    // Notifier le propriétaire
    const listing = listings.find(l => l.id === listingId);
    if (listing) addNotif(listing.ownerId, `⭐ ${user.name} a laissé un avis ${rating}/5 sur "${listing.title}"`, "review");
    flash("✓ Avis publié, merci !");
    setModal(null);
  };

  // 💬 Envoyer un message
  const sendMessage = async (listingId, toUserId, toUserName, text) => {
    if (!text.trim()) return;
    const newM = { id: Date.now(), conversationId: getConversationId(listingId, user.id, toUserId), listingId, fromId: user.id, fromName: user.name, toId: toUserId, toName: toUserName, text: text.trim(), date: new Date().toISOString(), read: false };
    try {
      await addDoc(collection(db, "messages"), newM);
    } catch (e) {
      console.log("Erreur envoi message Firebase:", e);
      flash("Erreur, réessayez", "#ef4444");
      return;
    }
    addNotif(toUserId, `💬 Nouveau message de ${user.name}`, "message");
  };

  const approveListing = async (fbId) => { try { await updateDoc(doc(db, "listings", fbId), { status: "approved" }); flash("Annonce approuvée"); } catch (e) { flash("Erreur", "#ef4444"); } };
  const rejectListing = async (fbId) => { try { await updateDoc(doc(db, "listings", fbId), { status: "rejected" }); flash("Annonce refusée", "#ef4444"); } catch (e) { flash("Erreur", "#ef4444"); } };
  const deleteListing = async (fbId) => { try { await deleteDoc(doc(db, "listings", fbId)); flash("Annonce supprimée", "#ef4444"); } catch (e) { flash("Erreur", "#ef4444"); } };
  const deleteUser = async (fbId) => { try { await deleteDoc(doc(db, "users", fbId)); flash("Utilisateur supprimé", "#ef4444"); } catch (e) { flash("Erreur", "#ef4444"); } };

  const visible = listings.filter(l => {
    if (l.status !== "approved") return false;
    if (filter !== "all" && l.type !== filter) return false;
    if (country !== "all" && l.country !== country) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.city.toLowerCase().includes(search.toLowerCase()) && !l.country.toLowerCase().includes(search.toLowerCase())) return false;
    // Filtre par disponibilité aux dates choisies
    if (dateFrom && dateTo) {
      if (new Date(dateTo) <= new Date(dateFrom)) return false;
      if (findConflict(l.id, dateFrom, dateTo)) return false;
    }
    // Prix
    if (priceMin && l.price < parseInt(priceMin)) return false;
    if (priceMax && l.price > parseInt(priceMax)) return false;
    // Chambres / Personnes (pour logements)
    if (minRooms && isLodging(l.type) && (l.rooms || 0) < parseInt(minRooms)) return false;
    if (minGuests && isLodging(l.type) && (l.guests || 0) < parseInt(minGuests)) return false;
    // Places (pour véhicules)
    if (minGuests && isVehicle(l.type) && (l.seats || 0) < parseInt(minGuests)) return false;
    // Note minimum
    if (minRating > 0) {
      const r = getListingRating(l.id);
      if (r.avg < minRating) return false;
    }
    // WiFi obligatoire (logements seulement)
    if (wifiOnly && isLodging(l.type) && l.wifi !== true) return false;
    return true;
  });

  const myListings = user ? listings.filter(l => l.ownerId === user.id) : [];
  const myBookingsAsRenter = user ? bookings.filter(b => b.renterId === user.id) : [];
  const bookingsOnMyListings = user ? bookings.filter(b => b.ownerId === user.id) : [];
  const myNotifications = user ? notifications.filter(n => n.userId === user.id).reverse() : [];
  const unreadCount = myNotifications.filter(n => !n.read).length;
  const myMessages = user ? messages.filter(m => m.fromId === user.id || m.toId === user.id) : [];
  const unreadMessagesCount = myMessages.filter(m => m.toId === user?.id && !m.read).length;

  const markAllRead = async () => {
    const toMark = notifications.filter(n => n.userId === user.id && !n.read && n.fbId);
    for (const n of toMark) {
      try { await updateDoc(doc(db, "notifications", n.fbId), { read: true }); } catch (e) { console.log("Erreur maj notif lue:", e); }
    }
  };

  // 🔗 Cliquer sur une notification → aller au bon endroit (comme Facebook)
  const goToNotif = (notif) => {
    const t = notif.type;
    if (t === "moderation") {
      // Annonce à modérer → Admin (l'onglet "à modérer" est par défaut quand on a du pending)
      setPage("admin");
    } else if (t === "commission") {
      setPage("admin");
    } else if (t === "payout") {
      // Demande de versement → Admin versements
      setPage("admin");
    } else if (t === "message") {
      setPage("messages");
    } else if (t === "new_booking" || t === "confirmation" || t === "exchange" || t === "exchange_done" || t === "payout_done") {
      // Tout ce qui concerne les réservations → page Mes réservations
      setPage("my");
    } else if (t === "review") {
      // Avis → page Mes réservations (où l'utilisateur voit ses biens notés)
      setPage("my");
    } else {
      setPage("my");
    }
  };


  // 🤝 Confirmation d'arrivée : le locataire et le propriétaire confirment chacun que l'échange a eu lieu
  const confirmExchange = async (booking, role) => {
    if (!booking.fbId) { flash("Erreur réservation", "#ef4444"); return; }
    try {
      // role = "renter" (locataire) ou "owner" (propriétaire)
      const champ = role === "renter" ? { renterConfirmed: true } : { ownerConfirmed: true };
      await updateDoc(doc(db, "bookings", booking.fbId), champ);

      // Calculer si les deux ont confirmé (en tenant compte de la confirmation actuelle)
      const renterOk = role === "renter" ? true : booking.renterConfirmed;
      const ownerOk = role === "owner" ? true : booking.ownerConfirmed;

      if (role === "renter") {
        // Le locataire vient de confirmer → prévenir le propriétaire
        addNotif(booking.ownerId, `🔑 ${booking.renterName} a confirmé avoir récupéré la réservation "${booking.listingTitle}"`, "exchange");
        sendEmail(booking.ownerEmail, "Le locataire a confirmé la récupération - Locatzy", `Bonjour,\n\n${booking.renterName} a confirmé avoir bien récupéré sa réservation pour "${booking.listingTitle}" (du ${booking.from} au ${booking.to}).\n\nL'équipe Locatzy`, { to_name: booking.ownerName });
        flash("✅ Vous avez confirmé la récupération !");
      } else {
        // Le propriétaire vient de confirmer → prévenir le locataire
        addNotif(booking.renterId, `🔑 ${booking.ownerName} a confirmé la remise pour "${booking.listingTitle}"`, "exchange");
        sendEmail(booking.renterEmail, "Le propriétaire a confirmé la remise - Locatzy", `Bonjour,\n\n${booking.ownerName} a confirmé la remise de "${booking.listingTitle}" (du ${booking.from} au ${booking.to}).\n\nL'équipe Locatzy`, { to_name: booking.renterName });
        flash("✅ Vous avez confirmé la remise !");
      }

      // Si les DEUX ont confirmé → échange validé
      if (renterOk && ownerOk) {
        await updateDoc(doc(db, "bookings", booking.fbId), { status: "exchange_done" });
        addNotif(booking.renterId, `✓✓ Échange confirmé des deux côtés pour "${booking.listingTitle}" !`, "exchange_done");
        addNotif(booking.ownerId, `✓✓ Échange confirmé des deux côtés pour "${booking.listingTitle}" !`, "exchange_done");
      }
    } catch (e) {
      console.log("Erreur confirmExchange:", e);
      flash("Erreur, réessayez", "#ef4444");
    }
  };

  const markMessagesRead = async (conversationId) => {
    // Trouver les messages non lus de cette conversation destinés à l'utilisateur courant
    const toMark = messages.filter(m => m.conversationId === conversationId && m.toId === user.id && !m.read && m.fbId);
    for (const m of toMark) {
      try { await updateDoc(doc(db, "messages", m.fbId), { read: true }); } catch (e) { console.log("Erreur maj message lu:", e); }
    }
  };

  // 💸 Admin : marquer une demande de versement comme payée
  const markPayoutPaid = async (payout) => {
    if (!payout.fbId) return;
    try {
      await updateDoc(doc(db, "payouts", payout.fbId), { status: "paid", paidAt: new Date().toISOString() });
      addNotif(payout.ownerId, `✅ Votre versement de ${payout.amount}€ pour "${payout.listingTitle}" a été effectué !`, "payout_done");
      sendEmail(payout.ownerEmail, `Versement effectué - Locatzy`, `Bonjour ${payout.ownerName},\n\nVotre versement de ${payout.amount}€ pour "${payout.listingTitle}" a été effectué.\n\nL'équipe Locatzy`, { to_name: payout.ownerName });
      flash("✅ Versement marqué comme payé");
    } catch (e) { console.log("Erreur markPayoutPaid:", e); flash("Erreur", "#ef4444"); }
  };

  // 🏦 Enregistrer les infos de paiement du propriétaire (RIB ou Wafacash)
  const updatePaymentInfo = async (paymentInfo) => {
    if (!user || !user.fbId) { flash("Erreur compte", "#ef4444"); return; }
    try {
      await updateDoc(doc(db, "users", user.fbId), { paymentInfo });
      // Mettre à jour la session locale
      const updatedUser = { ...user, paymentInfo };
      setUser(updatedUser);
      localStorage.setItem("lcy_session", JSON.stringify(updatedUser));
      flash("✅ Infos de paiement enregistrées !");
    } catch (e) {
      console.log("Erreur updatePaymentInfo:", e);
      flash("Erreur, réessayez", "#ef4444");
    }
  };

  // 💰 Demander le versement de ses gains pour une réservation
  const requestPayout = async (booking) => {
    // Vérifier que le propriétaire a bien renseigné ses infos de paiement
    if (!user.paymentInfo || (!user.paymentInfo.rib && !user.paymentInfo.wafacash)) {
      flash("Renseignez d'abord vos infos de paiement dans votre profil", "#ef4444");
      setPage("profile");
      return;
    }
    try {
      await addDoc(collection(db, "payouts"), {
        id: Date.now(),
        bookingId: booking.id,
        bookingFbId: booking.fbId || "",
        listingTitle: booking.listingTitle,
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
        amount: booking.ownerEarnings,
        paymentInfo: user.paymentInfo,
        status: "pending", // pending → paid
        requestedAt: new Date().toISOString(),
      });
      // Marquer la réservation comme "versement demandé"
      if (booking.fbId) { await updateDoc(doc(db, "bookings", booking.fbId), { payoutRequested: true }); }
      // Prévenir l'admin
      addNotif(getAdminId(), `💸 ${user.name} demande un versement de ${booking.ownerEarnings}€ pour "${booking.listingTitle}"`, "payout");
      sendEmail("blackberrywalid72@gmail.com", `Demande de versement ${booking.ownerEarnings}€`, `${user.name} demande le versement de ${booking.ownerEarnings}€ pour "${booking.listingTitle}".`);
      flash("✅ Demande de versement envoyée !");
    } catch (e) {
      console.log("Erreur requestPayout:", e);
      flash("Erreur, réessayez", "#ef4444");
    }
  };

  
  const handleToggleFavorite = async (listingId) => {
    if (!user) return setModal({ type: "login" });
    // Chercher si ce favori existe déjà (dans les favoris Firebase chargés)
    const existing = favorites.find(f => f.userId === user.id && f.listingId === listingId);
    try {
      if (existing && existing.fbId) {
        await deleteDoc(doc(db, "favorites", existing.fbId));
        flash("💔 Retiré des favoris");
      } else {
        await addDoc(collection(db, "favorites"), { id: Date.now(), userId: user.id, listingId, date: new Date().toISOString() });
        flash("❤️ Ajouté aux favoris !");
      }
    } catch (e) {
      console.log("Erreur favori Firebase:", e);
      flash("Erreur, réessayez", "#ef4444");
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", background: darkMode ? "#000" : "#e5e7eb", color: darkMode ? "#f5f5f5" : "#0a0a0a", display: "flex", justifyContent: "center" }}>
      <div className="app-container" style={{ width: "100%", minHeight: "100vh", background: darkMode ? "#0f0f0f" : "#fafafa", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.08)", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:wght@600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #14b8a6; border-radius: 3px; }
        button, input, textarea, select { font-family: inherit; }
        button { cursor: pointer; border: none; }
        .display { font-family: 'Fraunces', serif; }

        /* RESPONSIVE - Mobile par défaut (max 430px) */
        .app-container { max-width: 430px; }
        .bottom-nav { max-width: 430px; }

        /* TABLETTE (768px+) */
        @media (min-width: 768px) {
          .app-container { max-width: 100%; padding-bottom: 0 !important; }
          .bottom-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
          .listings-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .content-wrapper { max-width: 1200px; margin: 0 auto; padding: 20px 40px !important; }
          .hero-section { padding: 60px 40px !important; border-radius: 24px; margin: 20px; }
        }

        /* PC/LAPTOP (1024px+) */
        @media (min-width: 1024px) {
          .listings-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 24px !important; }
          .content-wrapper { max-width: 1400px; padding: 30px 60px !important; }
          .hero-section { padding: 80px 60px !important; }
          .detail-grid { display: grid !important; grid-template-columns: 2fr 1fr; gap: 40px; }
        }

        /* Galerie produit : taille moyenne sur PC (sur téléphone elle reste pleine largeur) */
        @media (min-width: 768px) {
          .detail-gallery { max-width: 680px !important; max-height: 400px !important; }
          .detail-gallery .detail-main-photo { height: 400px !important; }
        }

        /* Page produit : galerie à gauche + infos à droite sur PC (empilé sur téléphone) */
        @media (min-width: 900px) {
          .detail-top-grid { display: grid !important; grid-template-columns: 1.3fr 1fr !important; gap: 32px !important; align-items: start !important; }
          .detail-top-grid .detail-gallery { max-width: 100% !important; }
          /* La galerie reste collée en haut quand on descend (sticky façon Airbnb) */
          .detail-top-grid .detail-gallery { position: sticky !important; top: 20px !important; align-self: start !important; max-height: none !important; }
        }

        /* GRAND ÉCRAN (1440px+) */
        @media (min-width: 1440px) {
          .listings-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }

        .desktop-nav { display: none; }
        .mobile-only { display: block; }

        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }

        .card { background: ${darkMode ? "#1a1a1a" : "white"}; border-radius: 18px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.25s; border: 1px solid ${darkMode ? "#2a2a2a" : "#f0f0f0"}; color: ${darkMode ? "#f5f5f5" : "#0a0a0a"}; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
        .btn { padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-primary { background: ${darkMode ? "#14b8a6" : "#0a0a0a"}; color: white; }
        .btn-primary:hover { background: #14b8a6; }
        .btn-accent { background: #14b8a6; color: white; }
        .btn-accent:hover { background: #0d9488; }
        .btn-ghost { background: transparent; border: 1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}; color: ${darkMode ? "#d4d4d4" : "#374151"}; }
        .btn-ghost:hover { border-color: ${darkMode ? "#14b8a6" : "#0a0a0a"}; }
        .input { width: 100%; padding: 13px 16px; border: 1.5px solid ${darkMode ? "#2a2a2a" : "#e5e7eb"}; border-radius: 12px; font-size: 14px; outline: none; background: ${darkMode ? "#1a1a1a" : "white"}; color: ${darkMode ? "#f5f5f5" : "#0a0a0a"}; }
        .input:focus { border-color: #14b8a6; }
        .input::placeholder { color: ${darkMode ? "#6b7280" : "#9ca3af"}; }
        .pill { padding: 8px 18px; border-radius: 50px; font-weight: 600; font-size: 13px; background: ${darkMode ? "#1a1a1a" : "white"}; color: ${darkMode ? "#a3a3a3" : "#6b7280"}; border: 1.5px solid ${darkMode ? "#2a2a2a" : "#e5e7eb"}; cursor: pointer; }
        .pill.active { background: ${darkMode ? "#14b8a6" : "#0a0a0a"}; color: white; border-color: ${darkMode ? "#14b8a6" : "#0a0a0a"}; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 50px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; }
        .overlay { position: fixed; inset: 0; background: rgba(10,10,10,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(6px); }
        .modal { background: ${darkMode ? "#1a1a1a" : "white"}; color: ${darkMode ? "#f5f5f5" : "#0a0a0a"}; border-radius: 24px; padding: 36px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; position: relative; }
        .nav-btn { background: transparent; padding: 10px 16px; border-radius: 50px; font-size: 14px; font-weight: 500; color: ${darkMode ? "#d4d4d4" : "#374151"}; }
        .nav-btn:hover { background: ${darkMode ? "#2a2a2a" : "#f3f4f6"}; }
        .photo-thumb { width: 80px; height: 80px; border-radius: 12px; background: ${darkMode ? "#2a2a2a" : "#f3f4f6"}; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {toast && <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 13, zIndex: 999, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", animation: "slideIn 0.3s ease", maxWidth: 360, width: "calc(100% - 32px)", textAlign: "center" }}>{toast.msg}</div>}

      {modal && <Modal modal={modal} setModal={setModal} login={login} register={register} verifyEmailCode={verifyEmailCode} resendVerifyCode={resendVerifyCode} sendResetCode={sendResetCode} resetPassword={resetPassword} addListing={addListing} updateListing={updateListing} updateBlockedDates={updateBlockedDates} book={book} payerAvecStripe={payerAvecStripe} user={user} setPage={setPage} setCountry={setCountry} setSearch={setSearch} setFilter={setFilter} listings={listings} reviews={reviews} messages={messages} sendMessage={sendMessage} addReview={addReview} markMessagesRead={markMessagesRead} bookings={bookings} flash={flash} />}

      <nav style={{ background: darkMode ? "#0f0f0f" : "white", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, borderBottom: darkMode ? "1px solid #2a2a2a" : "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setPage("home")}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16 }}>L</div>
          <div>
            <div className="display" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1 }}>Locatzy</div>
            <div style={{ fontSize: 9, color: "#6b7280", letterSpacing: 1, fontWeight: 600 }}>🌍 WORLDWIDE</div>
          </div>
        </div>

        {/* NAV DESKTOP - Visible uniquement sur PC */}
        <div className="desktop-nav" style={{ alignItems: "center", gap: 6 }}>
          <button className="nav-btn" onClick={() => setPage("home")} style={{ fontWeight: page === "home" ? 700 : 500, color: page === "home" ? (darkMode ? "#14b8a6" : "#0a0a0a") : undefined }}>🏠 Accueil</button>
          {user && <button className="nav-btn" onClick={() => setPage("my")} style={{ fontWeight: page === "my" ? 700 : 500, color: page === "my" ? (darkMode ? "#14b8a6" : "#0a0a0a") : undefined }}>📋 Annonces</button>}
          {user && <button className="nav-btn" onClick={() => setPage("messages")} style={{ fontWeight: page === "messages" ? 700 : 500, color: page === "messages" ? (darkMode ? "#14b8a6" : "#0a0a0a") : undefined, position: "relative" }}>💬 Messages{unreadMessagesCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "white", borderRadius: 50, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{unreadMessagesCount}</span>}</button>}
          {user && <button className="nav-btn" onClick={() => { setPage("notif"); markAllRead(); }} style={{ fontWeight: page === "notif" ? 700 : 500, color: page === "notif" ? (darkMode ? "#14b8a6" : "#0a0a0a") : undefined, position: "relative" }}>🔔 Notif{unreadCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "white", borderRadius: 50, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>}</button>}
          {user?.role === "admin" && <button className="nav-btn" onClick={() => setPage("admin")} style={{ fontWeight: page === "admin" ? 700 : 500, color: "#14b8a6" }}>⚡ Admin</button>}
          <button className="nav-btn" onClick={() => setModal({ type: "explore" })} style={{ fontWeight: 600 }}>🌍 Explorer</button>
          <button className="nav-btn" onClick={() => user ? setPage("profile") : setModal({ type: "login" })} style={{ background: user ? (darkMode ? "#14b8a6" : "#0a0a0a") : "#14b8a6", color: "white", fontWeight: 700, marginLeft: 8 }}>{user ? `👤 ${user.name}` : "🔑 Connexion"}</button>
        </div>

        {/* BOUTON EXPLORER MOBILE */}
        <button className="nav-btn mobile-only" onClick={() => setModal({ type: "explore" })} style={{ fontWeight: 700 }}>🌍 Explorer</button>
      </nav>

      {page === "home" && <Home listings={visible} filter={filter} setFilter={setFilter} country={country} setCountry={setCountry} countries={[...new Set(listings.filter(l => l.status === "approved").map(l => l.country))]} search={search} setSearch={setSearch} setModal={setModal} openDetail={(l) => { setSelectedListing(l); setPage("detail"); }} openOwner={(ownerId) => { setSelectedOwner(ownerId); setPage("owner"); }} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} user={user} onToggleFav={handleToggleFavorite} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} minRooms={minRooms} setMinRooms={setMinRooms} minGuests={minGuests} setMinGuests={setMinGuests} minRating={minRating} setMinRating={setMinRating} wifiOnly={wifiOnly} setWifiOnly={setWifiOnly} />}
      {page === "detail" && selectedListing && <DetailPage listing={selectedListing} user={user} setPage={setPage} setModal={setModal} reviews={reviews} bookings={bookings} messages={messages} sendMessage={sendMessage} markMessagesRead={markMessagesRead} onToggleFav={handleToggleFavorite} openOwner={(ownerId) => { setSelectedOwner(ownerId); setPage("owner"); }} />}
      {page === "owner" && selectedOwner && <OwnerProfilePage ownerId={selectedOwner} listings={listings} reviews={reviews} bookings={bookings} user={user} setPage={setPage} openDetail={(l) => { setSelectedListing(l); setPage("detail"); }} openOwner={(ownerId) => { setSelectedOwner(ownerId); setPage("owner"); }} setModal={setModal} onToggleFav={handleToggleFavorite} />}
      {page === "my" && user && <MyPage myListings={myListings} myBookingsAsRenter={myBookingsAsRenter} bookingsOnMyListings={bookingsOnMyListings} setModal={setModal} reviews={reviews} user={user} confirmExchange={confirmExchange} requestPayout={requestPayout} setPage={setPage} />}
      {page === "notif" && user && <NotifPage notifications={myNotifications} goToNotif={goToNotif} />}
      {page === "messages" && user && <MessagesPage user={user} messages={myMessages} listings={listings} users={users} setModal={setModal} markMessagesRead={markMessagesRead} />}
      {page === "admin" && user?.role === "admin" && <Admin listings={listings} bookings={bookings} users={users} approveListing={approveListing} rejectListing={rejectListing} deleteListing={deleteListing} deleteUser={deleteUser} reviews={reviews} payouts={payouts} markPayoutPaid={markPayoutPaid} />}
      {page === "profile" && <ProfilePage user={user} setPage={setPage} setModal={setModal} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} updatePaymentInfo={updatePaymentInfo} />}
      {page === "favorites" && user && <FavoritesPage user={user} listings={listings} favorites={favorites} setPage={setPage} openDetail={(l) => { setSelectedListing(l); setPage("detail"); }} openOwner={(ownerId) => { setSelectedOwner(ownerId); setPage("owner"); }} onToggleFav={handleToggleFavorite} setModal={setModal} /> }

      {/* BOTTOM NAV FIXED - Mobile uniquement */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", background: darkMode ? "#0f0f0f" : "white", borderTop: darkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", boxShadow: "0 -2px 16px rgba(0,0,0,0.04)", zIndex: 90 }}>
        <BottomBtn icon="🏠" label="Accueil" active={page === "home"} onClick={() => setPage("home")} darkMode={darkMode} />
        {user && <BottomBtn icon="📋" label="Annonces" active={page === "my"} onClick={() => setPage("my")} darkMode={darkMode} />}
        {user && <BottomBtn icon="💬" label="Messages" active={page === "messages"} badge={unreadMessagesCount} onClick={() => setPage("messages")} darkMode={darkMode} />}
        {user && <BottomBtn icon="🔔" label="Notif" active={page === "notif"} badge={unreadCount} onClick={() => { setPage("notif"); markAllRead(); }} darkMode={darkMode} />}
        {user?.role === "admin" && <BottomBtn icon="⚡" label="Admin" active={page === "admin"} onClick={() => setPage("admin")} accent darkMode={darkMode} />}
        <BottomBtn icon={user ? "👤" : "🔑"} label={user ? "Profil" : "Connexion"} active={page === "profile"} onClick={() => user ? setPage("profile") : setModal({ type: "login" })} darkMode={darkMode} />
      </div>
      </div>
    </div>
  );
}

function BottomBtn({ icon, label, active, onClick, badge, accent, darkMode }) {
  const inactiveColor = darkMode ? "#6b7280" : "#9ca3af";
  const activeColor = accent ? "#14b8a6" : (darkMode ? "#f5f5f5" : "#0a0a0a");
  return (
    <button onClick={onClick} style={{ background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 10px", position: "relative", color: active ? activeColor : inactiveColor, flex: 1 }}>
      <span style={{ fontSize: 20, position: "relative" }}>
        {icon}
        {badge > 0 && <span style={{ position: "absolute", top: -3, right: -8, background: "#ef4444", color: "white", borderRadius: 50, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>{badge}</span>}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

function FavoritesPage({ user, listings, favorites, setPage, openDetail, onToggleFav, setModal, openOwner }) {
  // Mes favoris : annonces que j'ai aimées et qui sont approuvées
  const myFavIds = favorites.filter(f => f.userId === user.id).map(f => f.listingId);
  const favListings = listings.filter(l => myFavIds.includes(l.id) && l.status === "approved");

  return (
    <div style={{ padding: "16px" }}>
      <h2 className="display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>❤️ Mes favoris</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>{favListings.length} bien{favListings.length > 1 ? "s" : ""} sauvegardé{favListings.length > 1 ? "s" : ""}</p>

      {favListings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>💔</div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Aucun favori pour le moment</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Cliquez sur 🤍 sur une annonce pour la sauvegarder</p>
          <button className="btn btn-primary" onClick={() => setPage("home")}>🏠 Découvrir les annonces</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {favListings.map(l => <ListingCard key={l.id} listing={l} onBook={() => setModal({ type: "book", data: l })} onContact={() => setModal({ type: "contactOwner", data: l })} onOpen={() => openDetail(l)} user={user} onToggleFav={onToggleFav} openOwner={openOwner} />)}
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user, setPage, setModal, logout, darkMode, toggleDarkMode, updatePaymentInfo }) {
  if (!user) return null;
  const [payMethod, setPayMethod] = useState(user.paymentInfo?.method || "rib");
  const [payName, setPayName] = useState(user.paymentInfo?.fullName || "");
  const [payRib, setPayRib] = useState(user.paymentInfo?.rib || "");
  const [payWafa, setPayWafa] = useState(user.paymentInfo?.wafacash || "");
  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 className="display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>👤 Mon profil</h2>
      <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 32, margin: "0 auto 12px" }}>{user.name[0]}</div>
        <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{user.name}</h3>
        <p style={{ color: "#6b7280", fontSize: 13 }}>{user.email || user.phone}</p>
        {user.email && user.phone && <p style={{ color: "#6b7280", fontSize: 13 }}>📱 {user.phone}</p>}
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>📍 {user.country}</p>
        {user.role === "admin" && <span style={{ display: "inline-block", marginTop: 10, background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: 50, fontSize: 11, fontWeight: 700 }}>⚡ ADMIN</span>}
      </div>

      {/* 🏆 BADGES */}
      {(() => {
        const myBadges = getUserBadges(user.id);
        return (
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontWeight: 800, fontSize: 15 }}>🏆 Mes badges</h3>
              <span style={{ background: "#f0fdfa", color: "#0d9488", padding: "3px 10px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>{myBadges.length}/{Object.keys(ALL_BADGES).length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {Object.entries(ALL_BADGES).map(([key, badge]) => {
                const earned = myBadges.includes(key);
                return (
                  <div key={key} title={badge.desc} style={{ background: earned ? "white" : "#f9fafb", border: earned ? `2px solid ${badge.color}` : "1px solid #e5e7eb", borderRadius: 12, padding: 10, textAlign: "center", opacity: earned ? 1 : 0.4, transition: "all 0.2s" }}>
                    <div style={{ fontSize: 28, marginBottom: 4, filter: earned ? "none" : "grayscale(100%)" }}>{badge.icon}</div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: earned ? badge.color : "#9ca3af", lineHeight: 1.2 }}>{badge.label}</p>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>Continuez à utiliser Locatzy pour débloquer plus de badges !</p>
          </div>
        );
      })()}
      {/* 🏦 INFOS DE PAIEMENT (pour recevoir les versements) */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>🏦 Mes infos de paiement</h3>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>Pour recevoir vos gains quand un locataire confirme sa réservation.</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setPayMethod("rib")} style={{ flex: 1, padding: 10, borderRadius: 10, border: payMethod === "rib" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: payMethod === "rib" ? "#f0fdfa" : "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🏦 Compte bancaire (RIB)</button>
          <button onClick={() => setPayMethod("wafacash")} style={{ flex: 1, padding: 10, borderRadius: 10, border: payMethod === "wafacash" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: payMethod === "wafacash" ? "#f0fdfa" : "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💵 Wafacash</button>
        </div>

        <input value={payName} onChange={e => setPayName(e.target.value)} placeholder="Nom et prénom" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 10, fontSize: 14, boxSizing: "border-box" }} />

        {payMethod === "rib" ? (
          <input value={payRib} onChange={e => setPayRib(e.target.value)} placeholder="Votre RIB (24 chiffres)" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 10, fontSize: 14, boxSizing: "border-box" }} />
        ) : (
          <input value={payWafa} onChange={e => setPayWafa(e.target.value)} placeholder="Numéro de téléphone Wafacash" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 10, fontSize: 14, boxSizing: "border-box" }} />
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => {
          if (!payName.trim()) return alert("Entrez votre nom et prénom");
          if (payMethod === "rib" && !payRib.trim()) return alert("Entrez votre RIB");
          if (payMethod === "wafacash" && !payWafa.trim()) return alert("Entrez votre numéro Wafacash");
          updatePaymentInfo({ method: payMethod, fullName: payName.trim(), rib: payMethod === "rib" ? payRib.trim() : "", wafacash: payMethod === "wafacash" ? payWafa.trim() : "" });
        }}>💾 Enregistrer mes infos</button>

        {user.paymentInfo && (user.paymentInfo.rib || user.paymentInfo.wafacash) && (
          <p style={{ fontSize: 12, color: "#0d9488", marginTop: 10, fontWeight: 600, textAlign: "center" }}>✅ Infos enregistrées ({user.paymentInfo.method === "rib" ? "RIB" : "Wafacash"})</p>
        )}
      </div>

      <button className="btn btn-ghost" style={{ width: "100%", padding: 14, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => setPage("favorites")}>
        <span>❤️ Mes favoris</span>
        <span>›</span>
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", padding: 14, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={toggleDarkMode}>
        <span>{darkMode ? "☀️ Mode clair" : "🌙 Mode sombre"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 36, height: 20, background: darkMode ? "#14b8a6" : "#d1d5db", borderRadius: 50, position: "relative", transition: "all 0.2s" }}>
            <span style={{ position: "absolute", top: 2, left: darkMode ? 18 : 2, width: 16, height: 16, background: "white", borderRadius: "50%", transition: "all 0.2s" }} />
          </span>
        </span>
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", padding: 14 }} onClick={logout}>🚪 Déconnexion</button>
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────
function Home({ listings, filter, setFilter, country, setCountry, countries, search, setSearch, setModal, openDetail, openOwner, dateFrom, setDateFrom, dateTo, setDateTo, user, onToggleFav, priceMin, setPriceMin, priceMax, setPriceMax, minRooms, setMinRooms, minGuests, setMinGuests, minRating, setMinRating, wifiOnly, setWifiOnly }) {
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [selectedDropdownCountry, setSelectedDropdownCountry] = useState("");
  const [lodgingDropdownOpen, setLodgingDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [advancedDropdownOpen, setAdvancedDropdownOpen] = useState(false);
  return (
    <div>
      <div className="hero-section" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", padding: "32px 20px 50px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)", opacity: 0.4 }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(20,184,166,0.15)", color: "#5eead4", padding: "5px 12px", borderRadius: 50, fontSize: 11, fontWeight: 600, marginBottom: 14 }}>🌍 Disponible dans le monde entier</div>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 12, letterSpacing: -0.5 }}>Louez n'importe où.<br /><em style={{ color: "#14b8a6", fontStyle: "italic", fontSize: 26 }}>Partout dans le monde.</em></h1>
          <p style={{ color: "#a3a3a3", fontSize: 13, marginBottom: 22 }}>Appartements & voitures entre particuliers</p>
          <div style={{ background: "white", borderRadius: 50, padding: 5, display: "flex", gap: 5, marginBottom: 10, boxShadow: "0 15px 35px rgba(0,0,0,0.4)" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pays, ville…" style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: 13, background: "transparent" }} />
            <button className="btn btn-accent" style={{ borderRadius: 50, padding: "8px 18px", fontSize: 13 }}>🔍</button>
          </div>
          {/* Sélection des dates */}
          <div style={{ background: "white", borderRadius: 16, padding: 12, marginBottom: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.3)", boxSizing: "border-box" }}>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, textAlign: "left" }}>📅 QUAND VOULEZ-VOUS LOUER ?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, display: "block", marginBottom: 4, textAlign: "left" }}>Arrivée</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ width: "100%", border: "none", outline: "none", padding: "8px 6px", fontSize: 12, background: "#f9fafb", borderRadius: 10, fontFamily: "inherit", boxSizing: "border-box", minWidth: 0 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, display: "block", marginBottom: 4, textAlign: "left" }}>Départ</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || new Date().toISOString().split("T")[0]} style={{ width: "100%", border: "none", outline: "none", padding: "8px 6px", fontSize: 12, background: "#f9fafb", borderRadius: 10, fontFamily: "inherit", boxSizing: "border-box", minWidth: 0 }} />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ background: "transparent", color: "#ef4444", fontSize: 11, fontWeight: 600, marginTop: 10, padding: 4 }}>✕ Effacer les dates</button>
            )}
          </div>
          <button className="btn" style={{ background: "white", color: "#0a0a0a", fontSize: 14, padding: "12px 28px" }} onClick={() => setModal({ type: "add" })}>+ Publier mon annonce</button>
        </div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", gap: 8, borderBottom: "1px solid #f0f0f0", background: "white", overflowX: "auto", whiteSpace: "nowrap", position: "sticky", top: 60, zIndex: 40 }}>
        {(() => {
          const isLodgingFilter = filter !== "all" && isLodging(filter);
          const isVehicleFilter = filter !== "all" && isVehicle(filter);
          return <>
            <button className={`pill ${isLodgingFilter ? "active" : ""}`} onClick={() => setLodgingDropdownOpen(!lodgingDropdownOpen)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {isLodgingFilter ? `${PROPERTY_TYPES[filter].icon} ${PROPERTY_TYPES[filter].labelShort}` : "🏘 Logements"} ▾
            </button>
            <button className={`pill ${isVehicleFilter ? "active" : ""}`} onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {isVehicleFilter ? `${PROPERTY_TYPES[filter].icon} ${PROPERTY_TYPES[filter].labelShort}` : "🚙 Véhicules"} ▾
            </button>
            <button className={`pill ${country !== "all" ? "active" : ""}`} onClick={() => setCountryDropdownOpen(!countryDropdownOpen)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {country === "all" ? "🌍 Pays" : country} ▾
            </button>
            <button className={`pill ${(priceMin || priceMax || minRooms || minGuests || minRating > 0 || wifiOnly) ? "active" : ""}`} onClick={() => setAdvancedDropdownOpen(!advancedDropdownOpen)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              ⚙️ Filtres {(() => {
                const count = [priceMin, priceMax, minRooms, minGuests, minRating > 0, wifiOnly].filter(Boolean).length;
                return count > 0 ? `(${count})` : "";
              })()} ▾
            </button>
          </>;
        })()}
      </div>

      {/* MENU FILTRES AVANCÉS */}
      {advancedDropdownOpen && (
        <>
          <div onClick={() => setAdvancedDropdownOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80 }} />
          <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, maxHeight: "75vh", background: "white", borderRadius: 20, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", zIndex: 85, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>⚙️ Filtres avancés</h3>
              <button onClick={() => setAdvancedDropdownOpen(false)} style={{ background: "#f3f4f6", borderRadius: "50%", width: 30, height: 30, fontSize: 16 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: 18 }}>
              {/* Prix */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💰 Prix par jour (€)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input className="input" type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                  <input className="input" type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>

              {/* Chambres / Places */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🛏 Chambres minimum (logements)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  {["", "1", "2", "3", "4", "5+"].map(n => (
                    <button key={n} onClick={() => setMinRooms(n === "5+" ? "5" : n)} style={{ flex: 1, padding: 10, borderRadius: 10, border: minRooms === (n === "5+" ? "5" : n) ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: minRooms === (n === "5+" ? "5" : n) ? "#f0fdfa" : "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {n === "" ? "Tous" : n}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>👥 Personnes / Places minimum</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  {["", "1", "2", "4", "6", "8+"].map(n => (
                    <button key={n} onClick={() => setMinGuests(n === "8+" ? "8" : n)} style={{ flex: 1, padding: 10, borderRadius: 10, border: minGuests === (n === "8+" ? "8" : n) ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: minGuests === (n === "8+" ? "8" : n) ? "#f0fdfa" : "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {n === "" ? "Tous" : n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⭐ Note minimum</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 3, 3.5, 4, 4.5].map(n => (
                    <button key={n} onClick={() => setMinRating(n)} style={{ flex: 1, padding: 10, borderRadius: 10, border: minRating === n ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: minRating === n ? "#f0fdfa" : "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      {n === 0 ? "Tous" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* WiFi */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📶 WiFi obligatoire (logements)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button onClick={() => setWifiOnly(false)} style={{ padding: 12, borderRadius: 10, border: !wifiOnly ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: !wifiOnly ? "#f0fdfa" : "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Peu importe
                  </button>
                  <button onClick={() => setWifiOnly(true)} style={{ padding: 12, borderRadius: 10, border: wifiOnly ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: wifiOnly ? "#f0fdfa" : "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    📶 Avec WiFi
                  </button>
                </div>
              </div>

              {/* Boutons */}
              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => {
                  setPriceMin(""); setPriceMax(""); setMinRooms(""); setMinGuests(""); setMinRating(0); setWifiOnly(false);
                }}>Réinitialiser</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setAdvancedDropdownOpen(false)}>Appliquer ({listings.length} résultats)</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MENU LOGEMENTS */}
      {lodgingDropdownOpen && (
        <>
          <div onClick={() => setLodgingDropdownOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80 }} />
          <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, maxHeight: "60vh", background: "white", borderRadius: 20, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", zIndex: 85, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>🏘 Logements</h3>
              <button onClick={() => setLodgingDropdownOpen(false)} style={{ background: "#f3f4f6", borderRadius: "50%", width: 30, height: 30, fontSize: 16 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              <button onClick={() => { setFilter("all"); setLodgingDropdownOpen(false); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: filter === "all" ? "#f0fdfa" : "white", color: filter === "all" ? "#0d9488" : "#1a1a1a", fontWeight: filter === "all" ? 700 : 500, fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                <span>🌐 Tous les logements</span>
                {filter === "all" && <span style={{ color: "#14b8a6" }}>✓</span>}
              </button>
              {Object.entries(PROPERTY_TYPES).filter(([_, t]) => t.category === "lodging").map(([key, t]) => (
                <button key={key} onClick={() => { setFilter(key); setLodgingDropdownOpen(false); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: filter === key ? "#f0fdfa" : "white", color: filter === key ? "#0d9488" : "#1a1a1a", fontWeight: filter === key ? 700 : 500, fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                  <span>{t.icon} {t.label}</span>
                  {filter === key && <span style={{ color: "#14b8a6" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MENU VÉHICULES */}
      {vehicleDropdownOpen && (
        <>
          <div onClick={() => setVehicleDropdownOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80 }} />
          <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, maxHeight: "60vh", background: "white", borderRadius: 20, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", zIndex: 85, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>🚙 Véhicules</h3>
              <button onClick={() => setVehicleDropdownOpen(false)} style={{ background: "#f3f4f6", borderRadius: "50%", width: 30, height: 30, fontSize: 16 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              <button onClick={() => { setFilter("all"); setVehicleDropdownOpen(false); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: filter === "all" ? "#f0fdfa" : "white", color: filter === "all" ? "#0d9488" : "#1a1a1a", fontWeight: filter === "all" ? 700 : 500, fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                <span>🌐 Tous les véhicules</span>
                {filter === "all" && <span style={{ color: "#14b8a6" }}>✓</span>}
              </button>
              {Object.entries(PROPERTY_TYPES).filter(([_, t]) => t.category === "vehicle").map(([key, t]) => (
                <button key={key} onClick={() => { setFilter(key); setVehicleDropdownOpen(false); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: filter === key ? "#f0fdfa" : "white", color: filter === key ? "#0d9488" : "#1a1a1a", fontWeight: filter === key ? 700 : 500, fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                  <span>{t.icon} {t.label}</span>
                  {filter === key && <span style={{ color: "#14b8a6" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MENU DÉROULANT PAYS → VILLE */}
      {countryDropdownOpen && (() => {
        // Annonces approuvées
        const approvedListings = listings.map(_ => _); // déjà filtrées dans 'listings'
        // Compter par pays
        const byCountry = {};
        listings.forEach(l => { byCountry[l.country] = (byCountry[l.country] || 0) + 1; });
        // Villes pour le pays sélectionné dans le dropdown
        const dropdownCountry = selectedDropdownCountry;
        const citiesForCountry = dropdownCountry ? [...new Set(listings.filter(l => l.country === dropdownCountry).map(l => l.city))].sort() : [];
        const byCity = {};
        if (dropdownCountry) listings.filter(l => l.country === dropdownCountry).forEach(l => { byCity[l.city] = (byCity[l.city] || 0) + 1; });
        
        return (
          <>
            <div onClick={() => { setCountryDropdownOpen(false); setSelectedDropdownCountry(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80 }} />
            <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, maxHeight: "70vh", background: "white", borderRadius: 20, boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", zIndex: 85, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {dropdownCountry ? (
                  <button onClick={() => setSelectedDropdownCountry("")} style={{ background: "transparent", color: "#14b8a6", fontWeight: 700, fontSize: 14 }}>← Retour aux pays</button>
                ) : (
                  <h3 style={{ fontWeight: 800, fontSize: 16 }}>🌍 Choisir un pays</h3>
                )}
                <button onClick={() => { setCountryDropdownOpen(false); setSelectedDropdownCountry(""); }} style={{ background: "#f3f4f6", borderRadius: "50%", width: 30, height: 30, fontSize: 16 }}>×</button>
              </div>

              {/* ÉTAPE 1 : Liste des pays */}
              {!dropdownCountry && (
                <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
                  <button onClick={() => { setCountry("all"); setCountryDropdownOpen(false); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: country === "all" ? "#f0fdfa" : "white", color: country === "all" ? "#0d9488" : "#1a1a1a", fontWeight: country === "all" ? 700 : 500, fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                    <span>🌍 Tous les pays</span>
                    {country === "all" && <span style={{ color: "#14b8a6" }}>✓</span>}
                  </button>
                  {countries.sort().map(c => (
                    <button key={c} onClick={() => setSelectedDropdownCountry(c)} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", color: "#1a1a1a", fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                      <span style={{ fontWeight: 600 }}>{c}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: "#14b8a6", color: "white", borderRadius: 50, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{byCountry[c] || 0}</span>
                        <span style={{ color: "#9ca3af" }}>›</span>
                      </span>
                    </button>
                  ))}
                  {countries.length === 0 && (
                    <p style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 13 }}>Aucun pays disponible</p>
                  )}
                </div>
              )}

              {/* ÉTAPE 2 : Villes du pays choisi */}
              {dropdownCountry && (
                <div style={{ overflowY: "auto", flex: 1 }}>
                  <div style={{ padding: "14px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>PAYS SÉLECTIONNÉ</p>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{dropdownCountry}</p>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    <button onClick={() => { setCountry(dropdownCountry); setSearch(""); setCountryDropdownOpen(false); setSelectedDropdownCountry(""); }} style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white", fontWeight: 700, fontSize: 14, textAlign: "left" }}>
                      <span>🌐 Voir toutes les annonces de ce pays</span>
                      <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 50, padding: "2px 10px", fontSize: 11 }}>{byCountry[dropdownCountry]}</span>
                    </button>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", padding: "16px 18px 8px", letterSpacing: 0.5 }}>OU CHOISIR UNE VILLE</p>
                    {citiesForCountry.map(city => (
                      <button key={city} onClick={() => { setCountry(dropdownCountry); setSearch(city); setCountryDropdownOpen(false); setSelectedDropdownCountry(""); }} style={{ width: "100%", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", color: "#1a1a1a", fontSize: 14, borderBottom: "1px solid #f3f4f6", textAlign: "left" }}>
                        <span style={{ fontWeight: 500 }}>📍 {city}</span>
                        <span style={{ color: "#14b8a6", fontWeight: 700, fontSize: 12 }}>{byCity[city]}</span>
                      </button>
                    ))}
                    {citiesForCountry.length === 0 && (
                      <p style={{ textAlign: "center", padding: 20, color: "#9ca3af", fontSize: 13 }}>Aucune ville disponible</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      <div className="content-wrapper" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {dateFrom && dateTo && (
          <div style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Annonces disponibles du {dateFrom} au {dateTo}</p>
              <p style={{ fontSize: 11, opacity: 0.9 }}>{listings.length} bien{listings.length > 1 ? "s" : ""} libre{listings.length > 1 ? "s" : ""} à ces dates</p>
            </div>
          </div>
        )}
        <div className="listings-grid" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {listings.length === 0 ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#9ca3af" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div><p>{dateFrom && dateTo ? "Aucune annonce disponible à ces dates" : "Aucune annonce trouvée"}</p>{dateFrom && dateTo && <p style={{ fontSize: 12, marginTop: 8 }}>Essayez d'autres dates</p>}</div>
          : listings.map(l => <ListingCard key={l.id} listing={l} onBook={() => setModal({ type: "book", data: l })} onContact={() => setModal({ type: "contactOwner", data: l })} onOpen={() => openDetail(l)} user={user} onToggleFav={onToggleFav} openOwner={openOwner} />)}
        </div>
      </div>
    </div>
  );
}

// ─── OWNER PROFILE PAGE ──────────────────────────────────────────────
function OwnerProfilePage({ ownerId, listings, reviews, bookings, user, setPage, openDetail, setModal, onToggleFav, openOwner }) {
  const users = DB.get("lcy_users");
  const owner = users.find(u => u.id === ownerId);
  if (!owner) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <p>Utilisateur introuvable</p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setPage("home")}>← Retour</button>
      </div>
    );
  }

  const ownerListings = listings.filter(l => l.ownerId === ownerId && l.status === "approved");
  const ownerListingIds = ownerListings.map(l => l.id);
  const ownerReviews = reviews.filter(r => ownerListingIds.includes(r.listingId));
  const ownerBookings = bookings.filter(b => b.ownerId === ownerId).length;
  const ownerBadges = getUserBadges(ownerId);
  const avgRating = ownerReviews.length > 0 ? (ownerReviews.reduce((s, r) => s + r.rating, 0) / ownerReviews.length).toFixed(1) : null;
  const joinedDate = new Date(owner.joined).toLocaleDateString("fr-FR", { year: "numeric", month: "long" });

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={() => setPage("home")} style={{ background: "transparent", padding: "8px 0", fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Retour</button>

      {/* Carte profil */}
      <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: "center" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 36, margin: "0 auto 12px" }}>{owner.name[0]}</div>
        <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{owner.name}</h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>📍 {owner.country}</p>
        <p style={{ color: "#9ca3af", fontSize: 12 }}>Membre depuis {joinedDate}</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16, padding: "14px 0", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
          <div><div className="display" style={{ fontSize: 22, fontWeight: 800, color: "#14b8a6" }}>{ownerListings.length}</div><p style={{ fontSize: 11, color: "#6b7280" }}>Annonces</p></div>
          <div><div className="display" style={{ fontSize: 22, fontWeight: 800, color: "#14b8a6" }}>{ownerBookings}</div><p style={{ fontSize: 11, color: "#6b7280" }}>Réservations</p></div>
          <div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, color: "#14b8a6" }}>{avgRating || "—"}</div>
            <p style={{ fontSize: 11, color: "#6b7280" }}>⭐ Note ({ownerReviews.length})</p>
          </div>
        </div>

        {/* Bouton contacter */}
        {user && user.id !== owner.id && (
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => {
            // Contact via la première annonce de l'owner
            if (ownerListings.length > 0) {
              setModal({ type: "contactOwner", data: ownerListings[0] });
            }
          }}>💬 Contacter {owner.name}</button>
        )}
      </div>

      {/* 🏆 Badges */}
      {ownerBadges.length > 1 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>🏆 Badges ({ownerBadges.length})</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ownerBadges.map(key => {
              const b = ALL_BADGES[key];
              return <span key={key} style={{ background: "white", border: `1.5px solid ${b.color}`, color: b.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 50, display: "inline-flex", alignItems: "center", gap: 4 }}>{b.icon} {b.label}</span>;
            })}
          </div>
        </div>
      )}

      {/* Annonces du propriétaire */}
      <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>📋 Annonces de {owner.name} ({ownerListings.length})</h3>
      {ownerListings.length === 0 ? (
        <Empty icon="📋" msg="Aucune annonce active" />
      ) : (
        <div className="listings-grid" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          {ownerListings.map(l => <ListingCard key={l.id} listing={l} onBook={() => setModal({ type: "book", data: l })} onContact={() => setModal({ type: "contactOwner", data: l })} onOpen={() => openDetail(l)} user={user} onToggleFav={onToggleFav} openOwner={openOwner} />)}
        </div>
      )}

      {/* Tous les avis reçus */}
      {ownerReviews.length > 0 && (
        <>
          <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, marginTop: 8 }}>⭐ Avis reçus ({ownerReviews.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ownerReviews.slice(0, 10).map(r => {
              const listing = listings.find(l => l.id === r.listingId);
              return (
                <div key={r.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>{r.userName[0]}</div>
                      <div><strong style={{ fontSize: 13 }}>{r.userName}</strong><p style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(r.date).toLocaleDateString("fr-FR")}</p></div>
                    </div>
                    <Stars value={r.rating} size={12} />
                  </div>
                  {listing && <p style={{ fontSize: 11, color: "#14b8a6", marginBottom: 4 }}>📋 {listing.title}</p>}
                  <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic" }}>"{r.comment}"</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ListingCard({ listing: l, onBook, onContact, onOpen, user, onToggleFav, openOwner }) {
  const [idx, setIdx] = useState(0);
  const photo = l.photos[idx];
  const isImage = photo && photo.startsWith && photo.startsWith("data:");
  const rating = getListingRating(l.id);
  const fav = user && isFavorite(user.id, l.id);
  return (
    <div className="card" onClick={onOpen} style={{ cursor: "pointer" }}>
      <div
        style={{ height: 200, position: "relative", background: PROPERTY_TYPES[l.type]?.bgGradient || "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}
        onTouchStart={(e) => { e.currentTarget.dataset.touchx = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (l.photos.length <= 1) return;
          const startX = parseFloat(e.currentTarget.dataset.touchx || "0");
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) > 40) {
            e.stopPropagation();
            if (diff < 0) setIdx((idx + 1) % l.photos.length); // glisse gauche → suivant
            else setIdx((idx - 1 + l.photos.length) % l.photos.length); // glisse droite → précédent
          }
        }}
      >
        {isImage ? <img src={photo} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 80 }}>{photo || PROPERTY_TYPES[l.type]?.icon || "🏠"}</span>}
        {/* Flèches de navigation (si plusieurs photos) */}
        {l.photos.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + l.photos.length) % l.photos.length); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 32, height: 32, fontSize: 17, fontWeight: 700, color: "#0a0a0a", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Précédent">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % l.photos.length); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 32, height: 32, fontSize: 17, fontWeight: 700, color: "#0a0a0a", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Suivant">›</button>
          </>
        )}
        {l.photos.length > 1 && <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>{l.photos.map((_, i) => <button key={i} onClick={() => setIdx(i)} style={{ width: 8, height: 8, borderRadius: "50%", border: "none", background: i === idx ? "white" : "rgba(255,255,255,0.5)" }} />)}</div>}
        <span style={{ position: "absolute", top: 12, left: 12, background: "white", borderRadius: 50, padding: "5px 12px", fontSize: 11, fontWeight: 700 }}>{PROPERTY_TYPES[l.type]?.icon} {PROPERTY_TYPES[l.type]?.label}</span>
        <span style={{ position: "absolute", top: 12, right: 50, background: "rgba(0,0,0,0.7)", color: "white", borderRadius: 50, padding: "5px 12px", fontSize: 11, fontWeight: 600 }}>{l.country}</span>
        {/* ❤️ Bouton favoris */}
        <button onClick={(e) => { e.stopPropagation(); onToggleFav(l.id); }} style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          {fav ? "❤️" : "🤍"}
        </button>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, flex: 1, marginRight: 8 }}>{l.title}</h3>
          <div style={{ fontWeight: 800, color: "#14b8a6", whiteSpace: "nowrap" }}>{l.price}€<span style={{ fontWeight: 500, fontSize: 12, color: "#9ca3af" }}>/j</span></div>
        </div>
        {rating.count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <Stars value={rating.avg} size={14} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{rating.avg}</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>({rating.count} avis)</span>
          </div>
        )}
        {l.offerMinDays > 0 && l.offerPrice > 0 && (
          <div style={{ background: "#fef3c7", color: "#92400e", padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 10, display: "inline-block" }}>
            🎁 Offre {l.offerMinDays}+ jours : {l.offerPrice}€/j (au lieu de {l.price}€)
          </div>
        )}
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>📍 {l.city} · {isLodging(l.type) ? `🛏 ${l.rooms} ch · 👥 ${l.guests} pers${l.wifi === true ? " · 📶" : l.wifi === false ? " · 🚫📶" : ""}` : `💺 ${l.seats} pl · ${FUEL_LABELS[l.fuel] || "⛽"}`}</p>
        <p style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.5, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{l.desc}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #f0f0f0", gap: 8 }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>Par <strong onClick={(e) => { e.stopPropagation(); if (openOwner) openOwner(l.ownerId); }} style={{ color: "#14b8a6", cursor: "pointer", textDecoration: "underline" }}>{l.ownerName}</strong></span>
          <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }} onClick={onContact}>💬</button>
          <button className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 13 }} onClick={onBook}>Réserver</button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL PAGE ─────────────────────────────────────────────────────
function DetailPage({ listing: l, user, setPage, setModal, reviews, bookings, messages, sendMessage, markMessagesRead, onToggleFav, openOwner }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const rating = getListingRating(l.id);
  const listingReviews = reviews.filter(r => r.listingId === l.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const ownerBookings = bookings.filter(b => b.ownerId === l.ownerId).length;

  // 💬 Conversation avec le propriétaire (si user connecté et n'est pas le propriétaire)
  const isOwnListing = user && user.id === l.ownerId;
  const canChat = user && !isOwnListing;
  const conversationId = canChat ? getConversationId(l.id, user.id, l.ownerId) : null;
  const conversation = canChat ? messages.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.date) - new Date(b.date)) : [];

  // Marquer comme lus à l'ouverture
  useEffect(() => {
    if (canChat && conversation.some(m => m.toId === user.id && !m.read)) {
      markMessagesRead(conversationId);
    }
  }, [conversationId, conversation.length]);

  const handleSend = () => {
    if (!chatMessage.trim()) return;
    sendMessage(l.id, l.ownerId, l.ownerName, chatMessage);
    setChatMessage("");
  };
  const photo = l.photos[photoIdx];
  const isImage = photo && photo.startsWith && photo.startsWith("data:");

  return (
    <div style={{ padding: "16px" }}>
      {/* Header retour */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setPage("home")} style={{ background: "transparent", padding: "8px 0", color: "#374151", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>← Retour</button>
        <button onClick={() => onToggleFav(l.id)} style={{ background: "#f3f4f6", borderRadius: 50, padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          {user && isFavorite(user.id, l.id) ? "❤️ Favori" : "🤍 Ajouter aux favoris"}
        </button>
      </div>

      {/* Titre + note */}
      <h1 className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{l.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 20, fontSize: 14 }}>
        {rating.count > 0 ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Stars value={rating.avg} size={16} />
            <strong>{rating.avg}</strong>
            <span style={{ color: "#6b7280" }}>· {rating.count} avis</span>
          </span>
        ) : <span style={{ color: "#9ca3af", fontSize: 13 }}>⭐ Pas encore d'avis</span>}
        <span style={{ color: "#6b7280" }}>·</span>
        <span style={{ color: "#374151" }}>📍 {l.city}, {l.country}</span>
      </div>

      {/* Conteneur 2 colonnes sur PC : galerie à gauche, infos à droite */}
      <div className="detail-top-grid">
      {/* Galerie photos : grande image avec flèches + swipe + miniatures */}
      <div className="detail-gallery" style={{ marginBottom: 32 }}>
        {/* Photo principale avec navigation */}
        <div
          className="detail-main-photo"
          style={{ background: PROPERTY_TYPES[l.type]?.bgGradient || "#f3f4f6", height: 460, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", borderRadius: 20, overflow: "hidden" }}
          onClick={() => setShowAllPhotos(true)}
          onTouchStart={(e) => { e.currentTarget.dataset.touchx = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = parseFloat(e.currentTarget.dataset.touchx || "0");
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) {
              e.stopPropagation();
              if (diff < 0) setPhotoIdx((photoIdx + 1) % l.photos.length); // glisse gauche → suivant
              else setPhotoIdx((photoIdx - 1 + l.photos.length) % l.photos.length); // glisse droite → précédent
            }
          }}
        >
          {isImage ? <img src={photo} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 140 }}>{photo || PROPERTY_TYPES[l.type]?.icon || "🏠"}</span>}

          {/* Flèches de navigation (si plusieurs photos) */}
          {l.photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx - 1 + l.photos.length) % l.photos.length); }}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 42, height: 42, fontSize: 20, fontWeight: 700, color: "#0a0a0a", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                aria-label="Photo précédente"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx + 1) % l.photos.length); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 42, height: 42, fontSize: 20, fontWeight: 700, color: "#0a0a0a", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                aria-label="Photo suivante"
              >›</button>
              {/* Compteur */}
              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 12px", borderRadius: 50, fontSize: 13, fontWeight: 600 }}>{photoIdx + 1} / {l.photos.length}</div>
            </>
          )}
        </div>

        {/* Miniatures cliquables en bas */}
        {l.photos.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
            {l.photos.map((p, i) => {
              const isImg = p.startsWith && p.startsWith("data:");
              return (
                <div
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  style={{ flexShrink: 0, width: 70, height: 70, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: photoIdx === i ? "3px solid #14b8a6" : "2px solid #e5e7eb", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {isImg ? <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>{p}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal galerie complète */}
      {showAllPhotos && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 20 }}>
          <button onClick={() => setShowAllPhotos(false)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.2)", color: "white", borderRadius: "50%", width: 40, height: 40, fontSize: 20 }}>×</button>
          <p style={{ color: "white", marginBottom: 16, fontSize: 14 }}>{photoIdx + 1} / {l.photos.length}</p>
          <div style={{ maxWidth: 900, maxHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {l.photos[photoIdx].startsWith && l.photos[photoIdx].startsWith("data:") 
              ? <img src={l.photos[photoIdx]} alt="" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 12 }} />
              : <span style={{ fontSize: 200 }}>{l.photos[photoIdx]}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={() => setPhotoIdx((photoIdx - 1 + l.photos.length) % l.photos.length)} style={{ background: "white", padding: "12px 24px", borderRadius: 50, fontWeight: 600 }}>← Précédent</button>
            <button onClick={() => setPhotoIdx((photoIdx + 1) % l.photos.length)} style={{ background: "white", padding: "12px 24px", borderRadius: 50, fontWeight: 600 }}>Suivant →</button>
          </div>
        </div>
      )}

      {/* Bloc infos à droite de la galerie (sur PC) */}
      <div className="detail-info-side">
        {/* Type + caractéristiques */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
          <div>
            <h2 className="display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{PROPERTY_TYPES[l.type]?.icon} {PROPERTY_TYPES[l.type]?.labelFull || l.type}</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>{isLodging(l.type) ? `${l.rooms} chambre${l.rooms > 1 ? "s" : ""} · ${l.guests} personnes max` : `${l.seats} places`}</p>
          </div>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 22 }}>{l.ownerName[0]}</div>
        </div>

        {/* CARTE RÉSERVATION */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 8px 28px rgba(0,0,0,0.08)", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="display" style={{ fontSize: 26, fontWeight: 800 }}>{l.price}€</span>
            <span style={{ color: "#6b7280", fontSize: 14 }}>/ jour</span>
          </div>
          {rating.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, fontSize: 13 }}>
              <Stars value={rating.avg} size={14} />
              <strong>{rating.avg}</strong>
              <span style={{ color: "#6b7280" }}>· {rating.count} avis</span>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 8 }} onClick={() => user ? setModal({ type: "book", data: l }) : setModal({ type: "login" })}>📅 Réserver maintenant</button>
          <button className="btn btn-ghost" style={{ width: "100%", padding: 12, fontSize: 14 }} onClick={() => user ? setModal({ type: "contactOwner", data: l }) : setModal({ type: "login" })}>💬 Contacter le propriétaire</button>
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 10 }}>🛡 Vous ne paierez rien maintenant · Sécurisé par Locatzy</p>
        </div>
      </div>
      </div>{/* fin detail-top-grid */}

      {/* Grille principale : reste des infos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
        {/* Colonne gauche : infos */}
        <div>
          {/* Description */}
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>À propos de ce bien</h3>
          <p style={{ color: "#374151", fontSize: 15, lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-wrap" }}>{l.desc}</p>

          {/* 📍 LOCALISATION */}
          <div style={{ background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", border: "1px solid #99f6e4", borderRadius: 16, padding: 18, marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "#0f766e" }}>📍 Localisation</h3>
            <p style={{ fontSize: 14, color: "#0d9488", marginBottom: l.mapLink ? 12 : 0 }}>{l.city}, {l.country}</p>
            {l.mapLink && (
              <a href={l.mapLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#14b8a6", color: "white", padding: "12px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                🗺 Voir sur la carte (Maps / Waze)
              </a>
            )}
            {!l.mapLink && (
              <p style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>📌 L'adresse exacte sera communiquée après réservation</p>
            )}
          </div>

          {/* Caractéristiques détaillées */}
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Ce que propose ce bien</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 32 }}>
            {isLodging(l.type) ? (
              <>
                <Feature icon="🛏" label={`${l.rooms} chambre${l.rooms > 1 ? "s" : ""}`} />
                <Feature icon="👥" label={`Jusqu'à ${l.guests} personnes`} />
                <Feature icon={l.wifi === true ? "📶" : l.wifi === false ? "🚫" : "📶"} label={l.wifi === true ? "WiFi inclus" : l.wifi === false ? "Pas de WiFi" : "WiFi (à confirmer)"} />
                <Feature icon={PROPERTY_TYPES[l.type]?.icon || "🏠"} label={PROPERTY_TYPES[l.type]?.labelFull || "Logement"} />
                <Feature icon="📍" label={`${l.city}, ${l.country}`} />
                <Feature icon="💰" label={`${l.price}€ / nuit`} />
              </>
            ) : (
              <>
                <Feature icon="💺" label={`${l.seats} places`} />
                <Feature icon="📍" label={`Disponible à ${l.city}`} />
                <Feature icon="" label={FUEL_LABELS[l.fuel] || "⛽ Carburant non précisé"} />
                <Feature icon="" label={TRANS_LABELS[l.transmission] || "⚙️ Boîte non précisée"} />
                <Feature icon="🌍" label={l.country} />
                <Feature icon="💰" label={`${l.price}€ / jour`} />
              </>
            )}
          </div>

          {/* Propriétaire + Messagerie intégrée */}
          <div style={{ background: "#f9fafb", borderRadius: 18, padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>💬 Contacter le propriétaire</h3>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: canChat || !user ? 18 : 0, cursor: "pointer" }} onClick={() => openOwner(l.ownerId)}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 28 }}>{l.ownerName[0]}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: "#14b8a6" }}>👁 {l.ownerName}</h4>
                <p style={{ color: "#6b7280", fontSize: 13 }}>📊 {ownerBookings} réservation{ownerBookings > 1 ? "s" : ""} sur Locatzy</p>
                <p style={{ color: "#14b8a6", fontSize: 11, fontWeight: 600, marginTop: 2 }}>→ Voir son profil complet</p>
                {/* 🏆 Badges du propriétaire */}
                {(() => {
                  const ownerBadges = getUserBadges(l.ownerId);
                  if (ownerBadges.length <= 1) return null;
                  return (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {ownerBadges.slice(0, 4).map(key => {
                        const b = ALL_BADGES[key];
                        return <span key={key} title={b.label} style={{ background: "white", border: `1.5px solid ${b.color}`, color: b.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 50, display: "inline-flex", alignItems: "center", gap: 3 }}>{b.icon} {b.label}</span>;
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Cas 1 : pas connecté */}
            {!user && (
              <div style={{ background: "white", border: "1px dashed #d1d5db", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12 }}>Connectez-vous pour envoyer un message au propriétaire.</p>
                <button className="btn btn-primary" onClick={() => setModal({ type: "login" })}>Se connecter</button>
              </div>
            )}

            {/* Cas 2 : c'est ma propre annonce */}
            {isOwnListing && (
              <div style={{ background: "white", borderRadius: 12, padding: 16, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
                😊 C'est votre annonce. Consultez vos messages reçus dans <button onClick={() => setPage("messages")} style={{ background: "none", color: "#14b8a6", fontWeight: 700 }}>💬 Messages</button>
              </div>
            )}

            {/* Cas 3 : chat intégré */}
            {canChat && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {/* Historique des messages */}
                <div style={{ maxHeight: 320, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "#fafafa" }}>
                  {conversation.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                      <p style={{ fontSize: 13 }}>Aucun message échangé.</p>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Posez vos questions au propriétaire ci-dessous.</p>
                    </div>
                  ) : conversation.map(m => (
                    <div key={m.id} style={{ alignSelf: m.fromId === user.id ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                      <div style={{ background: m.fromId === user.id ? "#14b8a6" : "white", color: m.fromId === user.id ? "white" : "#1a1a1a", padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.4, border: m.fromId === user.id ? "none" : "1px solid #e5e7eb" }}>
                        {m.text}
                      </div>
                      <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, textAlign: m.fromId === user.id ? "right" : "left" }}>{m.fromId === user.id ? "Vous" : m.fromName} · {new Date(m.date).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</p>
                    </div>
                  ))}
                </div>

                {/* Input message */}
                <div style={{ borderTop: "1px solid #e5e7eb", padding: 12, display: "flex", gap: 8, background: "white" }}>
                  <input className="input" placeholder={conversation.length === 0 ? "Bonjour, j'aimerais avoir plus d'infos…" : "Tapez votre message…"} value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} style={{ flex: 1 }} />
                  <button className="btn btn-primary" style={{ padding: "12px 18px" }} onClick={handleSend} disabled={!chatMessage.trim()}>📤 Envoyer</button>
                </div>
              </div>
            )}
          </div>

          {/* Avis */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>
                {rating.count > 0 ? <>⭐ {rating.avg} · {rating.count} avis</> : "⭐ Avis"}
              </h3>
            </div>

            {/* Bannière : laisser un avis si séjour terminé */}
            {(() => {
              if (!user) return null;
              const today = new Date(); today.setHours(0,0,0,0);
              const myFinishedBookings = bookings.filter(b => 
                b.renterId === user.id && 
                b.listingId === l.id && 
                new Date(b.to) <= today
              );
              const alreadyReviewed = reviews.some(r => r.userId === user.id && r.listingId === l.id);
              if (myFinishedBookings.length === 0 || alreadyReviewed) return null;
              const lastStay = myFinishedBookings[myFinishedBookings.length - 1];
              return (
                <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1px solid #fcd34d", borderRadius: 16, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 38 }}>⭐</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 800, color: "#78350f", fontSize: 16, marginBottom: 4 }}>Comment s'est passé votre séjour ?</h4>
                    <p style={{ color: "#92400e", fontSize: 13 }}>Vous avez séjourné du {lastStay.from} au {lastStay.to}. Partagez votre expérience pour aider les futurs locataires.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setModal({ type: "review", data: { listingId: l.id, listingTitle: l.title } })}>✍️ Laisser un avis</button>
                </div>
              );
            })()}

            {/* Message d'attente si réservation à venir */}
            {(() => {
              if (!user) return null;
              const today = new Date(); today.setHours(0,0,0,0);
              const upcoming = bookings.find(b => 
                b.renterId === user.id && 
                b.listingId === l.id && 
                new Date(b.to) > today
              );
              if (!upcoming) return null;
              const alreadyReviewed = reviews.some(r => r.userId === user.id && r.listingId === l.id);
              if (alreadyReviewed) return null;
              return (
                <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>📅</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#0f766e", fontSize: 14 }}>Réservation en cours</p>
                    <p style={{ color: "#0d9488", fontSize: 12 }}>Du {upcoming.from} au {upcoming.to} · Vous pourrez laisser un avis après le {upcoming.to}</p>
                  </div>
                </div>
              );
            })()}

            {/* Confirmation si déjà laissé un avis */}
            {(() => {
              const myReview = user && reviews.find(r => r.userId === user.id && r.listingId === l.id);
              if (!myReview) return null;
              return (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 26 }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>Merci pour votre avis !</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Stars value={myReview.rating} size={12} />
                      <span style={{ color: "#16a34a", fontSize: 12, fontStyle: "italic" }}>"{myReview.comment}"</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {listingReviews.length === 0 ? (
              <div style={{ background: "#f9fafb", borderRadius: 16, padding: 30, textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
                <p style={{ fontSize: 14 }}>Aucun avis pour le moment.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à laisser un avis après votre séjour !</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {listingReviews.slice(0, 6).map(r => (
                  <div key={r.id} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 16, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>{r.userName[0]}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{r.userName}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(r.date).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <Stars value={r.rating} size={13} />
                    <p style={{ marginTop: 8, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
            {listingReviews.length > 6 && (
              <p style={{ marginTop: 14, textAlign: "center", color: "#6b7280", fontSize: 13 }}>Et {listingReviews.length - 6} autre{listingReviews.length - 6 > 1 ? "s" : ""} avis</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </div>
  );
}


function Stars({ value, size = 16, onChange = null }) {
  return (
    <div style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={() => onChange && onChange(n)} style={{ cursor: onChange ? "pointer" : "default", color: n <= value ? "#fbbf24" : "#e5e7eb", fontSize: size, lineHeight: 1, userSelect: "none" }}>★</span>
      ))}
    </div>
  );
}

// ─── MY PAGE ─────────────────────────────────────────────────────────
function MyPage({ myListings, myBookingsAsRenter, bookingsOnMyListings, setModal, reviews, user, confirmExchange, requestPayout, setPage }) {
  const [tab, setTab] = useState("listings");
  const totalEarnings = bookingsOnMyListings.reduce((s, b) => s + b.ownerEarnings, 0);

  // Trouver les réservations terminées (date départ passée) où l'user n'a pas encore noté
  const today = new Date(); today.setHours(0,0,0,0);
  // Peut-on confirmer l'échange ? (à partir du jour d'arrivée)
  const canConfirm = (b) => { const arrivee = new Date(b.from); arrivee.setHours(0,0,0,0); return today >= arrivee; };
  const reviewable = myBookingsAsRenter.filter(b => {
    if (new Date(b.to) > today) return false;
    return !reviews.find(r => r.userId === user.id && r.listingId === b.listingId);
  });

  return (
    <div style={{ padding: "16px" }}>
      <h2 className="display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Mon espace</h2>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>Gérez vos annonces, vos réservations et suivez vos gains.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
        <div className="card" style={{ padding: 22 }}><div style={{ fontSize: 13, color: "#6b7280" }}>📋 Mes annonces</div><div className="display" style={{ fontSize: 32, fontWeight: 800 }}>{myListings.length}</div></div>
        <div className="card" style={{ padding: 22 }}><div style={{ fontSize: 13, color: "#6b7280" }}>📅 Réservations reçues</div><div className="display" style={{ fontSize: 32, fontWeight: 800 }}>{bookingsOnMyListings.length}</div></div>
        <div className="card" style={{ padding: 22, background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white", border: "none" }}><div style={{ fontSize: 13, opacity: 0.9 }}>💰 Mes gains</div><div className="display" style={{ fontSize: 32, fontWeight: 800 }}>{totalEarnings.toFixed(2)}€</div></div>
      </div>

      {reviewable.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: "#92400e", marginBottom: 10 }}>⭐ Vous avez {reviewable.length} séjour{reviewable.length > 1 ? "s" : ""} à noter</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewable.map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 14 }}>{b.listingTitle} · {b.from} → {b.to}</span>
                <button className="btn btn-accent" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setModal({ type: "review", data: { listingId: b.listingId, listingTitle: b.listingTitle } })}>Laisser un avis</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button className={`pill ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>📋 Mes annonces ({myListings.length})</button>
        <button className={`pill ${tab === "received" ? "active" : ""}`} onClick={() => setTab("received")}>📥 Reçues ({bookingsOnMyListings.length})</button>
        <button className={`pill ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>🎫 Mes réservations ({myBookingsAsRenter.length})</button>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setModal({ type: "add" })}>+ Nouvelle annonce</button>
      </div>

      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {myListings.length === 0 ? <Empty icon="📋" msg="Aucune annonce" /> : myListings.map(l => {
            const photo = l.photos[0];
            const isImg = photo && photo.startsWith && photo.startsWith("data:");
            const r = getListingRating(l.id);
            return (
              <div key={l.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div className="photo-thumb">{isImg ? <img src={photo} alt="" /> : <span style={{ fontSize: 32 }}>{photo}</span>}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700 }}>{l.title}</h3>
                    <p style={{ color: "#6b7280", fontSize: 13 }}>📍 {l.city}, {l.country} · {l.price}€/j</p>
                    {r.count > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><Stars value={r.avg} size={12} /><span style={{ fontSize: 12, color: "#6b7280" }}>{r.avg} ({r.count})</span></div>}
                  </div>
                  <Status status={l.status} />
                </div>
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12, border: "2px solid #14b8a6", color: "#0d9488", fontWeight: 700 }} onClick={() => setModal({ type: "edit", data: l })}>✏️ Modifier cette annonce</button>
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8, border: "2px solid #f59e0b", color: "#d97706", fontWeight: 700 }} onClick={() => setModal({ type: "availability", data: l })}>📅 Gérer les disponibilités</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "received" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bookingsOnMyListings.length === 0 ? <Empty icon="📥" msg="Aucune réservation reçue" /> : bookingsOnMyListings.map(b => (
            <div key={b.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{b.listingTitle}</h3>
                  <p style={{ color: "#0a0a0a", fontSize: 14, fontWeight: 600 }}>👤 {b.renterName} ({b.renterEmail})</p>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>📅 {b.from} → {b.to} ({b.days}j)</p>
                </div>
                <Status status={b.status} />
              </div>
              <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <div><span style={{ color: "#6b7280" }}>Total :</span> <strong>{b.subtotal}€</strong></div>
                <div><span style={{ color: "#6b7280" }}>Commission 15% :</span> <strong>-{b.commission}€</strong></div>
                <div><span style={{ color: "#0d9488" }}>💰 Gains :</span> <strong style={{ color: "#0d9488", fontSize: 16 }}>{b.ownerEarnings}€</strong></div>
              </div>
              {/* 🤝 Confirmation d'échange côté propriétaire */}
              {canConfirm(b) && (
                <div style={{ marginTop: 12 }}>
                  {b.ownerConfirmed ? (
                    <div style={{ textAlign: "center", padding: 10, background: "#d1fae5", borderRadius: 10, color: "#065f46", fontWeight: 700, fontSize: 13 }}>
                      ✅ Vous avez confirmé la remise{b.renterConfirmed ? " · Échange validé des deux côtés ✓✓" : " · En attente du locataire"}
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg,#14b8a6,#0d9488)" }} onClick={() => confirmExchange(b, "owner")}>🔑 Confirmer la remise des clés / du bien</button>
                  )}
                </div>
              )}
              {/* 💰 Demander le versement : apparaît dès que le LOCATAIRE a confirmé avoir reçu */}
              {b.renterConfirmed && (
                <div style={{ marginTop: 10 }}>
                  {b.payoutRequested ? (
                    <div style={{ textAlign: "center", padding: 10, background: "#fef3c7", borderRadius: 10, color: "#92400e", fontWeight: 700, fontSize: 13 }}>
                      💸 Versement demandé — en cours de traitement
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#d97706)" }} onClick={() => requestPayout(b)}>💰 Demander le versement de mes gains ({b.ownerEarnings}€)</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {myBookingsAsRenter.length === 0 ? <Empty icon="🎫" msg="Aucune réservation" /> : myBookingsAsRenter.map(b => (
            <div key={b.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{b.listingTitle}</h3>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>👤 Propriétaire : {b.ownerName}</p>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>📅 {b.from} → {b.to}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="display" style={{ fontWeight: 800, fontSize: 22, color: "#14b8a6" }}>{b.total}€</div>
                  <Status status={b.status} />
                </div>
              </div>
              {/* 🤝 Confirmation d'échange côté locataire */}
              {canConfirm(b) && (
                <div style={{ marginTop: 12 }}>
                  {b.renterConfirmed ? (
                    <div style={{ textAlign: "center", padding: 10, background: "#d1fae5", borderRadius: 10, color: "#065f46", fontWeight: 700, fontSize: 13 }}>
                      ✅ Vous avez confirmé la récupération{b.ownerConfirmed ? " · Échange validé des deux côtés ✓✓" : " · En attente du propriétaire"}
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg,#14b8a6,#0d9488)" }} onClick={() => confirmExchange(b, "renter")}>🏠 J'ai bien récupéré ma réservation</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MESSAGES PAGE ───────────────────────────────────────────────────
function MessagesPage({ user, messages, listings, users, setModal, markMessagesRead }) {
  // Grouper par conversationId
  const conversations = {};
  messages.forEach(m => {
    if (!conversations[m.conversationId]) conversations[m.conversationId] = [];
    conversations[m.conversationId].push(m);
  });
  // Trier par dernier message
  const sortedConvs = Object.entries(conversations).map(([id, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const last = sorted[0];
    const otherId = last.fromId === user.id ? last.toId : last.fromId;
    const otherName = last.fromId === user.id ? last.toName : last.fromName;
    const listing = listings.find(l => l.id === last.listingId);
    const unread = msgs.filter(m => m.toId === user.id && !m.read).length;
    return { id, last, otherId, otherName, listing, unread, msgs };
  }).sort((a, b) => new Date(b.last.date) - new Date(a.last.date));

  return (
    <div style={{ padding: "16px" }}>
      <h2 className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>💬 Messages</h2>
      {sortedConvs.length === 0 ? <Empty icon="💬" msg="Aucun message pour le moment" /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedConvs.map(c => (
            <div key={c.id} onClick={() => { markMessagesRead(c.id); setModal({ type: "chat", data: { conversationId: c.id, otherId: c.otherId, otherName: c.otherName, listing: c.listing } }); }} className="card" style={{ padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>{c.otherName[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 14 }}>{c.otherName}</h4>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(c.last.date).toLocaleDateString("fr-FR")}</span>
                </div>
                {c.listing && <p style={{ fontSize: 11, color: "#14b8a6", fontWeight: 600, marginBottom: 3 }}>📋 {c.listing.title}</p>}
                <p style={{ fontSize: 13, color: "#6b7280", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.last.fromId === user.id ? "Vous : " : ""}{c.last.text}</p>
              </div>
              {c.unread > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 50, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{c.unread}</span>}
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── NOTIF ───────────────────────────────────────────────────────────
function NotifPage({ notifications, goToNotif }) {
  return (
    <div style={{ padding: "16px" }}>
      <h2 className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>🔔 Notifications</h2>
      {notifications.length === 0 ? <Empty icon="🔔" msg="Aucune notification" /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map(n => (
            <div key={n.id} onClick={() => goToNotif(n)} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, opacity: n.read ? 0.7 : 1, cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <div style={{ fontSize: 24 }}>{n.type === "new_booking" ? "🎉" : n.type === "commission" ? "💰" : n.type === "moderation" ? "⏳" : n.type === "review" ? "⭐" : n.type === "message" ? "💬" : n.type === "payout" ? "💸" : n.type === "payout_done" ? "✅" : n.type === "exchange" || n.type === "exchange_done" ? "🔑" : "✓"}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{new Date(n.date).toLocaleString("fr-FR")}</p>
              </div>
              <span style={{ color: "#9ca3af", fontSize: 18 }}>›</span>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6" }} />}
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── ADMIN ───────────────────────────────────────────────────────────
function Admin({ listings, bookings, users, approveListing, rejectListing, deleteListing, deleteUser, reviews, payouts, markPayoutPaid }) {
  const [tab, setTab] = useState("dashboard");
  const pending = listings.filter(l => l.status === "pending");
  const totalRevenue = bookings.reduce((s, b) => s + b.subtotal, 0);
  const myCommission = bookings.reduce((s, b) => s + b.commission, 0);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0a0a0a", color: "white", padding: "6px 16px", borderRadius: 50, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>⚡ ADMINISTRATEUR</div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 800 }}>Tableau de bord Locatzy</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24, background: "linear-gradient(135deg,#0a0a0a,#1a1a1a)", color: "white", border: "none" }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>💰 VOS COMMISSIONS (15%)</div>
          <div className="display" style={{ fontSize: 38, fontWeight: 800, color: "#14b8a6" }}>{myCommission.toFixed(2)}€</div>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Sur {totalRevenue.toFixed(2)}€ de transactions</p>
        </div>
        {[["📋","Annonces",listings.length],["👥","Users",users.length],["📅","Réservations",bookings.length],["⭐","Avis",reviews.length]].map(([i,l,v]) => (
          <div key={l} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 20 }}>{i}</div>
            <div className="display" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[["dashboard","📊 Vue d'ensemble"],["pending",`⏳ À modérer (${pending.length})`],["bookings","💰 Réservations"],["payouts",`💸 Versements (${payouts.filter(p => p.status === "pending").length})`],["listings","📋 Annonces"],["users","👥 Users"],["reviews",`⭐ Avis (${reviews.length})`]].map(([v,l]) => <button key={v} className={`pill ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>{l}</button>)}
      </div>

      {tab === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔥 Dernières réservations</h3>
            {bookings.slice(-5).reverse().map(b => (
              <div key={b.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 14 }}>{b.listingTitle}</strong>
                  <span style={{ color: "#14b8a6", fontWeight: 700 }}>+{b.commission}€</span>
                </div>
                <p style={{ fontSize: 12, color: "#6b7280" }}>{b.renterName} → {b.ownerName}</p>
              </div>
            ))}
            {bookings.length === 0 && <p style={{ color: "#9ca3af", fontSize: 14, padding: 12 }}>Aucune réservation</p>}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⏳ À modérer ({pending.length})</h3>
            {pending.length === 0 ? <p style={{ color: "#9ca3af", padding: 12 }}>✅ Tout est à jour</p> : pending.slice(0,5).map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 24 }}>{PROPERTY_TYPES[l.type] && PROPERTY_TYPES[l.type].icon || "🏠"}</span>
                <div style={{ flex: 1 }}><strong style={{ fontSize: 14 }}>{l.title}</strong><p style={{ fontSize: 12, color: "#6b7280" }}>{l.ownerName} · {l.city}</p></div>
                <button className="btn btn-accent" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => approveListing(l.fbId)}>✓</button>
                <button className="btn" style={{ background: "#fee2e2", color: "#dc2626", padding: "6px 14px", fontSize: 12 }} onClick={() => rejectListing(l.fbId)}>✗</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pending.length === 0 ? <Empty icon="✅" msg="Tout est à jour" /> : pending.map(l => {
            const photo = l.photos[0];
            const isImg = photo && photo.startsWith && photo.startsWith("data:");
            return (
              <div key={l.id} className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
                <div className="photo-thumb" style={{ width: 100, height: 100 }}>{isImg ? <img src={photo} alt="" /> : <span style={{ fontSize: 40 }}>{photo}</span>}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700 }}>{l.title}</h4>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>📍 {l.city}, {l.country} · {l.price}€/j</p>
                  <p style={{ color: "#9ca3af", fontSize: 12 }}>👤 {l.ownerName} ({l.ownerEmail})</p>
                </div>
                <button className="btn btn-accent" onClick={() => approveListing(l.fbId)}>✓ Approuver</button>
                <button className="btn btn-ghost" style={{ borderColor: "#fecaca", color: "#dc2626" }} onClick={() => rejectListing(l.fbId)}>✗ Refuser</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "bookings" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", borderRadius: 18, padding: 24, color: "white", marginBottom: 20 }}>
            <p style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>TOTAL COMMISSIONS (15%)</p>
            <div className="display" style={{ fontSize: 32, fontWeight: 800 }}>{myCommission.toFixed(2)}€</div>
            <p style={{ fontSize: 13, opacity: 0.9 }}>sur {bookings.length} réservation{bookings.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookings.length === 0 ? <Empty icon="💰" msg="Aucune réservation" /> : [...bookings].reverse().map(b => (
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{PROPERTY_TYPES[b.listingType] && PROPERTY_TYPES[b.listingType].icon || "🏠"} {b.listingTitle}</h4>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>📅 {b.from} → {b.to} · {b.renterName} → {b.ownerName}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
                  <div><p style={{ fontSize: 11, color: "#6b7280" }}>Total</p><p className="display" style={{ fontWeight: 700, fontSize: 18 }}>{b.subtotal}€</p></div>
                  <div><p style={{ fontSize: 11, color: "#6b7280" }}>Propriétaire</p><p className="display" style={{ fontWeight: 700, fontSize: 18, color: "#3b82f6" }}>{b.ownerEarnings}€</p></div>
                  <div><p style={{ fontSize: 11, color: "#0d9488", fontWeight: 700 }}>💰 COMMISSION</p><p className="display" style={{ fontWeight: 800, fontSize: 22, color: "#0d9488" }}>{b.commission}€</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {payouts.length === 0 ? <Empty icon="💸" msg="Aucune demande de versement" /> : [...payouts].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)).map(p => (
            <div key={p.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{p.ownerName}</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>📋 {p.listingTitle}</p>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>📧 {p.ownerEmail}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="display" style={{ fontWeight: 800, fontSize: 22, color: "#f59e0b" }}>{p.amount}€</div>
                  <span className="badge" style={{ background: p.status === "paid" ? "#d1fae5" : "#fef3c7", color: p.status === "paid" ? "#065f46" : "#92400e" }}>{p.status === "paid" ? "✓ PAYÉ" : "⏳ À VERSER"}</span>
                </div>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 10 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>💳 Coordonnées de versement :</p>
                <p>👤 {p.paymentInfo?.fullName}</p>
                {p.paymentInfo?.method === "rib" ? (
                  <p>🏦 RIB : <strong>{p.paymentInfo?.rib}</strong></p>
                ) : (
                  <p>💵 Wafacash : <strong>{p.paymentInfo?.wafacash}</strong></p>
                )}
              </div>
              {p.status !== "paid" && (
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => markPayoutPaid(p)}>✅ Marquer comme payé</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listings.map(l => (
            <div key={l.id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 24 }}>{PROPERTY_TYPES[l.type] && PROPERTY_TYPES[l.type].icon || "🏠"}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: 14 }}>{l.title}</h4>
                <p style={{ color: "#6b7280", fontSize: 12 }}>📍 {l.city}, {l.country} · {l.ownerName}</p>
              </div>
              <Status status={l.status} />
              {l.status === "pending" && <button className="btn btn-accent" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => approveListing(l.fbId)}>✓</button>}
              <button className="btn" style={{ background: "#fee2e2", color: "#dc2626", padding: "6px 12px", fontSize: 12 }} onClick={() => deleteListing(l.fbId)}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: u.role === "admin" ? "#0a0a0a" : "linear-gradient(135deg,#14b8a6,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>{u.name[0]}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700 }}>{u.name} {u.role === "admin" && <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 50, fontWeight: 700 }}>ADMIN</span>}</h4>
                <p style={{ color: "#6b7280", fontSize: 13 }}>{u.email} · {u.country}</p>
              </div>
              {u.role !== "admin" && <button className="btn" style={{ background: "#fee2e2", color: "#dc2626", padding: "6px 14px", fontSize: 12 }} onClick={() => deleteUser(u.id)}>🗑</button>}
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.length === 0 ? <Empty icon="⭐" msg="Aucun avis" /> : [...reviews].reverse().map(r => {
            const listing = listings.find(l => l.id === r.listingId);
            return (
              <div key={r.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 14 }}>{listing?.title || "Annonce supprimée"}</h4>
                    <p style={{ fontSize: 12, color: "#6b7280" }}>Par {r.userName} · {new Date(r.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p style={{ fontSize: 14, color: "#374151", marginTop: 8, fontStyle: "italic" }}>"{r.comment}"</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────


function Modal({ modal, setModal, login, register, verifyEmailCode, resendVerifyCode, sendResetCode, resetPassword, addListing, updateListing, updateBlockedDates, book, payerAvecStripe, user, setPage, setCountry, setSearch, setFilter, listings, reviews, messages, sendMessage, addReview, markMessagesRead, bookings, flash }) {
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState([]);
  const [formError, setFormError] = useState("");
  const set = (k, v) => { setFormError(""); setForm(f => ({ ...f, [k]: v })); };

  // 🔥 Pré-remplir les champs avec les infos utilisateur à l'ouverture de bookingInfo
  useEffect(() => {
    if (modal?.type === "bookingInfo" && user) {
      setForm(f => ({
        ...f,
        fullName: f.fullName || user.name || "",
        bookingEmail: f.bookingEmail || user.email || "",
      }));
    }
    // ✏️ Pré-remplir le formulaire avec l'annonce à modifier
    if (modal?.type === "edit" && modal.data) {
      const l = modal.data;
      setForm({ type: l.type, title: l.title, country: l.country, city: l.city, price: l.price, desc: l.desc, mapLink: l.mapLink || "", offerMinDays: l.offerMinDays || "", offerPrice: l.offerPrice || "", rooms: l.rooms || "", guests: l.guests || "", wifi: l.wifi, seats: l.seats || "", fuel: l.fuel || "", transmission: l.transmission || "", cc: l.cc || "" });
      // Pré-charger les photos existantes (sauf si c'est juste un emoji par défaut)
      setPhotos(Array.isArray(l.photos) && l.photos.length > 0 && l.photos[0].startsWith("data:") ? l.photos : []);
    }
  }, [modal?.type, user]);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(p => [...p, ev.target.result].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  const close = () => setModal(null);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <button onClick={close} style={{ position: "absolute", top: 18, right: 18, background: "#f3f4f6", borderRadius: "50%", width: 34, height: 34, fontSize: 18, fontWeight: 600, zIndex: 5 }}>×</button>

        {modal.type === "explore" && (() => {
          const approved = listings.filter(l => l.status === "approved");
          const byCountry = {};
          approved.forEach(l => { byCountry[l.country] = (byCountry[l.country] || 0) + 1; });
          const sortedCountries = Object.keys(byCountry).sort((a, b) => byCountry[b] - byCountry[a]);
          const sel = form.exploreCountry;
          const cities = sel ? [...new Set(approved.filter(l => l.country === sel).map(l => l.city))].sort() : [];
          const byCity = {};
          if (sel) approved.filter(l => l.country === sel).forEach(l => { byCity[l.city] = (byCity[l.city] || 0) + 1; });
          return (
            <>
              <h2 className="display" style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>🌍 Explorer le monde</h2>
              <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>Choisissez votre destination.</p>
              {!sel && (sortedCountries.length === 0 ? <Empty icon="🌍" msg="Aucune annonce disponible" /> :
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
                  {sortedCountries.map(c => (
                    <button key={c} onClick={() => set("exploreCountry", c)} style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{c}</span>
                      <span style={{ background: "#14b8a6", color: "white", borderRadius: 50, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{byCountry[c]}</span>
                    </button>
                  ))}
                </div>
              )}
              {sel && (
                <>
                  <button onClick={() => set("exploreCountry", "")} style={{ background: "transparent", color: "#14b8a6", fontWeight: 600, fontSize: 14, marginBottom: 14 }}>← Changer</button>
                  <h3 style={{ fontWeight: 700, marginBottom: 14 }}>{sel}</h3>
                  <button onClick={() => { setCountry(sel); setSearch(""); setFilter("all"); setPage("home"); setModal(null); }} style={{ width: "100%", background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white", borderRadius: 14, padding: 14, fontWeight: 700, marginBottom: 14 }}>🌐 Voir toutes ({byCountry[sel]})</button>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>OU CHOISIR UNE VILLE</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "40vh", overflowY: "auto" }}>
                    {cities.map(city => (
                      <button key={city} onClick={() => { setCountry(sel); setSearch(city); setFilter("all"); setPage("home"); setModal(null); }} style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", textAlign: "left" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>📍 {city}</span>
                        <span style={{ color: "#14b8a6", fontWeight: 700, fontSize: 12 }}>{byCity[city]}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}

        {modal.type === "login" && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Bon retour 👋</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>Connectez-vous à votre compte</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="📧 Email" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
              <input className="input" placeholder="🔒 Mot de passe" type="password" value={form.password || ""} onChange={e => set("password", e.target.value)} />
              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}
              <button className="btn btn-primary" onClick={() => {
                if (!form.email) return setFormError("Email obligatoire");
                if (!form.password) return setFormError("Mot de passe obligatoire");
                login(form.email, form.password);
              }}>Se connecter</button>
              <p style={{ textAlign: "center", fontSize: 13 }}><button style={{ background: "none", color: "#14b8a6", fontWeight: 600 }} onClick={() => setModal({ type: "forgotPassword" })}>Mot de passe oublié ?</button></p>
              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>Pas de compte ? <button style={{ background: "none", color: "#14b8a6", fontWeight: 600 }} onClick={() => setModal({ type: "register" })}>S'inscrire</button></p>
            </div>
          </>
        )}

        {modal.type === "forgotPassword" && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Mot de passe oublié 🔑</h2>
            <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>{form.codeSent ? "Entrez le code reçu par email + votre nouveau mot de passe" : "Entrez votre email pour recevoir un code"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="📧 Votre email" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} disabled={form.codeSent} />

              {form.codeSent && (
                <>
                  <input className="input" placeholder="Code à 5 chiffres" inputMode="numeric" maxLength={5} value={form.resetCode || ""} onChange={e => set("resetCode", e.target.value.replace(/\D/g, ""))} style={{ textAlign: "center", fontSize: 22, letterSpacing: 6, fontWeight: 700 }} />
                  <input className="input" placeholder="🔒 Nouveau mot de passe" type="password" value={form.newPassword || ""} onChange={e => set("newPassword", e.target.value)} />
                  <input className="input" placeholder="🔒 Confirmer le mot de passe" type="password" value={form.confirmPassword || ""} onChange={e => set("confirmPassword", e.target.value)} />
                </>
              )}

              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}

              {!form.codeSent ? (
                <button className="btn btn-primary" onClick={() => {
                  if (!form.email) return setFormError("Email obligatoire");
                  const code = sendResetCode(form.email);
                  if (code) { set("codeSent", true); setFormError(""); }
                  else setFormError("Aucun compte avec cet email");
                }}>Envoyer le code</button>
              ) : (
                <button className="btn btn-primary" onClick={async () => {
                  if (!form.resetCode) return setFormError("Code obligatoire");
                  if (!form.newPassword) return setFormError("Nouveau mot de passe obligatoire");
                  if (form.newPassword.length < 6) return setFormError("Mot de passe trop court (min 6)");
                  if (form.newPassword !== form.confirmPassword) return setFormError("Les mots de passe ne correspondent pas");
                  const ok = await resetPassword(form.email, form.resetCode, form.newPassword);
                  if (ok) { setForm({}); setModal({ type: "login" }); }
                  else setFormError("Code incorrect ou expiré");
                }}>Changer le mot de passe</button>
              )}

              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}><button style={{ background: "none", color: "#14b8a6", fontWeight: 600 }} onClick={() => { setForm({}); setModal({ type: "login" }); }}>← Retour à la connexion</button></p>
            </div>
          </>
        )}

        {modal.type === "register" && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Rejoindre Locatzy ✨</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="Nom complet" value={form.name || ""} onChange={e => set("name", e.target.value)} />
              <input className="input" placeholder="📧 Email" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
              <select className="input" value={form.country || ""} onChange={e => set("country", e.target.value)}>
                <option value="">— Choisir votre pays —</option>
                {Object.keys(COUNTRIES).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input" placeholder="🔒 Mot de passe" type="password" value={form.password || ""} onChange={e => set("password", e.target.value)} />
              <input className="input" placeholder="🔒 Confirmer le mot de passe" type="password" value={form.confirmPassword || ""} onChange={e => set("confirmPassword", e.target.value)} />
              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}
              <button className="btn btn-primary" onClick={() => {
                if (!form.name) return setFormError("Nom obligatoire");
                if (!form.email) return setFormError("Email obligatoire");
                if (!/\S+@\S+\.\S+/.test(form.email)) return setFormError("Email invalide");
                if (!form.country) return setFormError("Pays obligatoire");
                if (!form.password) return setFormError("Mot de passe obligatoire");
                if (form.password.length < 6) return setFormError("Mot de passe trop court (min 6 caractères)");
                if (form.password !== form.confirmPassword) return setFormError("Les mots de passe ne correspondent pas");
                const res = register({
                  name: form.name,
                  email: form.email,
                  phone: "",
                  country: form.country,
                  password: form.password,
                });
                if (res && !res.ok) return setFormError(res.error);
                setForm({});
              }}>Créer mon compte</button>
              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>Déjà inscrit ? <button style={{ background: "none", color: "#14b8a6", fontWeight: 600 }} onClick={() => setModal({ type: "login" })}>Connexion</button></p>
            </div>
          </>
        )}

        {modal.type === "verifyEmail" && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Vérifiez votre email 📧</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>Nous avons envoyé un code à 5 chiffres à <strong>{modal.data?.email}</strong>. Entrez-le ci-dessous pour activer votre compte.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="Code à 5 chiffres" inputMode="numeric" maxLength={5} value={form.code || ""} onChange={e => set("code", e.target.value.replace(/[^0-9]/g, ""))} style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }} />
              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={async () => {
                if (!form.code || form.code.length !== 5) return setFormError("Entrez les 5 chiffres du code");
                const res = await verifyEmailCode(modal.data.email, form.code);
                if (res && !res.ok) return setFormError(res.error);
              }}>✅ Activer mon compte</button>
              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>Pas reçu le code ? <button style={{ background: "none", color: "#14b8a6", fontWeight: 600 }} onClick={() => { const res = resendVerifyCode(modal.data.email); if (res && !res.ok) setFormError(res.error); else setFormError(""); }}>Renvoyer le code</button></p>
              <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}><button style={{ background: "none", color: "#9ca3af", fontWeight: 600 }} onClick={() => { setForm({}); setFormError(""); setModal({ type: "register" }); }}>← Modifier mon email</button></p>
            </div>
          </>
        )}

        {modal.type === "add" && !user && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Connexion requise</h2>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setModal({ type: "login" })}>Se connecter</button>
          </>
        )}

        {(modal.type === "add" || modal.type === "edit") && user && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>{modal.type === "edit" ? "✏️ Modifier l'annonce" : "📝 Publier une annonce"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Type *</label>
                <select className="input" value={form.type || ""} onChange={e => set("type", e.target.value)}>
                  <option value="">— Choisir —</option>
                  <option value="apartment">🏠 Appartement</option>
                  <option value="house">🏡 Villa / Maison</option>
                  <option value="hotel">🏨 Hôtel</option>
                  <option value="car">🚗 Voiture</option>
                  <option value="moto">🏍 Moto / Scooter</option>
                </select>
              </div>
              <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Titre *</label>
                <input className="input" placeholder="Ex : Audi A3, Loft moderne…" value={form.title || ""} onChange={e => set("title", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Pays *</label>
                  <select className="input" value={form.country || ""} onChange={e => { set("country", e.target.value); set("city", ""); set("customCity", ""); }}>
                    <option value="">— Choisir —</option>{Object.keys(COUNTRIES).sort().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Ville *</label>
                  <select className="input" value={form.city || ""} onChange={e => set("city", e.target.value)} disabled={!form.country}>
                    <option value="">{form.country ? "— Choisir —" : "Pays d'abord"}</option>
                    {form.country && getCitiesForCountry(form.country).map(c => <option key={c} value={c}>{c}</option>)}
                    {form.country && <option value="__other__">✏️ Ma ville n'est pas listée</option>}
                  </select>
                </div>
              </div>
              {form.city === "__other__" && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#92400e", display: "block", marginBottom: 6 }}>✏️ Nom de votre ville *</label>
                  <input className="input" placeholder="Ex : Imzouren…" value={form.customCity || ""} onChange={e => set("customCity", e.target.value)} style={{ background: "white" }} />
                  <p style={{ fontSize: 11, color: "#92400e", marginTop: 6 }}>💡 Sera ajoutée à la liste.</p>
                </div>
              )}
              <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Prix par jour (€) *</label>
                <input className="input" type="number" placeholder="50" value={form.price || ""} onChange={e => set("price", parseInt(e.target.value) || 0)} />
              </div>
              <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Description *</label>
                <textarea className="input" rows={3} placeholder="Décrivez votre bien…" value={form.desc || ""} onChange={e => set("desc", e.target.value)} style={{ resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>📍 Lien Google Maps / Waze (optionnel)</label>
                <input className="input" type="url" placeholder="https://maps.google.com/... ou https://waze.com/..." value={form.mapLink || ""} onChange={e => set("mapLink", e.target.value)} />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
                  💡 <strong>Comment obtenir le lien ?</strong><br />
                  • <strong>Google Maps</strong> : Cherchez votre adresse → Cliquez sur "Partager" → Copier le lien<br />
                  • <strong>Waze</strong> : Cherchez votre adresse → "Partager" → Copier le lien
                </p>
              </div>

              {/* 🎁 OFFRES SPÉCIALES */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8, color: "#92400e" }}>🎁 Offres spéciales (optionnel)</label>
                <p style={{ fontSize: 11, color: "#78350f", marginBottom: 10 }}>Attirez plus de clients avec des prix réduits pour les longs séjours.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#78350f" }}>À partir de (jours)</label>
                    <input className="input" type="number" placeholder="5" value={form.offerMinDays || ""} onChange={e => set("offerMinDays", parseInt(e.target.value) || 0)} style={{ background: "white", marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#78350f" }}>Prix par jour (€)</label>
                    <input className="input" type="number" placeholder="15" value={form.offerPrice || ""} onChange={e => set("offerPrice", parseInt(e.target.value) || 0)} style={{ background: "white", marginTop: 4 }} />
                  </div>
                </div>
                {form.offerMinDays > 0 && form.offerPrice > 0 && form.price > 0 && (
                  <p style={{ fontSize: 11, color: "#166534", background: "#dcfce7", padding: 8, borderRadius: 8, marginTop: 6 }}>
                    💡 Si un client réserve <strong>{form.offerMinDays}+ jours</strong>, le prix sera de <strong>{form.offerPrice}€/jour</strong> au lieu de {form.price}€/jour (économie de <strong>{Math.round((1 - form.offerPrice / form.price) * 100)}%</strong>)
                  </p>
                )}
              </div>
              {isLodging(form.type) && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{form.type === "hotel" ? "Chambres dans la suite *" : "Chambres *"}</label>
                      <input className="input" type="number" placeholder="2" value={form.rooms || ""} onChange={e => set("rooms", parseInt(e.target.value) || 0)} /></div>
                    <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Pers. max *</label>
                      <input className="input" type="number" placeholder="4" value={form.guests || ""} onChange={e => set("guests", parseInt(e.target.value) || 0)} /></div>
                  </div>
                  <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>📶 WiFi disponible ?</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" onClick={() => set("wifi", true)} style={{ padding: 12, borderRadius: 12, border: form.wifi === true ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: form.wifi === true ? "#f0fdfa" : "white", color: form.wifi === true ? "#0d9488" : "#374151", fontWeight: form.wifi === true ? 700 : 500, fontSize: 14, cursor: "pointer" }}>✓ Oui, WiFi inclus</button>
                      <button type="button" onClick={() => set("wifi", false)} style={{ padding: 12, borderRadius: 12, border: form.wifi === false ? "2px solid #ef4444" : "2px solid #e5e7eb", background: form.wifi === false ? "#fef2f2" : "white", color: form.wifi === false ? "#991b1b" : "#374151", fontWeight: form.wifi === false ? 700 : 500, fontSize: 14, cursor: "pointer" }}>✗ Pas de WiFi</button>
                    </div>
                  </div>
                </>
              )}
              {isVehicle(form.type) && (
                <>
                  <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{form.type === "moto" ? "Places (1 ou 2) *" : "Places *"}</label>
                    <input className="input" type="number" placeholder={form.type === "moto" ? "2" : "5"} value={form.seats || ""} onChange={e => set("seats", parseInt(e.target.value) || 0)} /></div>
                  <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>⛽ Carburant *</label>
                    <select className="input" value={form.fuel || ""} onChange={e => set("fuel", e.target.value)}>
                      <option value="">— Choisir —</option>
                      <option value="essence">⛽ Essence</option>
                      {form.type === "car" && <option value="diesel">🛢 Diesel</option>}
                      {form.type === "car" && <option value="hybrid-essence">🔋 Hybride Essence</option>}
                      {form.type === "car" && <option value="hybrid-diesel">🔋 Hybride Diesel</option>}
                      <option value="electric">⚡ Électrique</option>
                      {form.type === "car" && <option value="gpl">🔥 GPL</option>}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>⚙️ Transmission *</label>
                    <select className="input" value={form.transmission || ""} onChange={e => set("transmission", e.target.value)}>
                      <option value="">— Choisir —</option>
                      <option value="manual">🕹 Manuelle</option>
                      <option value="automatic">🤖 Automatique</option>
                    </select>
                  </div>
                  {form.type === "moto" && (
                    <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>🏍 Cylindrée (cm³)</label>
                      <input className="input" type="number" placeholder="125, 600, 1000…" value={form.cc || ""} onChange={e => set("cc", parseInt(e.target.value) || 0)} /></div>
                  )}
                </>
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>📸 Photos (jusqu'à 5)</label>
                <label className="btn btn-ghost" style={{ display: "inline-block", textAlign: "center", width: "100%" }}>📎 Choisir<input type="file" multiple accept="image/*" onChange={handlePhotos} style={{ display: "none" }} /></label>
                {photos.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: "relative", width: 70, height: 70, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                        <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "white", borderRadius: "50%", width: 20, height: 20, fontSize: 12 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}
              <button className="btn btn-primary" style={{ padding: "14px 24px", fontSize: 15 }} onClick={() => {
                if (modal.type === "edit") {
                  // En modification : validations souples (le reste est déjà pré-rempli)
                  if (!form.title || !form.title.trim()) return setFormError("Le titre ne peut pas être vide");
                  if (!form.price || form.price <= 0) return setFormError("Le prix doit être supérieur à 0");
                  const finalCityEdit = form.city === "__other__" ? (form.customCity || "").trim() : form.city;
                  if (form.city === "__other__" && finalCityEdit) addCustomCity(form.country, finalCityEdit);
                  const finalDataEdit = { ...form, city: finalCityEdit || form.city, photos: photos.length > 0 ? photos : [PROPERTY_TYPES[form.type]?.icon || "🏠"] };
                  updateListing(modal.data, finalDataEdit);
                  return;
                }
                // En création : toutes les validations obligatoires
                if (!form.type) return setFormError("Choisir un type");
                if (!form.title || !form.title.trim()) return setFormError("Titre obligatoire");
                if (!form.country) return setFormError("Pays obligatoire");
                if (!form.city) return setFormError("Ville obligatoire");
                if (form.city === "__other__" && (!form.customCity || !form.customCity.trim())) return setFormError("Saisir le nom de votre ville");
                if (!form.price || form.price <= 0) return setFormError("Prix obligatoire");
                if (!form.desc || !form.desc.trim()) return setFormError("Description obligatoire");
                if (isLodging(form.type) && (!form.rooms || !form.guests)) return setFormError("Chambres et personnes obligatoires");
                if (isVehicle(form.type) && !form.seats) return setFormError("Places obligatoires");
                if (isVehicle(form.type) && !form.fuel) return setFormError("Type de carburant obligatoire");
                if (isVehicle(form.type) && !form.transmission) return setFormError("Type de transmission obligatoire");
                const finalCity = form.city === "__other__" ? form.customCity.trim() : form.city;
                if (form.city === "__other__") addCustomCity(form.country, finalCity);
                const finalData = { ...form, city: finalCity, photos: photos.length > 0 ? photos : [PROPERTY_TYPES[form.type]?.icon || "🏠"] };
                addListing(finalData);
              }}>{modal.type === "edit" ? "✓ Enregistrer les modifications" : "✓ Soumettre"}</button>
            </div>
          </>
        )}

        {modal.type === "book" && <BookingCalendar listing={modal.data} user={user} book={book} setModal={setModal} />}

        {modal.type === "availability" && <AvailabilityCalendar listing={modal.data} updateBlockedDates={updateBlockedDates} setModal={setModal} bookings={bookings} />}

        {/* 📝 INFORMATIONS DE RÉSERVATION */}
        {modal.type === "bookingInfo" && (() => {
          const { listing, from, to } = modal.data;
          const days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));
          const priceInfo = getPriceWithOffer(listing, days);
          const total = priceInfo.total;
          return (
            <>
              {/* Indicateur d'étapes */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, fontSize: 11 }}>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>1 ✓ Dates</span>
                <span style={{ color: "#d1d5db" }}>→</span>
                <span style={{ background: "#14b8a6", color: "white", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>2 Infos</span>
                <span style={{ color: "#d1d5db" }}>→</span>
                <span style={{ background: "#f3f4f6", color: "#9ca3af", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>3 Paiement</span>
              </div>

              <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📝 Vos informations</h2>
              <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 13 }}>Vérifiez vos informations pour la réservation.</p>

              {/* Récap réservation */}
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{PROPERTY_TYPES[listing.type]?.icon} {listing.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>📍 {listing.city}, {listing.country}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>📅 Du {from} au {to} ({days} jour{days > 1 ? "s" : ""})</p>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "#14b8a6" }}>{total}€</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Nom complet *</label>
                  <input className="input" placeholder="Votre nom et prénom" value={form.fullName || ""} onChange={e => set("fullName", e.target.value)} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>📧 Email *</label>
                  <input className="input" type="email" placeholder="votre@email.com" value={form.bookingEmail || ""} onChange={e => set("bookingEmail", e.target.value)} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>📱 Téléphone *</label>
                  <input className="input" type="tel" placeholder="+33 6 12 34 56 78" value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>🆔 Pièce d'identité *</label>
                  <select className="input" value={form.idType || ""} onChange={e => set("idType", e.target.value)}>
                    <option value="">— Choisir —</option>
                    <option value="cni">Carte d'identité</option>
                    <option value="passport">Passeport</option>
                    <option value="driver">Permis de conduire</option>
                  </select>
                </div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Numéro de la pièce *</label>
                  <input className="input" placeholder="Ex : 1234567890" value={form.idNumber || ""} onChange={e => set("idNumber", e.target.value)} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>💬 Message au propriétaire (optionnel)</label>
                  <textarea className="input" rows={2} placeholder="Heure d'arrivée prévue, demande spéciale…" value={form.bookingNote || ""} onChange={e => set("bookingNote", e.target.value)} style={{ resize: "vertical" }} /></div>

                {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}

                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal({ type: "book", data: listing })}>← Retour</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                    if (!form.fullName || !form.fullName.trim()) return setFormError("Nom obligatoire");
                    if (!form.bookingEmail || !form.bookingEmail.trim()) return setFormError("Email obligatoire");
                    if (!form.phone || !form.phone.trim()) return setFormError("Téléphone obligatoire");
                    if (!form.idType) return setFormError("Type de pièce d'identité obligatoire");
                    if (!form.idNumber || !form.idNumber.trim()) return setFormError("Numéro de pièce obligatoire");
                    setFormError("");
                    setModal({ type: "bookingPayment", data: { listing, from, to, info: { fullName: form.fullName, email: form.bookingEmail, phone: form.phone, idType: form.idType, idNumber: form.idNumber, note: form.bookingNote || "" } } });
                  }}>Continuer →</button>
                </div>
              </div>
            </>
          );
        })()}

        {/* 💳 PAIEMENT */}
        {modal.type === "bookingPayment" && (() => {
          const { listing, from, to, info } = modal.data;
          const days = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000));
          const priceInfo = getPriceWithOffer(listing, days);
          const total = priceInfo.total;
          return (
            <>
              {/* Indicateur d'étapes */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, fontSize: 11 }}>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>1 ✓ Dates</span>
                <span style={{ color: "#d1d5db" }}>→</span>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>2 ✓ Infos</span>
                <span style={{ color: "#d1d5db" }}>→</span>
                <span style={{ background: "#14b8a6", color: "white", padding: "4px 10px", borderRadius: 50, fontWeight: 700 }}>3 Paiement</span>
              </div>

              <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💳 Paiement</h2>
              <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 13 }}>Finalisez votre réservation.</p>

              {/* Récap complet */}
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{PROPERTY_TYPES[listing.type]?.icon} {listing.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>📍 {listing.city}, {listing.country}</p>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>📅 Du {from} au {to}</p>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>👤 {info.fullName} · 📱 {info.phone}</p>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 10, paddingTop: 10 }}>
                  {priceInfo.offerApplied ? (
                    <>
                      <div style={{ background: "#dcfce7", color: "#166534", padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>🎁 Offre {listing.offerMinDays}+ jours appliquée !</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", textDecoration: "line-through", marginBottom: 2 }}>
                        <span>Prix normal {listing.price}€ × {days}</span><span>{priceInfo.originalTotal}€</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#0d9488", fontWeight: 600 }}>
                        <span>Prix offre {priceInfo.pricePerDay}€ × {days}</span><span>{total}€</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#16a34a", marginBottom: 4 }}>
                        <span>💰 Vous économisez</span><span style={{ fontWeight: 700 }}>−{priceInfo.saved}€</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#6b7280" }}>{listing.price}€ × {days} jour{days > 1 ? "s" : ""}</span>
                      <span>{total}€</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e5e7eb" }}>
                    <span style={{ fontWeight: 700 }}>Total à payer</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: "#14b8a6" }}>{total}€</span>
                  </div>
                </div>
              </div>

              {/* Méthodes de paiement */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5, marginBottom: 10 }}>MÉTHODE DE PAIEMENT</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <button onClick={() => set("paymentMethod", "card")} style={{ padding: 14, borderRadius: 12, border: form.paymentMethod === "card" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: form.paymentMethod === "card" ? "#f0fdfa" : "white", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>💳</span><span><strong>Carte bancaire</strong><br /><span style={{ fontSize: 11, color: "#6b7280" }}>Visa, Mastercard</span></span></span>
                  {form.paymentMethod === "card" && <span style={{ color: "#14b8a6", fontSize: 20 }}>✓</span>}
                </button>
                <button onClick={() => set("paymentMethod", "paypal")} style={{ padding: 14, borderRadius: 12, border: form.paymentMethod === "paypal" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: form.paymentMethod === "paypal" ? "#f0fdfa" : "white", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>🅿️</span><span><strong>PayPal</strong><br /><span style={{ fontSize: 11, color: "#6b7280" }}>Compte PayPal</span></span></span>
                  {form.paymentMethod === "paypal" && <span style={{ color: "#14b8a6", fontSize: 20 }}>✓</span>}
                </button>
                <button onClick={() => set("paymentMethod", "onsite")} style={{ padding: 14, borderRadius: 12, border: form.paymentMethod === "onsite" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: form.paymentMethod === "onsite" ? "#f0fdfa" : "white", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>💵</span><span><strong>Paiement sur place</strong><br /><span style={{ fontSize: 11, color: "#6b7280" }}>À l'arrivée</span></span></span>
                  {form.paymentMethod === "onsite" && <span style={{ color: "#14b8a6", fontSize: 20 }}>✓</span>}
                </button>
              </div>

              <p style={{ fontSize: 11, color: "#9ca3af", background: "#fffbeb", border: "1px solid #fde68a", padding: 10, borderRadius: 10, marginBottom: 12 }}>⚠️ Paiement en ligne (Stripe/PayPal) bientôt disponible. Pour l'instant, la réservation est confirmée sans paiement immédiat.</p>

              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚠️ {formError}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal({ type: "bookingInfo", data: { listing, from, to } })}>← Retour</button>
                <button className="btn btn-primary" style={{ flex: 2, background: "linear-gradient(135deg,#14b8a6,#0d9488)" }} onClick={async () => {
                  if (!form.paymentMethod) return setFormError("Choisissez une méthode de paiement");
                  setFormError("");
                  if (form.paymentMethod === "card") {
                    // Paiement par carte → rediriger vers Stripe
                    await payerAvecStripe(listing, from, to, total, info);
                  } else {
                    // PayPal ou paiement sur place → réservation directe
                    await book(listing, from, to, { ...info, paymentMethod: form.paymentMethod });
                  }
                }}>✓ Confirmer & Payer {total}€</button>
              </div>
            </>
          );
        })()}

        {/* ⭐ AVIS */}
        {modal.type === "review" && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>⭐ Laisser un avis</h2>
            <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>{modal.data.listingTitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Votre note *</label>
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: 20, textAlign: "center" }}>
                  <Stars value={form.rating || 0} size={42} onChange={(n) => set("rating", n)} />
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>{form.rating ? `${form.rating}/5 — ${["", "Mauvais", "Moyen", "Bien", "Très bien", "Excellent"][form.rating]}` : "Cliquez pour noter"}</p>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Votre commentaire *</label>
                <textarea className="input" rows={4} placeholder="Partagez votre expérience..." value={form.comment || ""} onChange={e => set("comment", e.target.value)} style={{ resize: "vertical" }} />
              </div>
              {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>⚠️ {formError}</div>}
              <button className="btn btn-primary" onClick={() => {
                if (!form.rating) return setFormError("Donnez une note");
                if (!form.comment || !form.comment.trim()) return setFormError("Écrivez un commentaire");
                addReview(modal.data.listingId, form.rating, form.comment.trim());
              }}>✓ Publier mon avis</button>
            </div>
          </>
        )}

        {/* 💬 CONTACTER LE PROPRIÉTAIRE */}
        {modal.type === "contactOwner" && !user && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Connexion requise</h2>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>Connectez-vous pour contacter le propriétaire.</p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setModal({ type: "login" })}>Se connecter</button>
          </>
        )}
        {modal.type === "contactOwner" && user && user.id === modal.data.ownerId && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>C'est votre annonce 😊</h2>
            <p style={{ color: "#6b7280" }}>Vous ne pouvez pas vous écrire à vous-même.</p>
          </>
        )}
        {modal.type === "contactOwner" && user && user.id !== modal.data.ownerId && (
          <>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💬 Contacter {modal.data.ownerName}</h2>
            <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>À propos de : {modal.data.title}</p>
            <textarea className="input" rows={4} placeholder="Bonjour, j'aimerais avoir plus d'informations sur votre annonce…" value={form.message || ""} onChange={e => set("message", e.target.value)} style={{ resize: "vertical", marginBottom: 12 }} />
            {formError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚠️ {formError}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => {
              if (!form.message || !form.message.trim()) return setFormError("Écrivez un message");
              sendMessage(modal.data.id, modal.data.ownerId, modal.data.ownerName, form.message.trim());
              setFormError("");
              setForm({});
              setModal(null);
              setPage("messages");
            }}>📤 Envoyer le message</button>
          </>
        )}

        {/* 💬 CHAT */}
        {modal.type === "chat" && (() => {
          const conv = messages.filter(m => m.conversationId === modal.data.conversationId).sort((a, b) => new Date(a.date) - new Date(b.date));
          return (
            <>
              <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 12 }}>
                <h2 className="display" style={{ fontWeight: 800, fontSize: 20 }}>💬 {modal.data.otherName}</h2>
                {modal.data.listing && <p style={{ fontSize: 12, color: "#14b8a6", fontWeight: 600 }}>📋 {modal.data.listing.title}</p>}
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, padding: 4 }}>
                {conv.length === 0 ? <p style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>Aucun message</p> : conv.map(m => (
                  <div key={m.id} style={{ alignSelf: m.fromId === user.id ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                    <div style={{ background: m.fromId === user.id ? "#14b8a6" : "#f3f4f6", color: m.fromId === user.id ? "white" : "#1a1a1a", padding: "10px 14px", borderRadius: 18, fontSize: 14, lineHeight: 1.4 }}>
                      {m.text}
                    </div>
                    <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, textAlign: m.fromId === user.id ? "right" : "left" }}>{new Date(m.date).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Tapez votre message…" value={form.chatMsg || ""} onChange={e => set("chatMsg", e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" && form.chatMsg && form.chatMsg.trim() && modal.data.listing) {
                    sendMessage(modal.data.listing.id, modal.data.otherId, modal.data.otherName, form.chatMsg);
                    set("chatMsg", "");
                  }
                }} style={{ flex: 1 }} />
                <button className="btn btn-primary" style={{ padding: "12px 18px" }} onClick={() => {
                  if (form.chatMsg && form.chatMsg.trim() && modal.data.listing) {
                    sendMessage(modal.data.listing.id, modal.data.otherId, modal.data.otherName, form.chatMsg);
                    set("chatMsg", "");
                  }
                }}>📤</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ─── BOOKING CALENDAR ───────────────────────────────────────────────
function AvailabilityCalendar({ listing, updateBlockedDates, setModal, bookings }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blocked, setBlocked] = useState(Array.isArray(listing.blockedDates) ? [...listing.blockedDates] : []);
  const [mode, setMode] = useState("range"); // "range" = par période, "single" = jour par jour
  const [rangeStart, setRangeStart] = useState(null); // début de période en cours de sélection
  // Jours où le retour (fin de location) est interdit
  const [noReturn, setNoReturn] = useState(Array.isArray(listing.noReturnDates) ? [...listing.noReturnDates] : []);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split("T")[0];

  // Dates déjà réservées (non modifiables par le propriétaire)
  const bookedSet = new Set();
  bookings.filter(b => b.listingId === listing.id && b.status === "confirmed").forEach(b => {
    for (let d = new Date(b.from); d <= new Date(b.to); d.setDate(d.getDate() + 1)) bookedSet.add(fmt(d));
  });

  const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const dayNames = ["L","M","M","J","V","S","D"];
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Clic sur un jour : comportement selon le mode
  const handleDayClick = (date) => {
    const ds = fmt(date);
    if (date < today || bookedSet.has(ds)) return; // pas les dates passées ni réservées

    if (mode === "noreturn") {
      // Mode retour interdit : marquer/démarquer un jour où le retour est interdit
      setNoReturn(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds]);
      return;
    }

    if (mode === "single") {
      // Mode jour par jour : bloquer/débloquer un seul jour
      setBlocked(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds]);
      return;
    }

    // Mode période : 1er clic = début, 2e clic = fin (bloque tout l'intervalle)
    if (!rangeStart) {
      setRangeStart(date);
    } else {
      const start = rangeStart < date ? rangeStart : date;
      const end = rangeStart < date ? date : rangeStart;
      const newBlocked = new Set(blocked);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = fmt(d);
        if (d >= today && !bookedSet.has(k)) newBlocked.add(k);
      }
      setBlocked([...newBlocked]);
      setRangeStart(null);
    }
  };

  const cellStyle = (date) => {
    if (!date) return { visibility: "hidden" };
    const ds = fmt(date);
    const isPast = date < today, isBooked = bookedSet.has(ds), isBlocked = blocked.includes(ds), isNoReturn = noReturn.includes(ds);
    const isRangeStart = rangeStart && fmt(rangeStart) === ds;
    let bg = "#dcfce7", color = "#166534", cursor = "pointer", border = "1px solid #86efac", textDecoration = "none";
    if (isPast) { bg = "#f3f4f6"; color = "#d1d5db"; cursor = "not-allowed"; textDecoration = "line-through"; border = "1px solid transparent"; }
    else if (isBooked) { bg = "#fee2e2"; color = "#991b1b"; cursor = "not-allowed"; border = "1px solid #fca5a5"; }
    else if (isRangeStart) { bg = "#14b8a6"; color = "white"; border = "1px solid #0d9488"; }
    else if (isBlocked) { bg = "#fed7aa"; color = "#9a3412"; border = "1px solid #fb923c"; }
    else if (isNoReturn) { bg = "#ede9fe"; color = "#6d28d9"; border = "1px solid #c4b5fd"; }
    return { background: bg, color, cursor, border, textDecoration, borderRadius: 10, padding: 8, fontWeight: 600, fontSize: 13, textAlign: "center" };
  };

  return (
    <>
      <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📅 Disponibilités</h2>
      <p style={{ color: "#6b7280", marginBottom: 12, fontSize: 13 }}>{listing.title}</p>

      {/* Choix du mode */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => { setMode("range"); setRangeStart(null); }} style={{ flex: "1 1 30%", padding: 9, borderRadius: 10, border: mode === "range" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: mode === "range" ? "#f0fdfa" : "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📆 Période</button>
        <button onClick={() => { setMode("single"); setRangeStart(null); }} style={{ flex: "1 1 30%", padding: 9, borderRadius: 10, border: mode === "single" ? "2px solid #14b8a6" : "2px solid #e5e7eb", background: mode === "single" ? "#f0fdfa" : "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>👆 Jour</button>
        <button onClick={() => { setMode("noreturn"); setRangeStart(null); }} style={{ flex: "1 1 30%", padding: 9, borderRadius: 10, border: mode === "noreturn" ? "2px solid #7c3aed" : "2px solid #e5e7eb", background: mode === "noreturn" ? "#ede9fe" : "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🚫 Retour interdit</button>
      </div>

      {/* Instruction selon le mode */}
      <p style={{ background: mode === "noreturn" ? "#ede9fe" : "#fffbeb", border: mode === "noreturn" ? "1px solid #c4b5fd" : "1px solid #fde68a", borderRadius: 10, padding: 10, fontSize: 12, color: mode === "noreturn" ? "#6d28d9" : "#92400e", marginBottom: 14 }}>
        {mode === "noreturn"
          ? "Cliquez sur les jours où le client ne peut PAS rendre le bien (fin de location interdite). Il devra prolonger jusqu'à un jour autorisé."
          : mode === "range"
          ? (rangeStart ? `Cliquez sur le dernier jour pour bloquer toute la période (début : ${fmt(rangeStart)})` : "Cliquez sur le 1er jour, puis le dernier jour pour bloquer toute la période.")
          : "Cliquez sur chaque jour pour le bloquer ou le débloquer."}
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", fontSize: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 4 }} /> Disponible</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#fed7aa", border: "1px solid #fb923c", borderRadius: 4 }} /> Bloqué</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 4 }} /> Retour interdit</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4 }} /> Réservé</span>
      </div>

      {/* Navigation mois */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ background: "#f3f4f6", borderRadius: 10, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>‹</button>
        <strong style={{ fontSize: 15 }}>{monthNames[month]} {year}</strong>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ background: "#f3f4f6", borderRadius: 10, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>›</button>
      </div>

      {/* Grille jours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
        {dayNames.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 18 }}>
        {cells.map((date, i) => <div key={i} style={cellStyle(date)} onClick={() => date && handleDayClick(date)}>{date ? date.getDate() : ""}</div>)}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: "#6b7280" }}>{blocked.length} jour{blocked.length > 1 ? "s" : ""} bloqué{blocked.length > 1 ? "s" : ""}</p>
        {blocked.length > 0 && <button onClick={() => { setBlocked([]); setRangeStart(null); }} style={{ background: "none", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Tout débloquer</button>}
      </div>

      {noReturn.length > 0 && (
        <p style={{ fontSize: 12, color: "#7c3aed", marginBottom: 14, fontWeight: 600 }}>🚫 {noReturn.length} jour{noReturn.length > 1 ? "s" : ""} où le retour est interdit</p>
      )}

      <button className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 15 }} onClick={() => { updateBlockedDates(listing, blocked, noReturn); setModal(null); }}>💾 Enregistrer les disponibilités</button>
    </>
  );
}

function BookingCalendar({ listing, user, book, setModal }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [error, setError] = useState("");

  const bookedDates = getBookedDates(listing.id);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bookedSet = new Set();
  bookedDates.forEach(b => {
    for (let d = new Date(b.from); d <= new Date(b.to); d.setDate(d.getDate() + 1)) {
      bookedSet.add(d.toISOString().split("T")[0]);
    }
  });
  // Ajouter les dates bloquées manuellement par le propriétaire
  if (Array.isArray(listing.blockedDates)) {
    listing.blockedDates.forEach(ds => bookedSet.add(ds));
  }
  const fmt = (d) => d.toISOString().split("T")[0];
  const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const dayNames = ["L","M","M","J","V","S","D"];
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const handleClick = (date) => {
    setError("");
    const ds = fmt(date);
    if (date < today || bookedSet.has(ds)) return;
    if (!from || (from && to)) { setFrom(date); setTo(null); }
    else if (date < from) { setFrom(date); setTo(null); }
    else if (date.getTime() === from.getTime()) { setFrom(null); setTo(null); }
    else {
      let conflict = false;
      for (let d = new Date(from); d <= date; d.setDate(d.getDate() + 1)) {
        if (bookedSet.has(fmt(d)) && fmt(d) !== fmt(from)) { conflict = true; break; }
      }
      if (conflict) return setError("Une date dans cette période est déjà réservée.");
      setTo(date);
    }
  };

  const cellStyle = (date) => {
    if (!date) return { visibility: "hidden" };
    const ds = fmt(date);
    const isPast = date < today, isBooked = bookedSet.has(ds);
    const isNoReturn = Array.isArray(listing.noReturnDates) && listing.noReturnDates.includes(ds);
    const isStart = from && fmt(date) === fmt(from);
    const isEnd = to && fmt(date) === fmt(to);
    const isBetween = from && to && date > from && date < to;
    let bg = "white", color = "#1a1a1a", cursor = "pointer", textDecoration = "none", border = "1px solid transparent";
    if (isPast) { bg = "#f3f4f6"; color = "#d1d5db"; cursor = "not-allowed"; textDecoration = "line-through"; }
    else if (isBooked) { bg = "#fee2e2"; color = "#991b1b"; cursor = "not-allowed"; textDecoration = "line-through"; }
    else if (isStart || isEnd) { bg = "#14b8a6"; color = "white"; }
    else if (isBetween) { bg = "#ccfbf1"; color = "#0f766e"; }
    else if (isNoReturn) { bg = "#ede9fe"; color = "#6d28d9"; border = "1px solid #c4b5fd"; }
    else { bg = "#dcfce7"; color = "#166534"; border = "1px solid #86efac"; }
    return { background: bg, color, cursor, textDecoration, border, borderRadius: 10, padding: 8, fontWeight: (isStart || isEnd) ? 700 : 500, fontSize: 13, textAlign: "center" };
  };

  const days = from && to ? Math.max(1, Math.ceil((to - from) / 86400000)) : 0;
  const priceInfo = days > 0 ? getPriceWithOffer(listing, days) : { pricePerDay: listing.price, total: 0, offerApplied: false };
  const total = priceInfo.total;

  // 🚫 Vérifier que la date de fin (retour) ne tombe pas sur un jour "retour interdit"
  const noReturnSet = Array.isArray(listing.noReturnDates) ? listing.noReturnDates : [];
  const returnForbidden = from && to && noReturnSet.includes(fmt(to));

  return (
    <>
      <h2 className="display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{PROPERTY_TYPES[listing.type] && PROPERTY_TYPES[listing.type].icon || "🏠"} {listing.title}</h2>
      <p style={{ color: "#6b7280", marginBottom: 12, fontSize: 13 }}>📍 {listing.city}, {listing.country} · <strong>{listing.price}€/jour</strong></p>
      <p style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: 10, fontSize: 12, color: "#0f766e", marginBottom: 16 }}>👤 Par <strong>{listing.ownerName}</strong></p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", fontSize: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 4 }} /> Disponible</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#fee2e2", borderRadius: 4 }} /> Réservé</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#14b8a6", borderRadius: 4 }} /> Sélection</span>
        {Array.isArray(listing.noReturnDates) && listing.noReturnDates.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 14, background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 4 }} /> Retour interdit</span>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ background: "#f3f4f6", borderRadius: "50%", width: 32, height: 32, fontWeight: 700 }}>‹</button>
        <h3 style={{ fontWeight: 700 }}>{monthNames[month]} {year}</h3>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ background: "#f3f4f6", borderRadius: "50%", width: 32, height: 32, fontWeight: 700 }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {dayNames.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 12 }}>
        {cells.map((date, i) => <div key={i} onClick={() => date && handleClick(date)} style={cellStyle(date)}>{date ? date.getDate() : ""}</div>)}
      </div>
      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
      {!from && <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: 12, textAlign: "center", marginBottom: 12 }}><p style={{ fontSize: 13, color: "#6b7280" }}>👆 Cliquez sur une date d'arrivée</p></div>}
      {from && !to && <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 12, padding: 12, textAlign: "center", marginBottom: 12 }}><p style={{ fontSize: 13, color: "#0f766e", fontWeight: 600 }}>✓ Arrivée : {fmt(from)}</p><p style={{ fontSize: 12, color: "#0f766e", marginTop: 4 }}>👆 Cliquez sur la date de départ</p></div>}
      {from && to && (
        <div style={{ background: "#0a0a0a", color: "white", borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "#a3a3a3", marginBottom: 6 }}>📅 {fmt(from)} → {fmt(to)}</p>
          {priceInfo.offerApplied ? (
            <>
              <div style={{ background: "#14b8a6", color: "white", padding: 8, borderRadius: 8, marginBottom: 10, textAlign: "center", fontSize: 12, fontWeight: 700 }}>
                🎁 Offre {listing.offerMinDays}+ jours appliquée !
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a3a3a3", textDecoration: "line-through" }}><span>Prix normal {listing.price}€ × {days}</span><span>{priceInfo.originalTotal}€</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "white", fontWeight: 600 }}><span>Prix offre {priceInfo.pricePerDay}€ × {days}</span><span>{total}€</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#14b8a6", marginTop: 4 }}><span>💰 Économies</span><span>−{priceInfo.saved}€</span></div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#a3a3a3" }}><span>{listing.price}€ × {days} nuit(s)</span><span>{total}€</span></div>
              {listing.offerMinDays && listing.offerPrice && (
                <p style={{ fontSize: 11, color: "#fbbf24", marginTop: 6, padding: 6, background: "rgba(251,191,36,0.1)", borderRadius: 6 }}>
                  💡 Réservez {listing.offerMinDays - days} jour(s) de plus pour {listing.offerPrice}€/jour !
                </p>
              )}
            </>
          )}
          <div style={{ borderTop: "1px solid #333", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontWeight: 700 }}>Total</span><span className="display" style={{ fontWeight: 800, fontSize: 26, color: "#14b8a6" }}>{total}€</span></div>
        </div>
      )}
      {returnForbidden && (
        <div style={{ background: "#ede9fe", border: "1px solid #c4b5fd", color: "#6d28d9", padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12, textAlign: "center", fontWeight: 600 }}>
          🚫 Le retour n'est pas possible le {fmt(to)}. Choisissez une autre date de fin.
        </div>
      )}
      <button className="btn btn-primary" style={{ width: "100%", padding: "14px", opacity: (from && to && !returnForbidden) ? 1 : 0.4 }} disabled={!from || !to || returnForbidden} onClick={() => from && to && !returnForbidden && setModal({ type: "bookingInfo", data: { listing, from: fmt(from), to: fmt(to) } })}>Continuer →</button>
      <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>📝 Étape suivante : vos informations</p>
    </>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────
function Status({ status }) {
  const m = { approved: ["#d1fae5","#065f46","✓ APPROUVÉE"], pending: ["#fef3c7","#92400e","⏳ EN ATTENTE"], rejected: ["#fee2e2","#991b1b","✗ REFUSÉE"], confirmed: ["#cffafe","#155e75","✓ CONFIRMÉE"], exchange_done: ["#d1fae5","#065f46","✓✓ ÉCHANGE CONFIRMÉ"] };
  const [bg, c, l] = m[status] || ["#f3f4f6","#374151",status];
  return <span className="badge" style={{ background: bg, color: c }}>{l}</span>;
}
function Empty({ icon, msg }) { return <div style={{ textAlign: "center", padding: 56, color: "#9ca3af" }}><div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div><p>{msg}</p></div>; }

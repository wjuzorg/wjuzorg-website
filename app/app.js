/* =========================================================
   WJU Zorg - app.js (VERSIE: STABLE + SUPABASE FIX)
   ========================================================= */

(() => {
  "use strict";

  // 1. CONFIGURATIE
  const SUPABASE_URL = "https://ligdgbdhreatsuejcinq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_sGbFKRRB3YzizqbEiz3wQg_Vkxt54_j";
  const ORG_ID = "4121dd3f-9d21-42b6-ab38-dccf791bfaaf";
  const FORM_IDS = ["serviceForm", "contactForm", "knownForm"];

  // 2. TOEGANKELIJKHEID (Jouw werk - Volledig behouden)
  const FONT_KEY = "wju_font_scale";
  const CONTRAST_KEY = "wju_contrast";

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function applyFontScale(scale) {
    document.documentElement.style.fontSize = (scale * 100).toFixed(0) + "%";
  }

  function applyContrast(on) {
    document.documentElement.classList.toggle("high-contrast", !!on);
  }

  // Initialiseer direct bij laden (voorkomt flikkeren)
  const initialScale = parseFloat(localStorage.getItem(FONT_KEY) || "1.0");
applyFontScale(clamp(initialScale, 0.9, 1.5));

// Contrast NIET automatisch onthouden
applyContrast(false);

  document.addEventListener("DOMContentLoaded", () => {
    
    // 3. KNOPPEN KOPPELEN (Accessibility)
    const btnRead = document.getElementById("btnRead");
const btnAPlus = document.getElementById("btnAPlus");
const btnAMinus = document.getElementById("btnAMinus");
const btnContrast = document.getElementById("btnContrast");

let reading = false;

if (btnRead) {
  btnRead.onclick = () => {

    if (reading) {
      window.speechSynthesis.cancel();
      btnRead.textContent = "Voorlezen";
      reading = false;
      return;
    }

    const tekst = document.body.innerText.trim();
    if (!tekst) return;

    const speech = new SpeechSynthesisUtterance(tekst);
    speech.lang = "nl-NL";
    speech.rate = 0.95;

    speech.onend = () => {
      btnRead.textContent = "Voorlezen";
      reading = false;
    };

    window.speechSynthesis.speak(speech);

    btnRead.textContent = "Stop";
    reading = true;
  };
}

    if (btnAPlus) {
      btnAPlus.onclick = () => {
        let s = clamp(parseFloat(localStorage.getItem(FONT_KEY) || "1.0") + 0.1, 0.9, 1.5);
        localStorage.setItem(FONT_KEY, s.toString());
        applyFontScale(s);
      };
    }

    if (btnAMinus) {
      btnAMinus.onclick = () => {
        let s = clamp(parseFloat(localStorage.getItem(FONT_KEY) || "1.0") - 0.1, 0.9, 1.5);
        localStorage.setItem(FONT_KEY, s.toString());
        applyFontScale(s);
      };
    }

    if (btnContrast) {
      btnContrast.onclick = () => {
        let on = localStorage.getItem(CONTRAST_KEY) !== "1";
        localStorage.setItem(CONTRAST_KEY, on ? "1" : "0");
        applyContrast(on);
      };
    }

    // 4. FORMULIER LOGICA (Supabase)
    const form = FORM_IDS.map(id => document.getElementById(id)).find(f => f !== null) || document.querySelector("form");
    
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Check of de library er is
        if (!window.supabase) {
          alert("Fout: Supabase library niet geladen. Controleer je HTML script tags.");
          return;
        }

        // Maak de client aan
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const btn = form.querySelector('button[type="submit"]');
        const oldBtnText = btn ? btn.textContent : "Versturen";
        if (btn) { btn.disabled = true; btn.textContent = "Even geduld..."; }

        try {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          // Bel-mij-terug formulier: callback_reason omzetten naar message voor dashboard
if (data.callback_reason && !data.message) {
  data.message = data.callback_reason;
  delete data.callback_reason;
}
          // Zet 'when' om naar 'appointment_time' (en verwijder 'when' zodat Supabase niet klaagt)
if (data.when && !data.appointment_time) {
  data.appointment_time = data.when;
  delete data.when;
}

         // Vaste velden toevoegen
data.org_id = ORG_ID;

// Laat bestaande status uit het formulier staan, anders standaard "nieuw"
if (!data.status) {
  data.status = "nieuw";
}

          // --- BELANGRIJKE VALIDATIE ---
          // Supabase tabel 'requests' heeft een CHECK constraint op 'type'.
          // Toegestane waarden: kennismaken, bekend, mantelzorger, zondag, contact, belmijterug
          const validTypes = ['kennismaken', 'bekend', 'mantelzorger', 'zondag', 'contact', 'belmijterug','service'];
          if (!data.type || !validTypes.includes(data.type)) {
            // Als het type ongeldig is voor de DB, zet hem op een veilige default
            data.type = "kennismaken"; 
          }

          const { error } = await supabaseClient
            .from("requests")
            .insert([data]);

          if (error) throw error;

          // Succes!
const params = new URLSearchParams(window.location.search);
const isAdmin = params.get("admin") === "1";

if (isAdmin) {
  window.location.href = "today.html";
} else {
  window.location.href = "bedankt.html";
}

        } catch (err) {
          console.error("Verzendfout:", err);
          alert("❌ Er ging iets mis bij het verzenden: " + (err.message || "Onbekende fout"));
          if (btn) { btn.disabled = false; btn.textContent = oldBtnText; }
        }
      });
    }
  });
})();
# Milano 2075 — The Long Shot

Sito statico (HTML + CSS + JavaScript puro, nessun framework) per la raccolta
di visioni dei cittadini su come sarà Milano nel 2075.

---

## 1. Cosa c'è dentro

```
milano-2075/
├── index.html      → struttura e contenuti della pagina
├── styles.css      → tutto l'aspetto (colori, font, layout, animazioni)
├── script.js       → comportamenti (lucciole, contatore, timeline, form)
├── img/
│   ├── hero.png    → cityscape di apertura
│   ├── archive.png → texture foglie + circuiti (sezione archivio)
│   └── form.png    → Duomo-serra al tramonto (sezione form)
└── README.md       → questo file
```

Per vederlo in locale basta **aprire `index.html` con un doppio clic** nel browser.
Nessuna installazione, niente build, niente Node.

---

## 2. Come funziona ogni file

- **index.html** — il contenuto (testi in italiano, già pronti). Carica i font
  Google in `<head>`, poi `styles.css`, e in fondo `script.js`.
- **styles.css** — palette solarpunk definita come variabili in `:root`
  (lime bioluminescente `#B7F24C`, ambra `#EBA94B`, fondo nero-foresta `#070D08`).
  Font: *Instrument Serif* (titoli), *Space Grotesk* (testo), *Space Mono* (etichette/dati).
- **script.js** — 5 blocchi commentati: nav allo scroll, contatore visioni,
  lucciole su canvas, timeline che cresce in vista, e form (conteggio parole +
  validazione + invio).

---

## 3. Pubblicare su GitHub Pages (gratis)

### Via interfaccia web (consigliato, niente terminale)

1. Vai su **github.com** → accedi (o crea un account).
2. In alto a destra **+ → New repository**.
   - **Repository name**: `milano-2075`
   - Visibilità: **Public**
   - Premi **Create repository**.
3. Nella pagina del repo vuoto clicca **uploading an existing file**.
4. Trascina **tutto il contenuto della cartella `milano-2075/`**
   (cioè `index.html`, `styles.css`, `script.js` e la cartella `img/`).
   ⚠️ Carica i file *dentro* il repo, non la cartella `milano-2075` come sottocartella:
   `index.html` deve stare nella radice del repository.
5. In basso premi **Commit changes**.
6. Vai su **Settings → Pages** (menu a sinistra).
7. Sotto **Source** scegli **Deploy from a branch**, Branch: **main**, cartella **/ (root)**, **Save**.
8. Dopo ~1 minuto in cima alla stessa pagina comparirà il link pubblico:
   `https://<tuo-utente>.github.io/milano-2075/`

### Via terminale (se usi git)

```bash
cd milano-2075
git init
git add .
git commit -m "Milano 2075 — primo deploy"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/milano-2075.git
git push -u origin main
```
Poi attiva GitHub Pages come ai punti 6–8 qui sopra.

---

## 4. Far funzionare DAVVERO il form (importante)

Adesso il form è **solo dimostrativo**: alla pressione di "Invia" mostra il
messaggio di conferma ma **non salva la visione da nessuna parte**.

Per raccoglierle (senza gestire un server) il modo più semplice è **Formspree**:

1. Crea un form gratuito su **formspree.io** → ottieni un endpoint tipo
   `https://formspree.io/f/abcdwxyz`.
2. In `script.js`, dentro `form.addEventListener('submit', …)`, sostituisci il
   blocco "INVIO (demo)" con:

```js
var data = new FormData(form);
fetch('https://formspree.io/f/abcdwxyz', {
  method: 'POST',
  body: data,
  headers: { Accept: 'application/json' }
}).then(function (r) {
  if (submitBtn) submitBtn.hidden = true;
  if (successBox) successBox.hidden = false;
  visionCount += 1; setVisionDisplay(visionCount);
});
```

(Assicurati che gli `<input>/<select>/<textarea>` abbiano l'attributo `name`,
già presente in `index.html`.)

Alternative equivalenti: **Google Apps Script + Google Sheet**, **Airtable Forms**,
o un piccolo backend tuo. La logica è la stessa: una `fetch()` POST all'endpoint.

---

## 5. Note tecniche

- Tutto è **responsive** (mobile incluso) e rispetta `prefers-reduced-motion`
  (chi ha disattivato le animazioni vede una versione ferma).
- Le immagini sono generate con AI; sostituiscile pure tenendo gli stessi nomi
  file in `img/` per non toccare il codice.
- Per cambiare i colori, modifica solo le variabili in cima a `styles.css`.
- I testi delle "visioni" in archivio sono esempi statici dentro `index.html`:
  aggiungine/modificane copiando un blocco `<article class="vision">…</article>`.

---

## 6. Prompt pronto per Claude Code

> Ho un sito statico (HTML/CSS/JS puro) nella cartella `milano-2075/`:
> `index.html`, `styles.css`, `script.js`, immagini in `img/`. È il sito
> "Milano 2075" di The Long Shot. Aiutami a: (1) pubblicarlo su GitHub Pages,
> e (2) collegare il form di invio visioni a Formspree così le risposte vengono
> salvate. Spiegami passo passo cosa fare e quali righe modificare.

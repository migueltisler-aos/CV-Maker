# CV Maker - AI-gestützter Lebenslauf Generator

Professionelle, personalisierte Lebensläufe für jede Bewerbung – optimiert durch KI.

## Features

- **Master CV Management**: Einmalig alle Berufserfahrungen, Skills und Qualifikationen erfassen
- **AI-Analyse**: Automatische Extraktion von Anforderungen aus Stellenausschreibungen (powered by Groq/Llama 3.1)
- **Smart Matching**: KI schlägt die relevantesten Projekte aus deinem Master CV vor
- **Skill-Radar Chart**: Visuelle Darstellung deiner Top-Skills (1-10 Skala)
- **2-Spalten Layout**: Modernes, cleanes Design für den europäischen Markt
- **PDF Export**: Exportiere deinen CV direkt als professionelles PDF

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **AI**: Groq API (Llama 3.1 70B)
- **Charts**: Recharts (Radar Chart)
- **PDF**: jsPDF + html2canvas
- **Storage**: LocalStorage

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd CV-Maker

# Dependencies installieren
npm install

# .env Datei erstellen und API Key eintragen
echo "VITE_GROQ_API_KEY=your_api_key_here" > .env

# Development Server starten
npm run dev
```

Die App läuft dann auf `http://localhost:5173/`

## Verwendung

### 1. Master CV erstellen

- Füge deine persönlichen Daten ein
- Importiere deine Berufserfahrung im CSV-Format oder gib sie manuell ein
- Format: `Bereich,Firma,Rolle,Zeitraum,Ort,Details`

Beispiel CSV:
```csv
Bereich,Firma/Projekt,Rolle/Titel,Zeitraum,Ort,Details
Berufserfahrung,Beispiel GmbH,Geschäftsführer,10/2024 – 09/2025,Berlin,"KPI-Dashboard | Team +25%"
```

### 2. Stellenanzeige analysieren

- Kopiere die Stellenausschreibung und füge sie ein
- Die KI extrahiert automatisch:
  - Must-Have Anforderungen
  - Nice-to-Have Anforderungen
  - Technische Skills
  - Soft Skills
  - Verantwortlichkeiten

### 3. Projekte auswählen

- Die KI schlägt passende Projekte vor (mit Relevanz-Score)
- Wähle die Projekte aus, die du im CV präsentieren möchtest
- Passe die Auswahl manuell an

### 4. Skills definieren

- Die KI empfiehlt die wichtigsten Skills für die Position
- Bewerte deine Skills auf einer Skala von 1-10
- Diese werden im Radar-Chart visualisiert

### 5. Vorschau & Export

- Live-Vorschau des fertigen CVs
- 2-Spalten Layout mit:
  - Links: Kontakt, Skills-Chart, Ausbildung, Weiterbildungen
  - Rechts: Profil, Berufserfahrung
- Export als PDF mit einem Klick

## Groq API Key

Du benötigst einen kostenlosen Groq API Key:

1. Registriere dich auf [console.groq.com](https://console.groq.com)
2. Erstelle einen API Key
3. Füge ihn in die `.env` Datei ein:
   ```
   VITE_GROQ_API_KEY=gsk_...
   ```

## Projekt-Struktur

```
cv-maker/
├── src/
│   ├── components/
│   │   ├── Layout/          # Header, Navigation
│   │   ├── MasterCV/        # Master CV Management
│   │   ├── JobAnalysis/     # Stellenanalyse & Matching
│   │   ├── CVBuilder/       # Skill-Auswahl
│   │   ├── CVPreview/       # 2-Spalten CV + Radar Chart
│   │   └── Export/          # PDF Export
│   ├── services/
│   │   ├── groqService.js   # Groq API Integration
│   │   └── storageService.js # LocalStorage
│   └── store/
│       └── cvStore.js       # Zustand State Management
```

## Features in Entwicklung

- [ ] Mehrere CV-Templates
- [ ] Anschreiben-Generator
- [ ] Import/Export von Master CVs
- [ ] Direkte LinkedIn-Integration
- [ ] Unterstützung für mehrere Sprachen

## Lizenz

MIT

## Credits

Entwickelt mit ❤️ für professionelle Bewerbungen

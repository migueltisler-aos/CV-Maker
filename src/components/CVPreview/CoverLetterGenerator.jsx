import { useState, useRef } from 'react';
import useCVStore from '../../store/cvStore';
import { generateCoverLetter } from '../../services/groqService';
import jsPDF from 'jspdf';

const CoverLetterGenerator = () => {
  const {
    masterCV,
    jobRequirements,
    currentCV,
    setCoverLetter,
    setCoverLetterStyle,
    setLoading,
    isLoading,
  } = useCVStore();

  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState(currentCV.coverLetter || '');
  const [copyPasteMode, setCopyPasteMode] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [pastedResult, setPastedResult] = useState('');

  const selectedExperiences = masterCV?.experience.filter(exp =>
    currentCV.selectedProjects.includes(exp.id)
  ) || [];

  const styles = [
    { id: 'authentisch', label: 'Authentisch', desc: 'Direkt & persönlich, ohne Floskeln' },
    { id: 'professionell', label: 'Professionell', desc: 'Klassisch professionell, modern' },
    { id: 'direkt', label: 'Direkt', desc: 'Kurz & knackig, auf den Punkt' },
    { id: 'strukturiert', label: 'CV-Matching', desc: 'Fakten-Check: Anforderungen + Stationen' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const coverLetter = await generateCoverLetter(
        masterCV.personal,
        jobRequirements,
        selectedExperiences,
        currentCV.coverLetterStyle
      );
      setCoverLetter(coverLetter);
      setEditedText(coverLetter);
      setEditMode(false);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Fehler beim Generieren des Anschreibens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setCoverLetter(editedText);
    setEditMode(false);
  };

  const handleStyleChange = (style) => {
    setCoverLetterStyle(style);
  };

  const generatePrompt = () => {
    const styleInstructions = {
      authentisch: `Schreibe authentisch und direkt. Vermeide:
- Übertriebene Superlative ("höchst motiviert", "außerordentlich begeistert")
- Phrasen wie "hiermit bewerbe ich mich"
- Zu lange Schachtelsätze
- Standardformulierungen

Nutze stattdessen:
- Konkrete Beispiele und Zahlen aus den Projekten
- Direkte, klare Sprache
- Ich-Perspektive mit Substanz
- Kurze, prägnante Sätze
- Zeige Persönlichkeit, aber bleibe professionell`,

      professionell: `Schreibe professionell, aber modern. Vermeide:
- Zu steife, altbackene Formulierungen
- Übertriebene Bescheidenheit
- Leere Phrasen ohne Substanz

Nutze stattdessen:
- Klare, selbstbewusste Sprache
- Konkrete Erfolge mit Zahlen
- Professionelle, aber nicht steife Formulierungen
- Strukturierte Argumentation`,

      direkt: `Schreibe kurz und knackig. Maximal 3 kurze Absätze:
1. Warum ich passe (2-3 Sätze mit konkreten Erfolgen)
2. Was ich mitbringe (1-2 Highlights aus Projekten)
3. Nächste Schritte (kurz und direkt)

Jeder Satz muss zählen. Keine Füllwörter.`,

      strukturiert: `Erstelle ein CV-Matching-Dokument (KEIN Anschreiben!). Nur Fakten zeigen - passt es?

FORMAT:

**ANFORDERUNGS-MATCHING**

Für jede Must-Have-Anforderung:

**[Anforderung]**
✓ [Passende Projekt-Erfahrung mit Firma, Zeitraum]
✓ [Konkrete Zahlen/Fakten]
✓ [Messbare Erfolge]

---

**BISHERIGE STATIONEN**

• [Zeitraum] - [Firma] - [Rolle]
• [Zeitraum] - [Firma] - [Rolle]
(neueste zuerst)

---

BEISPIEL:

**ANFORDERUNGS-MATCHING**

**KPI-Dashboards und Echtzeit-Reporting**
✓ Pegel Pumpenanlagen (2020-2022) - Data Analytics Lead
✓ KPI-Dashboard entwickelt für Echtzeit-Identifikation profitabler Bereiche
✓ 45% Ausbau Wartungsgeschäft, 23% Profitabilitätssteigerung
✓ 5 Datenquellen integriert, 3 Monate Implementierung

**Python & Datenanalyse**
✓ XYZ Corp (2022-2024) - Senior Data Analyst
✓ 15 automatisierte Reports mit Python entwickelt
✓ 30% Zeitersparnis im Reporting-Prozess
✓ Pandas, NumPy, Matplotlib im täglichen Einsatz

**BISHERIGE STATIONEN**

• 2022-2024 - XYZ Corp - Senior Data Analyst
• 2020-2022 - Pegel Pumpenanlagen - Data Analytics Lead
• 2018-2020 - ABC GmbH - Junior Analyst

---

REGELN:
- NUR Fakten, KEINE Anschreiben-Sprache
- KEINE Motivation, KEINE "warum die Firma"
- Checkmarks (✓) für übersichtliches Matching
- Konkrete Zahlen, Daten, Fakten
- Kurz und prägnant - CV-Stil, nicht Anschreiben
- Chronologisch bei Stationen (neueste zuerst)`
    };

    const style = currentCV.coverLetterStyle || 'authentisch';

    if (style === 'strukturiert') {
      return `${styleInstructions[style]}

POSITION:
${jobRequirements.titel} bei ${jobRequirements.firma || 'dem Unternehmen'}

MUST-HAVE ANFORDERUNGEN:
${jobRequirements.mustHave?.join('\n') || 'Keine spezifischen Anforderungen angegeben'}

VERANTWORTLICHKEITEN:
${jobRequirements.responsibilities?.join('\n') || 'Keine'}

VERFÜGBARE PROJEKTERFAHRUNGEN:
${selectedExperiences.map((exp, idx) => `
${idx + 1}. ${exp.rolle} bei ${exp.firma} (${exp.zeitraum})
Achievements:
${exp.achievements?.map(a => `- ${a}`).join('\n') || '- ' + exp.details}
`).join('\n')}

AUFGABE:
Erstelle für jede Must-Have-Anforderung einen Abschnitt wie im FORMAT beschrieben.
Wähle für jede Anforderung das passendste Projekt aus und integriere es direkt im Fließtext.
NICHTS ANDERES - keine Einleitung, kein Abschluss, keine separate Projektliste!`;
    } else {
      return `Schreibe ein Anschreiben für folgende Position im Stil: ${style}

WICHTIG: ${styleInstructions[style]}

Persönliche Daten:
Name: ${masterCV.personal.name}
Titel: ${masterCV.personal.title || 'Nicht angegeben'}
Standort: ${masterCV.personal.location || 'Nicht angegeben'}

Position:
Titel: ${jobRequirements.titel}
Firma: ${jobRequirements.firma || 'Nicht angegeben'}

Must-Have Anforderungen:
${jobRequirements.mustHave?.join('\n') || 'Keine'}

Verantwortlichkeiten:
${jobRequirements.responsibilities?.join('\n') || 'Keine'}

Relevante Projekte & Erfolge:
${selectedExperiences.map((exp, idx) => `
${idx + 1}. ${exp.rolle} bei ${exp.firma} (${exp.zeitraum})
Highlights:
${exp.achievements?.slice(0, 3).map(a => `- ${a}`).join('\n') || '- ' + exp.details}
`).join('\n')}

STRUKTUR:
1. Einleitung: Direkt zum Punkt, warum diese Position (ohne "hiermit bewerbe ich mich")
2. Hauptteil: 2-3 konkrete Erfolge aus den Projekten, die zu den Anforderungen passen
3. Abschluss: Kurz, was ich mitbringe und nächste Schritte

Länge: ${style === 'direkt' ? '150-200 Wörter' : '250-350 Wörter'}

Schreibe NUR das Anschreiben, keine Erklärungen oder Meta-Kommentare.
Beginne NICHT mit Absenderadresse oder Betreff - nur der Text.`;
    }
  };

  const handleShowPrompt = () => {
    const prompt = generatePrompt();
    setPromptText(prompt);
    setCopyPasteMode(true);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    alert('Prompt in Zwischenablage kopiert! Füge ihn in ChatGPT/Claude ein.');
  };

  const handleSaveFromPaste = () => {
    if (pastedResult.trim()) {
      setCoverLetter(pastedResult);
      setEditedText(pastedResult);
      setCopyPasteMode(false);
      setPastedResult('');
    }
  };

  const handleExportPDF = () => {
    if (!currentCV.coverLetter) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header (Absender)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let yPos = 20;

      pdf.text(masterCV.personal.name, 20, yPos);
      yPos += 5;
      if (masterCV.personal.location) {
        pdf.text(masterCV.personal.location, 20, yPos);
        yPos += 5;
      }
      if (masterCV.personal.email) {
        pdf.text(masterCV.personal.email, 20, yPos);
        yPos += 5;
      }
      if (masterCV.personal.phone) {
        pdf.text(masterCV.personal.phone, 20, yPos);
        yPos += 5;
      }

      yPos += 10;

      // Empfänger
      if (jobRequirements?.firma) {
        pdf.text(jobRequirements.firma, 20, yPos);
        yPos += 10;
      }

      // Betreff
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Bewerbung als ${jobRequirements?.titel || 'Position'}`, 20, yPos);
      yPos += 10;

      // Anschreiben Text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const lines = pdf.splitTextToSize(currentCV.coverLetter, 170);
      const pageHeight = 297;
      const margin = 20;
      const lineHeight = 6;

      lines.forEach((line) => {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(line, 20, yPos);
        yPos += lineHeight;
      });

      // Grußformel
      yPos += 10;
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text('Mit freundlichen Grüßen', 20, yPos);
      yPos += 10;
      pdf.text(masterCV.personal.name, 20, yPos);

      const fileName = `Anschreiben_${masterCV.personal.name}_${jobRequirements?.titel || 'Position'}.pdf`
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating cover letter PDF:', error);
      alert('Fehler beim PDF-Export. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Anschreiben</h2>
          <p className="text-sm text-gray-600">AI-generiert, editierbar</p>
        </div>
        <div className="flex space-x-2">
          {currentCV.coverLetter && !editMode && (
            <>
              <button
                onClick={handleExportPDF}
                className="btn-primary text-sm"
              >
                📄 Als PDF exportieren
              </button>
              <button
                onClick={() => {
                  setEditedText(currentCV.coverLetter);
                  setEditMode(true);
                }}
                className="btn-secondary text-sm"
              >
                ✏️ Bearbeiten
              </button>
            </>
          )}
          {editMode && (
            <>
              <button onClick={handleSave} className="btn-primary text-sm">
                💾 Speichern
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedText(currentCV.coverLetter);
                }}
                className="btn-secondary text-sm"
              >
                Abbrechen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Style Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stil auswählen
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleChange(style.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                currentCV.coverLetterStyle === style.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-sm">{style.label}</div>
              <div className="text-xs text-gray-600 mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generiere...
            </span>
          ) : currentCV.coverLetter ? (
            '🔄 Neu generieren (API)'
          ) : (
            '✨ Mit API generieren'
          )}
        </button>
        <button
          onClick={handleShowPrompt}
          className="btn-secondary"
        >
          📋 Prompt für ChatGPT/Claude
        </button>
      </div>

      {/* Copy-Paste Mode */}
      {copyPasteMode && (
        <div className="mb-4 border border-blue-300 rounded-lg p-4 bg-blue-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-blue-900">Copy-Paste Modus</h3>
            <button
              onClick={() => setCopyPasteMode(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ✕ Schließen
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-blue-900">
                1. Prompt kopieren:
              </label>
              <button
                onClick={handleCopyPrompt}
                className="btn-primary text-sm"
              >
                📋 In Zwischenablage kopieren
              </button>
            </div>
            <textarea
              value={promptText}
              readOnly
              className="w-full h-64 p-3 border border-blue-200 rounded-lg bg-white text-sm font-mono"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              2. Ergebnis hier einfügen:
            </label>
            <textarea
              value={pastedResult}
              onChange={(e) => setPastedResult(e.target.value)}
              placeholder="Füge hier das generierte Anschreiben von ChatGPT/Claude ein..."
              className="w-full h-64 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSaveFromPaste}
            disabled={!pastedResult.trim()}
            className="btn-primary w-full"
          >
            💾 Anschreiben übernehmen
          </button>

          <p className="text-xs text-blue-700 mt-3">
            💡 Kopiere den Prompt oben und füge ihn in ChatGPT oder Claude ein.
            Kopiere dann das Ergebnis zurück in das untere Textfeld.
          </p>
        </div>
      )}

      {/* Cover Letter Preview/Edit */}
      {currentCV.coverLetter && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          {editMode ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-serif text-gray-800 leading-relaxed"
              placeholder="Anschreiben bearbeiten..."
            />
          ) : (
            <div className="prose max-w-none">
              <div className="whitespace-pre-line font-serif text-gray-800 leading-relaxed">
                {currentCV.coverLetter}
              </div>
            </div>
          )}

          {/* Word Count */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
            <span>
              Wörter: {(editMode ? editedText : currentCV.coverLetter).split(/\s+/).filter(Boolean).length}
            </span>
            <span>
              Stil: <span className="font-medium">{styles.find(s => s.id === currentCV.coverLetterStyle)?.label}</span>
            </span>
          </div>
        </div>
      )}

      {/* Tips */}
      {!currentCV.coverLetter && !isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tipp:</strong> Das Anschreiben wird basierend auf deinen ausgewählten Projekten
            und der Stellenausschreibung generiert. Du kannst es danach noch bearbeiten.
          </p>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator;

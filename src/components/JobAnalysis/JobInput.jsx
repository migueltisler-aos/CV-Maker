import { useState } from 'react';
import useCVStore from '../../store/cvStore';
import { analyzeJobRequirements, matchProjectsToJob } from '../../services/groqService';

const JobInput = () => {
  const {
    currentJob,
    setCurrentJob,
    setJobRequirements,
    setMatchedProjects,
    setCurrentStep,
    setLoading,
    isLoading,
    masterCV,
    updateCurrentCV,
    manualMode
  } = useCVStore();

  const [jobText, setJobText] = useState(currentJob || '');
  const [error, setError] = useState(null);

  // Manual Mode States
  const [step, setStep] = useState(1); // 1 = input, 2 = requirements, 3 = matching
  const [requirementsPrompt, setRequirementsPrompt] = useState('');
  const [requirementsResponse, setRequirementsResponse] = useState('');
  const [matchingPrompt, setMatchingPrompt] = useState('');
  const [matchingResponse, setMatchingResponse] = useState('');

  const generateRequirementsPrompt = () => {
    return `Analysiere folgende Stellenausschreibung und extrahiere die Informationen im JSON-Format.

Stellenausschreibung:
${jobText}

Extrahiere:
1. Must-Have Anforderungen (Pflicht-Qualifikationen)
2. Nice-to-Have Anforderungen (Wünschenswerte Qualifikationen)
3. Technische Skills (Software, Tools, Technologien)
4. Soft Skills
5. Hauptverantwortlichkeiten
6. Stellentitel
7. Firma (falls erwähnt)

Antworte NUR mit einem validen JSON-Objekt in folgendem Format:
{
  "titel": "string",
  "firma": "string oder null",
  "mustHave": ["string array"],
  "niceToHave": ["string array"],
  "technicalSkills": ["string array"],
  "softSkills": ["string array"],
  "responsibilities": ["string array"]
}`;
  };

  const generateMatchingPrompt = (requirements) => {
    return `Du bist ein Experte für CV-Optimierung. Matche folgende CV-Projekte mit den Job-Anforderungen.

Job-Anforderungen:
${JSON.stringify(requirements, null, 2)}

CV-Projekte:
${JSON.stringify(masterCV.experience.map((exp, idx) => ({
  id: idx,
  firma: exp.firma,
  rolle: exp.rolle,
  zeitraum: exp.zeitraum,
  details: exp.details
})), null, 2)}

Bewerte jedes Projekt auf einer Skala von 0.0 bis 1.0 basierend auf:
- Relevanz der Skills
- Übereinstimmung mit Verantwortlichkeiten
- Branchenrelevanz
- Seniorität/Level der Position

Antworte NUR mit einem validen JSON-Array in folgendem Format:
[
  {
    "projectId": 0,
    "score": 0.95,
    "reasoning": "Kurze Begründung warum dieses Projekt relevant ist",
    "matchedSkills": ["Skill1", "Skill2"],
    "matchedResponsibilities": ["Responsibility1"]
  }
]

Sortiere die Projekte nach Score (höchster zuerst).`;
  };

  const handleManualModeStep1 = () => {
    if (!jobText.trim()) {
      setError('Bitte füge eine Stellenausschreibung ein.');
      return;
    }
    setError(null);
    setRequirementsPrompt(generateRequirementsPrompt());
    setStep(2);
  };

  const handleManualModeStep2 = () => {
    try {
      // Parse the AI response
      const jsonMatch = requirementsResponse.match(/```json\n?([\s\S]*?)\n?```/) || requirementsResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : requirementsResponse;
      const requirements = JSON.parse(jsonText.trim());

      setCurrentJob(jobText);
      setJobRequirements(requirements);
      updateCurrentCV({
        jobTitle: requirements.titel || 'Unbekannte Position'
      });

      setMatchingPrompt(generateMatchingPrompt(requirements));
      setStep(3);
      setError(null);
    } catch (err) {
      setError('Fehler beim Parsen der AI-Antwort. Stelle sicher, dass es ein valides JSON ist.');
      console.error(err);
    }
  };

  const handleManualModeStep3 = () => {
    try {
      const jsonMatch = matchingResponse.match(/```json\n?([\s\S]*?)\n?```/) || matchingResponse.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : matchingResponse;
      const matchesRaw = JSON.parse(jsonText.trim());

      const matches = matchesRaw.map(match => ({
        ...match,
        experience: masterCV.experience[match.projectId]
      }));

      setMatchedProjects(matches);
      setCurrentStep('project-selection');
      setError(null);
    } catch (err) {
      setError('Fehler beim Parsen der AI-Antwort. Stelle sicher, dass es ein valides JSON ist.');
      console.error(err);
    }
  };

  const handleAutoAnalyze = async () => {
    if (!jobText.trim()) {
      setError('Bitte füge eine Stellenausschreibung ein.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const requirements = await analyzeJobRequirements(jobText);
      const matches = await matchProjectsToJob(masterCV.experience, requirements);

      setCurrentJob(jobText);
      setJobRequirements(requirements);
      setMatchedProjects(matches);
      updateCurrentCV({
        jobTitle: requirements.titel || 'Unbekannte Position'
      });

      setCurrentStep('project-selection');
    } catch (err) {
      console.error('Error:', err);
      setError('Fehler bei der Analyse: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exampleJob = `Geschäftsführer (m/w/d) - Digitale Transformation & Logistikoptimierung

Wir suchen einen erfahrenen Geschäftsführer mit starkem Fokus auf digitale Transformation und operative Exzellenz.

Ihre Aufgaben:
- Strategische und operative Gesamtverantwortung
- Aufbau und Führung von Teams (15-50 MA)
- Implementierung von KPI-Dashboards und digitalen Prozessen
- Optimierung von Logistik- und Lagerprozessen
- Budgetverantwortung und Kostenkontrolle
- Change Management und Prozessoptimierung

Ihr Profil:
- Mehrjährige Erfahrung in Geschäftsführung oder operativer Leitung
- Nachweisbare Erfolge in digitaler Transformation
- Erfahrung mit WMS, ERP, CRM-Systemen
- Projektmanagement-Kenntnisse
- Führungskompetenz und Change-Management-Erfahrung
- Betriebswirtschaftliches Studium oder vergleichbare Qualifikation

Nice to have:
- Python/SQL Kenntnisse für Datenanalyse
- Erfahrung mit Lean Management / Six Sigma
- Logistik- oder Supply Chain Background`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Stellenausschreibung analysieren</h2>
        <p className="text-gray-600 mb-6">
          {manualMode
            ? 'Kopiere die Prompts und füge die AI-Antworten ein (z.B. von ChatGPT, Claude, Groq).'
            : 'Füge den Text der Stellenausschreibung ein. Die KI wird automatisch die Anforderungen extrahieren.'
          }
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Manual Mode */}
        {manualMode && (
          <>
            {/* Step 1: Job Input */}
            {step === 1 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stellenausschreibung
                  </label>
                  <textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    className="input-field"
                    rows={15}
                    placeholder="Füge hier die Stellenausschreibung ein..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button onClick={handleManualModeStep1} className="btn-primary">
                    Weiter →
                  </button>
                  {!jobText && (
                    <button onClick={() => setJobText(exampleJob)} className="btn-secondary">
                      Beispiel laden
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Requirements Analysis */}
            {step === 2 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schritt 1: Kopiere diesen Prompt in deine AI
                  </label>
                  <div className="relative">
                    <textarea
                      value={requirementsPrompt}
                      readOnly
                      className="input-field bg-gray-50 font-mono text-sm"
                      rows={10}
                    />
                    <button
                      onClick={() => copyToClipboard(requirementsPrompt)}
                      className="absolute top-2 right-2 btn-secondary text-xs"
                    >
                      📋 Kopieren
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schritt 2: Füge die AI-Antwort hier ein
                  </label>
                  <textarea
                    value={requirementsResponse}
                    onChange={(e) => setRequirementsResponse(e.target.value)}
                    className="input-field font-mono text-sm"
                    rows={10}
                    placeholder='{"titel": "...", "firma": "...", ...}'
                  />
                </div>

                <div className="flex space-x-4">
                  <button onClick={handleManualModeStep2} className="btn-primary">
                    Weiter →
                  </button>
                  <button onClick={() => setStep(1)} className="btn-secondary">
                    ← Zurück
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Project Matching */}
            {step === 3 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schritt 3: Kopiere diesen Prompt in deine AI
                  </label>
                  <div className="relative">
                    <textarea
                      value={matchingPrompt}
                      readOnly
                      className="input-field bg-gray-50 font-mono text-sm"
                      rows={10}
                    />
                    <button
                      onClick={() => copyToClipboard(matchingPrompt)}
                      className="absolute top-2 right-2 btn-secondary text-xs"
                    >
                      📋 Kopieren
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schritt 4: Füge die AI-Antwort hier ein
                  </label>
                  <textarea
                    value={matchingResponse}
                    onChange={(e) => setMatchingResponse(e.target.value)}
                    className="input-field font-mono text-sm"
                    rows={10}
                    placeholder='[{"projectId": 0, "score": 0.95, ...}, ...]'
                  />
                </div>

                <div className="flex space-x-4">
                  <button onClick={handleManualModeStep3} className="btn-primary">
                    Projekte auswählen →
                  </button>
                  <button onClick={() => setStep(2)} className="btn-secondary">
                    ← Zurück
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* API Mode (original) */}
        {!manualMode && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stellenausschreibung
              </label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                className="input-field"
                rows={15}
                placeholder="Füge hier die Stellenausschreibung ein..."
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleAutoAnalyze}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analysiere...
                  </span>
                ) : (
                  'Analyse starten'
                )}
              </button>

              {!jobText && (
                <button onClick={() => setJobText(exampleJob)} className="btn-secondary">
                  Beispiel laden
                </button>
              )}
            </div>

            {isLoading && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  🤖 KI analysiert die Stellenausschreibung und matched deine Projekte...
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobInput;

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
    updateCurrentCV
  } = useCVStore();

  const [jobText, setJobText] = useState(currentJob || '');
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      setError('Bitte füge eine Stellenausschreibung ein.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Stellenanzeige analysieren
      console.log('Analysiere Stellenanzeige...');
      const requirements = await analyzeJobRequirements(jobText);
      console.log('Requirements:', requirements);

      // 2. Projekte matchen
      console.log('Matche Projekte...');
      const matches = await matchProjectsToJob(masterCV.experience, requirements);
      console.log('Matches:', matches);

      // 3. State aktualisieren
      setCurrentJob(jobText);
      setJobRequirements(requirements);
      setMatchedProjects(matches);
      updateCurrentCV({
        jobTitle: requirements.titel || 'Unbekannte Position'
      });

      // 4. Zum nächsten Schritt
      setCurrentStep('project-selection');
    } catch (err) {
      console.error('Error:', err);
      setError('Fehler bei der Analyse: ' + err.message);
    } finally {
      setLoading(false);
    }
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
          Füge den Text der Stellenausschreibung ein. Die KI wird automatisch die Anforderungen extrahieren
          und passende Projekte aus deinem Master CV vorschlagen.
        </p>

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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleAnalyze}
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
            <button
              onClick={() => setJobText(exampleJob)}
              className="btn-secondary"
            >
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
      </div>
    </div>
  );
};

export default JobInput;

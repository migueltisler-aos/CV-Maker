const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.1-70b-versatile';

/**
 * Extrahiert Anforderungen aus einer Stellenausschreibung
 * @param {string} jobText - Der Text der Stellenausschreibung
 * @returns {Promise<Object>} - Strukturierte Anforderungen
 */
export async function analyzeJobRequirements(jobText) {
  const prompt = `Analysiere folgende Stellenausschreibung und extrahiere die Informationen im JSON-Format.

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

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extrahiere JSON aus der Antwort (falls Markdown-Code-Block)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Error analyzing job requirements:', error);
    throw error;
  }
}

/**
 * Matched CV-Projekte mit Job-Requirements
 * @param {Array} experiences - Array von CV-Erfahrungen
 * @param {Object} requirements - Job-Requirements
 * @returns {Promise<Array>} - Sortierte Projekte mit Relevanz-Score
 */
export async function matchProjectsToJob(experiences, requirements) {
  const prompt = `Du bist ein Experte für CV-Optimierung. Matche folgende CV-Projekte mit den Job-Anforderungen.

Job-Anforderungen:
${JSON.stringify(requirements, null, 2)}

CV-Projekte:
${JSON.stringify(experiences.map((exp, idx) => ({
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

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extrahiere JSON aus der Antwort
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const matches = JSON.parse(jsonText.trim());

    // Füge die vollständigen Erfahrungen hinzu
    return matches.map(match => ({
      ...match,
      experience: experiences[match.projectId]
    }));
  } catch (error) {
    console.error('Error matching projects:', error);
    throw error;
  }
}

/**
 * Schlägt relevante Skills für den Radar-Chart vor
 * @param {Object} requirements - Job-Requirements
 * @param {Array} allSkills - Alle verfügbaren Skills aus Master CV
 * @returns {Promise<Array>} - Top 8-10 Skills für den Chart
 */
export async function suggestTopSkills(requirements, allSkills) {
  const prompt = `Basierend auf den Job-Anforderungen, wähle die 8-10 wichtigsten Skills aus der Liste aus.

Job-Anforderungen:
${JSON.stringify(requirements, null, 2)}

Verfügbare Skills:
${JSON.stringify(allSkills, null, 2)}

Wähle die Skills aus, die:
1. In den Anforderungen explizit erwähnt werden
2. Für die Position am wichtigsten sind
3. Eine gute Mischung aus Technical & Soft Skills bieten

Antworte NUR mit einem validen JSON-Array der Skill-Namen (max 10):
["Skill1", "Skill2", "Skill3", ...]`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extrahiere JSON aus der Antwort
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Error suggesting skills:', error);
    throw error;
  }
}

/**
 * Generiert ein authentisches Anschreiben
 * @param {Object} personal - Persönliche Daten
 * @param {Object} requirements - Job-Requirements
 * @param {Array} selectedExperiences - Ausgewählte Projekte
 * @param {string} style - Stil: 'authentisch', 'professionell', 'direkt'
 * @returns {Promise<string>} - Anschreiben Text
 */
export async function generateCoverLetter(personal, requirements, selectedExperiences, style = 'authentisch') {
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

    strukturiert: `Erstelle ein strukturiertes Anschreiben, das jede Anforderung direkt mit dem passenden Projekt verbindet.

FORMAT:

Für jede Must-Have-Anforderung:
1. Überschrift: **[Name der Anforderung]**
2. Fließtext (ca. 5 Sätze): Erkläre authentisch, wie du diese Anforderung durch ein konkretes Projekt erfüllst
   - Wähle das passendste Projekt für diese Anforderung
   - Benenne Firma, Rolle, Zeitraum direkt im Text
   - Nutze konkrete Zahlen, Daten, Fakten aus den Achievements
   - Schreibe wie ein Mensch - authentisch, nicht zu glatt
   - Zeige messbare Ergebnisse und Impact

Beispiel:
**KPI-Dashboards und Echtzeit-Reporting**
Bei Pegel Pumpenanlagen (2020-2022) habe ich als Data Analytics Lead ein KPI-Dashboard entwickelt, das in Echtzeit profitable Geschäftsbereiche identifiziert. Das System ermöglichte der Geschäftsführung erstmals datenbasierte Entscheidungen zur Ressourcenallokation. Durch die Transparenz konnten wir das Wartungsgeschäft gezielt um 45% ausbauen und die Profitabilität um 23% steigern. Die Implementierung dauerte 3 Monate und umfasste die Integration von 5 verschiedenen Datenquellen. Seitdem nutzt das gesamte Management-Team täglich die Dashboards für operative Entscheidungen.

REGELN:
- KEINE einleitenden Floskeln oder Grußformeln
- KEINE Abschlussformeln
- KEINE separate Projektliste am Ende (Projekte sind bereits bei den Anforderungen integriert!)
- Authentisch schreiben - keine Marketing-Sprache
- Konkrete Zahlen und Fakten verwenden
- Ca. 5 Sätze pro Anforderung
- Jede Anforderung mit dem passendsten Projekt belegen`
  };

  let prompt;

  if (style === 'strukturiert') {
    prompt = `${styleInstructions[style]}

POSITION:
${requirements.titel} bei ${requirements.firma || 'dem Unternehmen'}

MUST-HAVE ANFORDERUNGEN:
${requirements.mustHave?.join('\n') || 'Keine spezifischen Anforderungen angegeben'}

VERANTWORTLICHKEITEN:
${requirements.responsibilities?.join('\n') || 'Keine'}

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
    prompt = `Schreibe ein Anschreiben für folgende Position im Stil: ${style}

WICHTIG: ${styleInstructions[style]}

Persönliche Daten:
Name: ${personal.name}
Titel: ${personal.title || 'Nicht angegeben'}
Standort: ${personal.location || 'Nicht angegeben'}

Position:
Titel: ${requirements.titel}
Firma: ${requirements.firma || 'Nicht angegeben'}

Must-Have Anforderungen:
${requirements.mustHave?.join('\n') || 'Keine'}

Verantwortlichkeiten:
${requirements.responsibilities?.join('\n') || 'Keine'}

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

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Experte für authentische, überzeugende Bewerbungsschreiben. Du vermeidest Klischees und Standardformulierungen.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Höher für mehr Kreativität
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

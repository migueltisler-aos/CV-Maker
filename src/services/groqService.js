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

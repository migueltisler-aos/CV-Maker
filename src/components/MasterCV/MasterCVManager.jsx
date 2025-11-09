import { useState } from 'react';
import useCVStore from '../../store/cvStore';

const MasterCVManager = () => {
  const { masterCV, setMasterCV, manualMode } = useCVStore();
  const [formData, setFormData] = useState(masterCV || {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      address: '',
      linkedin: '',
    },
    experience: [],
    skills: [],
    education: [],
    certifications: [],
  });

  const [csvInput, setCsvInput] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(!masterCV);
  const [step, setStep] = useState(1); // 1 = CSV input, 2 = AI processing
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [editMode, setEditMode] = useState(false);

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const experiences = [];
    const education = [];
    const certifications = [];

    lines.slice(1).forEach(line => {
      // Split by comma, aber beachte Kommas in Anführungszeichen
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const cleanParts = parts.map(p => p.replace(/^"|"$/g, '').trim());

      if (cleanParts.length >= 6) {
        const [bereich, firma, rolle, zeitraum, ort, details] = cleanParts;

        const item = {
          id: `${bereich}_${Date.now()}_${Math.random()}`,
          firma: firma || '',
          rolle: rolle || '',
          zeitraum: zeitraum || '',
          ort: ort || '',
          details: details || '',
        };

        if (bereich === 'Berufserfahrung') {
          // Details in Achievements aufteilen (getrennt durch |)
          item.achievements = details ? details.split('|').map(a => a.trim()).filter(Boolean) : [];
          experiences.push(item);
        } else if (bereich === 'Ausbildung') {
          education.push({
            id: item.id,
            degree: rolle || firma || '',
            institution: firma || '',
            year: zeitraum || '',
          });
        } else if (bereich === 'Weiterbildung') {
          certifications.push({
            id: item.id,
            name: rolle || firma || '',
            year: zeitraum || '',
          });
        }
      }
    });

    return { experiences, education, certifications };
  };

  const generateAIPrompt = () => {
    const prompt = `Analysiere folgende CV-Daten im CSV-Format und strukturiere sie.

CSV-Daten:
${csvInput}

WICHTIGE REGELN:
1. Parse die CSV-Daten (Format: Bereich, Firma/Projekt, Rolle/Titel, Zeitraum, Ort, Details)
2. BEHALTE ALLE Details/Achievements 1:1 bei - NICHT kürzen, zusammenfassen oder umformulieren!
3. Details mit "|" Trennung sind separate Achievements → als Array aufteilen
4. Extrahiere Skills aus ALLEN Details (technische und soft skills)
5. Bewerte jede Skill auf einer Skala von 1-10 basierend auf Häufigkeit und Kontext
6. Kategorisiere Skills: Technical (WMS, ERP, SQL, Python, etc.), Soft (Führung, Projektmanagement, etc.), Tools (Excel, CRM, etc.)

Antworte NUR mit einem validen JSON-Objekt:
{
  "experience": [
    {
      "id": "unique_id",
      "firma": "Firmenname",
      "rolle": "Position",
      "zeitraum": "MM/YYYY - MM/YYYY",
      "ort": "Stadt",
      "details": "Vollständiger Originaltext aus CSV",
      "achievements": ["EXAKTES Achievement 1 aus CSV", "EXAKTES Achievement 2 aus CSV", "..."]
    }
  ],
  "education": [
    {
      "id": "unique_id",
      "degree": "Abschluss",
      "institution": "Institution",
      "year": "YYYY"
    }
  ],
  "certifications": [
    {
      "id": "unique_id",
      "name": "Zertifikat",
      "year": "YYYY"
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "level": 8,
      "category": "Technical"
    }
  ]
}

BEISPIEL:
CSV: "KPI-Dashboard | Recruiting +25% | Team aufgebaut"
JSON: "achievements": ["KPI-Dashboard", "Recruiting +25%", "Team aufgebaut"]`;
    return prompt;
  };

  const handleGeneratePrompt = () => {
    const prompt = generateAIPrompt();
    setAiPrompt(prompt);
    setStep(2);
  };

  const handleParseAIResponse = () => {
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Kein JSON gefunden in der Antwort');
      }
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText.trim());

      const newMasterCV = {
        ...formData,
        experience: parsed.experience || [],
        education: parsed.education || [],
        certifications: parsed.certifications || [],
        skills: parsed.skills || [],
      };

      setFormData(newMasterCV);
      setShowCSVImport(false);
      setEditMode(true);
    } catch (error) {
      alert('Fehler beim Parsen der KI-Antwort: ' + error.message);
      console.error(error);
    }
  };

  const handleCSVImport = () => {
    try {
      const parsed = parseCSV(csvInput);

      // Extrahiere Skills aus den Achievements
      const skillsSet = new Set();
      parsed.experiences.forEach(exp => {
        exp.achievements?.forEach(achievement => {
          // Einfache Keyword-Extraktion (kann später verbessert werden)
          const keywords = ['Python', 'SQL', 'Excel', 'KPI', 'Dashboard', 'Projektmanagement',
                          'Führung', 'Logistik', 'WMS', 'ERP', 'CRM', 'Digitalisierung'];
          keywords.forEach(keyword => {
            if (achievement.includes(keyword)) {
              skillsSet.add(keyword);
            }
          });
        });
      });

      const skills = Array.from(skillsSet).map(name => ({
        name,
        level: 7, // Default level
        category: 'Technical'
      }));

      const newMasterCV = {
        ...formData,
        experience: parsed.experiences,
        education: parsed.education,
        certifications: parsed.certifications,
        skills,
      };

      setFormData(newMasterCV);
      setShowCSVImport(false);
    } catch (error) {
      alert('Fehler beim Import. Bitte überprüfe das CSV-Format.');
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    const lines = ['Bereich,Firma/Projekt,Rolle/Titel,Zeitraum,Ort,Details'];

    formData.experience.forEach(exp => {
      const details = exp.achievements?.join(' | ') || exp.details;
      lines.push(`Berufserfahrung,"${exp.firma}","${exp.rolle}","${exp.zeitraum}","${exp.ort}","${details}"`);
    });

    formData.education.forEach(edu => {
      lines.push(`Ausbildung,"${edu.institution}","${edu.degree}","${edu.year}",,`);
    });

    formData.certifications.forEach(cert => {
      lines.push(`Weiterbildung,,"${cert.name}","${cert.year}",,`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Master_CV_${formData.personal.name || 'Export'}.csv`;
    link.click();
  };

  const handleEditExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleEditSkill = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const handleDeleteExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddExperience = () => {
    const newExp = {
      id: `exp_${Date.now()}`,
      firma: '',
      rolle: '',
      zeitraum: '',
      ort: '',
      details: '',
      achievements: []
    };
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const handleAddSkill = () => {
    const newSkill = {
      name: '',
      level: 5,
      category: 'Technical'
    };
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const handleAddEducation = () => {
    const newEdu = {
      id: `edu_${Date.now()}`,
      degree: '',
      institution: '',
      year: ''
    };
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const handleAddCertification = () => {
    const newCert = {
      id: `cert_${Date.now()}`,
      name: '',
      year: ''
    };
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert]
    }));
  };

  const handleEditEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleDeleteEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEditCertification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const handleDeleteCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    if (!formData.personal.name) {
      alert('Bitte gib mindestens deinen Namen ein.');
      return;
    }
    setMasterCV(formData);
  };

  if (showCSVImport) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Master CV importieren</h2>

          {step === 1 && (
            <>
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-600">
                  Füge deine CV-Daten im CSV-Format ein (Format: Bereich, Firma/Projekt, Rolle/Titel, Zeitraum, Ort, Details)
                </p>
                <button
                  onClick={() => {
                    const example = `Bereich,Firma/Projekt,Rolle/Titel,Zeitraum,Ort,Details
Berufserfahrung,Pegel Pumpenanlagen GmbH,Geschäftsleiter,10/2024 – 09/2025,Berlin,"KPI-Dashboard erstellt | Recruiting +25% | Team aufgebaut"
Berufserfahrung,TechCorp AG,Senior Manager,01/2022 – 09/2024,München,"Digitalisierung Logistik | Kostenreduktion 30% | WMS Implementierung"
Ausbildung,Technische Universität Berlin,Master Wirtschaftsingenieurwesen,2020,Berlin,
Weiterbildung,,Scrum Master Zertifikat,2021,,`;
                    setCsvInput(example);
                  }}
                  className="btn-secondary text-sm whitespace-nowrap ml-4"
                >
                  📝 Beispiel laden
                </button>
              </div>

              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="input-field font-mono text-sm mb-4"
                rows={15}
                placeholder={`Bereich,Firma/Projekt,Rolle/Titel,Zeitraum,Ort,Details
Berufserfahrung,Pegel Pumpenanlagen GmbH,Geschäftsleiter,10/2024 – 09/2025,Berlin,"KPI-Dashboard | Recruiting +25%"`}
              />

              <div className="flex flex-col space-y-2">
                {!csvInput.trim() && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Bitte füge zuerst CSV-Daten im Textfeld oben ein
                  </p>
                )}
                <div className="flex space-x-4">
                  {manualMode ? (
                    <button
                      onClick={handleGeneratePrompt}
                      disabled={!csvInput.trim()}
                      className={`btn-primary ${!csvInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!csvInput.trim() ? 'Bitte füge zuerst CSV-Daten ein' : 'Klicke hier um den KI-Prompt zu generieren'}
                    >
                      📋 Prompt für KI generieren
                    </button>
                  ) : (
                    <button onClick={handleCSVImport} className="btn-primary">
                      CSV Importieren (Lokal)
                    </button>
                  )}
                  <button
                    onClick={() => setShowCSVImport(false)}
                    className="btn-secondary"
                  >
                    Manuell eingeben
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Schritt 1: Prompt kopieren</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiPrompt);
                      alert('Prompt kopiert!');
                    }}
                    className="btn-secondary text-sm"
                  >
                    📋 Kopieren
                  </button>
                </div>
                <textarea
                  value={aiPrompt}
                  readOnly
                  className="input-field font-mono text-sm mb-2"
                  rows={12}
                />
                <p className="text-sm text-gray-600">
                  Kopiere diesen Prompt und füge ihn in ChatGPT, Claude oder eine andere KI ein.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Schritt 2: KI-Antwort einfügen</h3>
                <textarea
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  className="input-field font-mono text-sm mb-2"
                  rows={12}
                  placeholder="Füge hier die JSON-Antwort der KI ein..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleParseAIResponse}
                  disabled={!aiResponse.trim()}
                  className="btn-primary"
                >
                  ✓ Antwort verarbeiten
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  ← Zurück
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Master CV {masterCV ? 'bearbeiten' : 'erstellen'}</h2>
          {formData.experience.length === 0 && (
            <button
              onClick={() => setShowCSVImport(true)}
              className="btn-secondary text-sm"
            >
              CSV Import
            </button>
          )}
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Persönliche Informationen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.personal.name}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                className="input-field"
                placeholder="Miguel Tisler"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
              <input
                type="text"
                value={formData.personal.title}
                onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                className="input-field"
                placeholder="Operations & Logistics Leader"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                value={formData.personal.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                className="input-field"
                placeholder="m.tisler@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.personal.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                className="input-field"
                placeholder="+49 123 456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
              <input
                type="text"
                value={formData.personal.location}
                onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                className="input-field"
                placeholder="Berlin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={formData.personal.address || ''}
                onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                className="input-field"
                placeholder="Musterstraße 123, 12345 Berlin"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="text"
                value={formData.personal.linkedin}
                onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                className="input-field"
                placeholder="linkedin.com/in/username"
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Importierte Daten</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className="btn-secondary text-sm"
              >
                {editMode ? '👁️ Ansicht' : '✏️ Bearbeiten'}
              </button>
              {formData.experience.length > 0 && (
                <button onClick={handleExportCSV} className="btn-secondary text-sm">
                  📥 CSV Export
                </button>
              )}
            </div>
          </div>

          {!editMode ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Berufserfahrung:</strong> {formData.experience.length} Positionen<br />
                <strong>Ausbildung:</strong> {formData.education.length} Einträge<br />
                <strong>Weiterbildungen:</strong> {formData.certifications.length} Zertifikate<br />
                <strong>Skills:</strong> {formData.skills.length} extrahiert
              </p>
            </div>
          ) : (
            <>
              {/* Experience Edit Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Berufserfahrung ({formData.experience.length})</h4>
                  <button
                    onClick={handleAddExperience}
                    className="btn-secondary text-sm"
                  >
                    ➕ Hinzufügen
                  </button>
                </div>
                {formData.experience.length > 0 && (
                  <div className="space-y-4">
                    {formData.experience.map((exp, index) => (
                      <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={exp.firma}
                            onChange={(e) => handleEditExperience(index, 'firma', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Firma"
                          />
                          <input
                            type="text"
                            value={exp.rolle}
                            onChange={(e) => handleEditExperience(index, 'rolle', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Rolle"
                          />
                          <input
                            type="text"
                            value={exp.zeitraum}
                            onChange={(e) => handleEditExperience(index, 'zeitraum', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Zeitraum"
                          />
                          <input
                            type="text"
                            value={exp.ort}
                            onChange={(e) => handleEditExperience(index, 'ort', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Ort"
                          />
                        </div>
                        <textarea
                          value={exp.achievements?.join(' | ') || exp.details}
                          onChange={(e) => {
                            const achievements = e.target.value.split('|').map(a => a.trim()).filter(Boolean);
                            handleEditExperience(index, 'achievements', achievements);
                          }}
                          className="input-field text-sm mb-2"
                          rows={3}
                          placeholder="Achievements (getrennt durch |)"
                        />
                        <button
                          onClick={() => handleDeleteExperience(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education Edit Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Ausbildung ({formData.education.length})</h4>
                  <button
                    onClick={handleAddEducation}
                    className="btn-secondary text-sm"
                  >
                    ➕ Hinzufügen
                  </button>
                </div>
                {formData.education.length > 0 && (
                  <div className="space-y-3">
                    {formData.education.map((edu, index) => (
                      <div key={edu.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleEditEducation(index, 'institution', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Institution"
                          />
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => handleEditEducation(index, 'year', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Jahr"
                          />
                        </div>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEditEducation(index, 'degree', e.target.value)}
                          className="input-field text-sm mb-2"
                          placeholder="Abschluss"
                        />
                        <button
                          onClick={() => handleDeleteEducation(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications Edit Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Weiterbildungen ({formData.certifications.length})</h4>
                  <button
                    onClick={handleAddCertification}
                    className="btn-secondary text-sm"
                  >
                    ➕ Hinzufügen
                  </button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="space-y-3">
                    {formData.certifications.map((cert, index) => (
                      <div key={cert.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => handleEditCertification(index, 'name', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Name der Weiterbildung"
                          />
                          <input
                            type="text"
                            value={cert.year}
                            onChange={(e) => handleEditCertification(index, 'year', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Jahr"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteCertification(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Edit Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Skills ({formData.skills.length})</h4>
                  <button
                    onClick={handleAddSkill}
                    className="btn-secondary text-sm"
                  >
                    ➕ Hinzufügen
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center space-x-3">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => handleEditSkill(index, 'name', e.target.value)}
                          className="input-field text-sm flex-1"
                          placeholder="Skill"
                        />
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={skill.level}
                          onChange={(e) => handleEditSkill(index, 'level', parseInt(e.target.value))}
                          className="input-field text-sm w-16"
                          placeholder="Level"
                        />
                        <select
                          value={skill.category}
                          onChange={(e) => handleEditSkill(index, 'category', e.target.value)}
                          className="input-field text-sm w-32"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Soft">Soft</option>
                          <option value="Tools">Tools</option>
                          <option value="Other">Other</option>
                        </select>
                        <button
                          onClick={() => handleDeleteSkill(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button onClick={handleSave} className="btn-primary">
            {masterCV ? 'Änderungen speichern' : 'Master CV speichern'}
          </button>
          {formData.experience.length === 0 && (
            <button onClick={() => setShowCSVImport(true)} className="btn-secondary">
              CSV Daten importieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterCVManager;

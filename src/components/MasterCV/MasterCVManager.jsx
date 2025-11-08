import { useState } from 'react';
import useCVStore from '../../store/cvStore';

const MasterCVManager = () => {
  const { masterCV, setMasterCV } = useCVStore();
  const [formData, setFormData] = useState(masterCV || {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
    },
    experience: [],
    skills: [],
    education: [],
    certifications: [],
  });

  const [csvInput, setCsvInput] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(!masterCV);

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
          <p className="text-gray-600 mb-6">
            Füge deine CV-Daten im CSV-Format ein (Format: Bereich, Firma/Projekt, Rolle/Titel, Zeitraum, Ort, Details)
          </p>

          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="input-field font-mono text-sm mb-4"
            rows={15}
            placeholder={`Bereich,Firma/Projekt,Rolle/Titel,Zeitraum,Ort,Details
Berufserfahrung,Pegel Pumpenanlagen GmbH,Geschäftsleiter,10/2024 – 09/2025,Berlin,"KPI-Dashboard | Recruiting +25%"`}
          />

          <div className="flex space-x-4">
            <button onClick={handleCSVImport} className="btn-primary">
              CSV Importieren
            </button>
            <button
              onClick={() => setShowCSVImport(false)}
              className="btn-secondary"
            >
              Manuell eingeben
            </button>
          </div>
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
          <h3 className="text-lg font-semibold mb-2">Importierte Daten</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Berufserfahrung:</strong> {formData.experience.length} Positionen<br />
              <strong>Ausbildung:</strong> {formData.education.length} Einträge<br />
              <strong>Weiterbildungen:</strong> {formData.certifications.length} Zertifikate<br />
              <strong>Skills:</strong> {formData.skills.length} extrahiert
            </p>
          </div>
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

import { useState, useEffect } from 'react';
import useCVStore from '../../store/cvStore';
import { suggestTopSkills } from '../../services/groqService';

const CVBuilder = () => {
  const {
    masterCV,
    jobRequirements,
    setSelectedSkills,
    setCurrentStep,
    currentCV,
    isLoading,
    setLoading,
  } = useCVStore();

  const [skills, setSkills] = useState(currentCV.selectedSkills || []);
  const [aiSuggested, setAiSuggested] = useState(false);

  useEffect(() => {
    // Auto-suggest skills on mount if not already done
    if (skills.length === 0 && !aiSuggested && jobRequirements) {
      handleAISuggest();
    }
  }, []);

  const handleAISuggest = async () => {
    setLoading(true);
    try {
      const allSkills = masterCV.skills || [];

      // Extrahiere Must-Have Technical Skills aus Job Requirements
      const mustHaveSkills = jobRequirements?.technicalSkills || [];

      const suggestedNames = await suggestTopSkills(jobRequirements, allSkills);

      // Match suggested names with master CV skills
      const matched = allSkills.filter(skill =>
        suggestedNames.some(name =>
          name.toLowerCase().includes(skill.name.toLowerCase()) ||
          skill.name.toLowerCase().includes(name.toLowerCase())
        )
      );

      // Match Must-Have Skills with master CV skills
      const mustHaveMatched = allSkills.filter(skill =>
        mustHaveSkills.some(name =>
          skill.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(skill.name.toLowerCase())
        )
      );

      // Add Must-Have Skills that are NOT in master CV
      const newMustHaveSkills = mustHaveSkills
        .filter(name =>
          !matched.some(s => s.name.toLowerCase().includes(name.toLowerCase())) &&
          !mustHaveMatched.some(s => s.name.toLowerCase().includes(name.toLowerCase()))
        )
        .map(name => ({
          name,
          level: 7,
          category: 'Technical'
        }));

      // Add any other suggested skills not in master CV
      const newSkills = suggestedNames
        .filter(name =>
          !matched.some(s => s.name.toLowerCase() === name.toLowerCase()) &&
          !mustHaveMatched.some(s => s.name.toLowerCase().includes(name.toLowerCase())) &&
          !newMustHaveSkills.some(s => s.name.toLowerCase() === name.toLowerCase())
        )
        .map(name => ({
          name,
          level: 7,
          category: 'Technical'
        }));

      // Priorität: Must-Have Skills zuerst, dann matched, dann neue
      const combined = [...mustHaveMatched, ...newMustHaveSkills, ...matched, ...newSkills].slice(0, 10);
      setSkills(combined);
      setAiSuggested(true);
    } catch (error) {
      console.error('Error suggesting skills:', error);
      // Fallback: use Must-Have technical skills + master CV skills
      const mustHaveSkills = (jobRequirements?.technicalSkills || []).map(name => ({
        name,
        level: 7,
        category: 'Technical'
      }));
      const fallback = [...mustHaveSkills, ...(masterCV.skills || [])].slice(0, 10);
      setSkills(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillLevelChange = (index, newLevel) => {
    setSkills(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], level: parseInt(newLevel) };
      return updated;
    });
  };

  const handleRemoveSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    setSkills(prev => [...prev, { name: '', level: 5, category: 'Technical' }]);
  };

  const handleSkillNameChange = (index, newName) => {
    setSkills(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  };

  const handleContinue = () => {
    const validSkills = skills.filter(s => s.name.trim() !== '');
    setSelectedSkills(validSkills);
    setCurrentStep('preview');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Skills auswählen & bewerten</h2>
            <p className="text-sm text-gray-600 mt-1">
              Diese Skills werden im Radar-Chart auf deinem CV angezeigt (1-10 Skala)
            </p>
          </div>
          {!isLoading && (
            <button onClick={handleAISuggest} className="btn-secondary text-sm">
              🤖 AI Vorschläge
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">KI analysiert relevante Skills...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => handleSkillNameChange(index, e.target.value)}
                      className="input-field"
                      placeholder="Skill Name (z.B. Python, Projektmanagement)"
                    />
                  </div>

                  <div className="w-48">
                    <label className="block text-xs text-gray-600 mb-1">
                      Level: {skill.level}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={skill.level}
                      onChange={(e) => handleSkillLevelChange(index, e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Anfänger</span>
                      <span>Experte</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold">{skill.level}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {skills.length < 10 && (
              <button
                onClick={handleAddSkill}
                className="btn-secondary w-full mb-6"
              >
                + Skill hinzufügen
              </button>
            )}

            {skills.length > 10 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Für eine optimale Darstellung empfehlen wir maximal 10 Skills im Radar-Chart.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t">
              <button
                onClick={() => setCurrentStep('project-selection')}
                className="btn-secondary"
              >
                ← Zurück
              </button>
              <button
                onClick={handleContinue}
                disabled={skills.filter(s => s.name.trim()).length === 0}
                className="btn-primary"
              >
                Weiter zur Vorschau →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview of selected skills */}
      {skills.length > 0 && !isLoading && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-3">Skill-Übersicht</h3>
          <div className="grid grid-cols-2 gap-2">
            {skills
              .filter(s => s.name.trim())
              .sort((a, b) => b.level - a.level)
              .map((skill, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${skill.level * 10}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">{skill.level}/10</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CVBuilder;

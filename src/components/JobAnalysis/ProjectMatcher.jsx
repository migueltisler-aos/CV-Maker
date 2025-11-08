import { useState, useEffect } from 'react';
import useCVStore from '../../store/cvStore';

const ProjectMatcher = () => {
  const {
    matchedProjects,
    jobRequirements,
    setSelectedProjects,
    setCurrentStep,
    currentCV,
  } = useCVStore();

  const [selectedIds, setSelectedIds] = useState(currentCV.selectedProjects || []);

  useEffect(() => {
    // Auto-select top 3 projects
    if (selectedIds.length === 0 && matchedProjects.length > 0) {
      const topProjects = matchedProjects
        .slice(0, 3)
        .map(m => m.experience.id);
      setSelectedIds(topProjects);
    }
  }, [matchedProjects]);

  const toggleProject = (projectId) => {
    setSelectedIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleContinue = () => {
    setSelectedProjects(selectedIds);
    setCurrentStep('skill-selection');
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Sehr relevant';
    if (score >= 0.6) return 'Relevant';
    if (score >= 0.4) return 'Teilweise relevant';
    return 'Weniger relevant';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Job Requirements Summary */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-3">Analysierte Anforderungen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Position</h3>
            <p className="text-lg">{jobRequirements?.titel || 'N/A'}</p>
          </div>
          {jobRequirements?.firma && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Firma</h3>
              <p className="text-lg">{jobRequirements.firma}</p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Must-Have Skills</h3>
            <div className="flex flex-wrap gap-2">
              {jobRequirements?.mustHave?.slice(0, 5).map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  {skill}
                </span>
              ))}
              {jobRequirements?.mustHave?.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{jobRequirements.mustHave.length - 5} mehr
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {jobRequirements?.technicalSkills?.slice(0, 5).map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {skill}
                </span>
              ))}
              {jobRequirements?.technicalSkills?.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{jobRequirements.technicalSkills.length - 5} mehr
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Selection */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Projekte auswählen</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedIds.length} von {matchedProjects.length} Projekten ausgewählt
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={selectedIds.length === 0}
            className="btn-primary"
          >
            Weiter zu Skills
          </button>
        </div>

        <div className="space-y-4">
          {matchedProjects.map((match) => {
            const isSelected = selectedIds.includes(match.experience.id);
            const scorePercent = Math.round(match.score * 100);

            return (
              <div
                key={match.experience.id}
                onClick={() => toggleProject(match.experience.id)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{match.experience.rolle}</h3>
                        <p className="text-sm text-gray-600">
                          {match.experience.firma} • {match.experience.zeitraum}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score)}`}>
                      {scorePercent}% Match
                    </div>
                    <span className="text-xs text-gray-500">{getScoreLabel(match.score)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 ml-8">
                  {match.reasoning}
                </p>

                {match.matchedSkills && match.matchedSkills.length > 0 && (
                  <div className="ml-8">
                    <p className="text-xs font-medium text-gray-700 mb-1">Matched Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {match.matchedSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements Preview */}
                {match.experience.achievements && match.experience.achievements.length > 0 && (
                  <div className="ml-8 mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Key Achievements:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {match.experience.achievements.slice(0, 3).map((achievement, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                      {match.experience.achievements.length > 3 && (
                        <li className="text-gray-500 italic">
                          +{match.experience.achievements.length - 3} weitere...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {matchedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Keine Projekte gefunden. Gehe zurück und analysiere eine Stellenausschreibung.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMatcher;

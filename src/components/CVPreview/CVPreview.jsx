import { useRef } from 'react';
import useCVStore from '../../store/cvStore';
import SkillRadar from './SkillRadar';
import CoverLetterGenerator from './CoverLetterGenerator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CVPreview = () => {
  const {
    masterCV,
    currentCV,
    jobRequirements,
    setCurrentStep,
    saveCurrentCV,
  } = useCVStore();

  const cvRef = useRef(null);

  const selectedExperiences = masterCV.experience.filter(exp =>
    currentCV.selectedProjects.includes(exp.id)
  );

  const handleExportPDF = async () => {
    if (!cvRef.current) return;

    try {
      // Capture the CV as canvas
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `CV_${masterCV.personal.name}_${jobRequirements?.titel || 'Position'}.pdf`
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Fehler beim PDF-Export. Bitte versuche es erneut.');
    }
  };

  const handleSave = () => {
    saveCurrentCV();
    alert('CV wurde gespeichert!');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Actions Bar */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">CV Vorschau</h2>
            <p className="text-sm text-gray-600">
              Position: {jobRequirements?.titel || 'N/A'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setCurrentStep('skill-selection')} className="btn-secondary">
              ← Bearbeiten
            </button>
            <button onClick={handleSave} className="btn-secondary">
              💾 Speichern
            </button>
            <button onClick={handleExportPDF} className="btn-primary">
              📄 Als PDF exportieren
            </button>
          </div>
        </div>
      </div>

      {/* Cover Letter Generator */}
      <CoverLetterGenerator />

      {/* CV Document */}
      <div className="bg-white shadow-lg" ref={cvRef}>
        <div className="grid grid-cols-3 gap-0 min-h-screen">
          {/* Left Column (1/3 width) */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white p-8">
            {/* Personal Info */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-white">{masterCV.personal.name}</h1>
              <p className="text-lg text-blue-300 mb-4 font-medium">{masterCV.personal.title}</p>

              <div className="space-y-2 text-sm">
                {masterCV.personal.email && (
                  <div className="flex items-start">
                    <span className="mr-2 text-blue-400">📧</span>
                    <span className="break-all text-gray-200">{masterCV.personal.email}</span>
                  </div>
                )}
                {masterCV.personal.phone && (
                  <div className="flex items-start">
                    <span className="mr-2 text-blue-400">📱</span>
                    <span className="text-gray-200">{masterCV.personal.phone}</span>
                  </div>
                )}
                {masterCV.personal.location && (
                  <div className="flex items-start">
                    <span className="mr-2 text-blue-400">📍</span>
                    <span className="text-gray-200">{masterCV.personal.location}</span>
                  </div>
                )}
                {masterCV.personal.linkedin && (
                  <div className="flex items-start">
                    <span className="mr-2 text-blue-400">💼</span>
                    <span className="break-all text-xs text-gray-200">{masterCV.personal.linkedin}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills Radar Chart */}
            {currentCV.selectedSkills && currentCV.selectedSkills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-600">
                  Skills
                </h2>
                <div className="bg-white rounded-lg p-4">
                  <SkillRadar skills={currentCV.selectedSkills} />
                </div>

                {/* Skills List */}
                <div className="mt-4 space-y-2">
                  {currentCV.selectedSkills
                    .sort((a, b) => b.level - a.level)
                    .map((skill, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{skill.name}</span>
                          <span>{skill.level}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${skill.level * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Education */}
            {masterCV.education && masterCV.education.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-600">
                  Ausbildung
                </h2>
                <div className="space-y-3">
                  {masterCV.education.map((edu, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-semibold">{edu.degree}</p>
                      {edu.institution && (
                        <p className="text-gray-300 text-xs">{edu.institution}</p>
                      )}
                      {edu.year && (
                        <p className="text-gray-400 text-xs">{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {masterCV.certifications && masterCV.certifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-600">
                  Weiterbildungen
                </h2>
                <div className="space-y-2">
                  {masterCV.certifications.slice(0, 8).map((cert, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-gray-300">{cert.name}</p>
                      {cert.year && (
                        <p className="text-gray-500 text-xs">{cert.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (2/3 width) */}
          <div className="col-span-2 p-8">
            {/* Profile / Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                Profil
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Erfahrener {jobRequirements?.titel || 'Professional'} mit nachweisbaren Erfolgen in
                {' '}{jobRequirements?.mustHave?.slice(0, 3).join(', ') || 'verschiedenen Bereichen'}.
                Expertise in digitaler Transformation, Prozessoptimierung und Teamführung.
              </p>
            </div>

            {/* Anforderungs-Matching (nur bei strukturiertem Stil) */}
            {currentCV.coverLetterStyle === 'strukturiert' && currentCV.coverLetter && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-2 border-b-3 border-blue-500">
                  Anforderungs-Matching
                </h2>
                <div className="space-y-6">
                  {currentCV.coverLetter.split('\n').map((line, idx) => {
                    // Bold headings (Requirements)
                    if (line.startsWith('**') && line.endsWith('**')) {
                      const text = line.replace(/\*\*/g, '');
                      // Skip "ANFORDERUNGS-MATCHING" and "BISHERIGE STATIONEN" headers
                      if (text === 'ANFORDERUNGS-MATCHING' || text === 'BISHERIGE STATIONEN') {
                        return (
                          <h3 key={idx} className="text-xl font-bold text-slate-800 mt-8 mb-4 pb-2 border-b-2 border-slate-300">
                            {text}
                          </h3>
                        );
                      }
                      return (
                        <div key={idx} className="mt-6 mb-3 bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border-l-4 border-blue-500">
                          <h3 className="text-base font-bold text-slate-900 flex items-center">
                            <span className="text-blue-600 mr-2">📋</span>
                            {text}
                          </h3>
                        </div>
                      );
                    }
                    // Checkmarks
                    if (line.startsWith('✓')) {
                      return (
                        <div key={idx} className="flex items-start ml-8 mb-2">
                          <span className="text-green-600 mr-3 mt-0.5 font-bold text-base">✓</span>
                          <span className="text-gray-700 text-sm leading-relaxed">{line.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    // Bullets (for timeline)
                    if (line.startsWith('•')) {
                      return (
                        <div key={idx} className="flex items-start ml-8 mb-2">
                          <span className="text-blue-500 mr-3 mt-0.5 font-bold">•</span>
                          <span className="text-gray-600 text-sm font-medium">{line.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    // Separators
                    if (line.trim() === '---') {
                      return <div key={idx} className="my-6" />;
                    }
                    // Empty lines
                    if (line.trim() === '') {
                      return <div key={idx} className="h-1" />;
                    }
                    // Regular text
                    return (
                      <p key={idx} className="text-gray-600 text-sm ml-8">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Experience - NUR anzeigen wenn NICHT strukturiert */}
            {currentCV.coverLetterStyle !== 'strukturiert' && (
              <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                Berufserfahrung
              </h2>
              <div className="space-y-6">
                {selectedExperiences.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{exp.rolle}</h3>
                        <p className="text-md text-gray-600 font-medium">{exp.firma}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{exp.zeitraum}</p>
                        {exp.ort && (
                          <p className="text-sm text-gray-500">{exp.ort}</p>
                        )}
                      </div>
                    </div>

                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="space-y-1 ml-4">
                        {exp.achievements.map((achievement, aIdx) => (
                          <li key={aIdx} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2 text-blue-600">▪</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreview;

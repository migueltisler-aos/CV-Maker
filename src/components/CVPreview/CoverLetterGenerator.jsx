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

  const selectedExperiences = masterCV?.experience.filter(exp =>
    currentCV.selectedProjects.includes(exp.id)
  ) || [];

  const styles = [
    { id: 'authentisch', label: 'Authentisch', desc: 'Direkt & persönlich, ohne Floskeln' },
    { id: 'professionell', label: 'Professionell', desc: 'Klassisch professionell, modern' },
    { id: 'direkt', label: 'Direkt', desc: 'Kurz & knackig, auf den Punkt' },
    { id: 'strukturiert', label: 'Strukturiert', desc: 'Anforderungen → Projekte + Werdegang' },
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

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="btn-primary w-full mb-4"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generiere Anschreiben...
          </span>
        ) : currentCV.coverLetter ? (
          '🔄 Neu generieren'
        ) : (
          '✨ Anschreiben generieren'
        )}
      </button>

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

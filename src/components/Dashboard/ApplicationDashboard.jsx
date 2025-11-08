import { useState } from 'react';
import useCVStore from '../../store/cvStore';

const ApplicationDashboard = () => {
  const {
    generatedCVs,
    loadGeneratedCV,
    updateApplicationStatus,
    updateApplicationNotes,
    deleteApplication,
  } = useCVStore();

  const [filter, setFilter] = useState('alle');
  const [selectedApp, setSelectedApp] = useState(null);

  const statusOptions = [
    { id: 'entwurf', label: 'Entwurf', color: 'gray', icon: '📝' },
    { id: 'versendet', label: 'Versendet', color: 'blue', icon: '📤' },
    { id: 'in_gespraech', label: 'Im Gespräch', color: 'yellow', icon: '💬' },
    { id: 'absage', label: 'Absage', color: 'red', icon: '❌' },
    { id: 'zusage', label: 'Zusage', color: 'green', icon: '✅' },
  ];

  const getStatusStyle = (status) => {
    const option = statusOptions.find(s => s.id === status);
    const colors = {
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      green: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[option?.color] || colors.gray;
  };

  const filteredApps = generatedCVs.filter(cv => {
    if (filter === 'alle') return true;
    return cv.status === filter;
  });

  const stats = {
    total: generatedCVs.length,
    entwurf: generatedCVs.filter(cv => cv.status === 'entwurf').length,
    versendet: generatedCVs.filter(cv => cv.status === 'versendet').length,
    in_gespraech: generatedCVs.filter(cv => cv.status === 'in_gespraech').length,
    absage: generatedCVs.filter(cv => cv.status === 'absage').length,
    zusage: generatedCVs.filter(cv => cv.status === 'zusage').length,
  };

  const handleStatusChange = (cvId, newStatus) => {
    const appliedDate = newStatus === 'versendet' ? new Date().toISOString() : null;
    updateApplicationStatus(cvId, newStatus, appliedDate);
  };

  const handleDelete = (cvId) => {
    if (confirm('Bewerbung wirklich löschen?')) {
      deleteApplication(cvId);
      setSelectedApp(null);
    }
  };

  const handleLoad = (cvId) => {
    loadGeneratedCV(cvId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'heute';
    if (diff === 1) return 'gestern';
    return `vor ${diff} Tagen`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bewerbungs-Tracker</h1>
        <p className="text-gray-600">Alle deine Bewerbungen im Überblick</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Gesamt</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.entwurf}</div>
          <div className="text-sm text-gray-600 mt-1">📝 Entwurf</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.versendet}</div>
          <div className="text-sm text-gray-600 mt-1">📤 Versendet</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.in_gespraech}</div>
          <div className="text-sm text-gray-600 mt-1">💬 Gespräch</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.absage}</div>
          <div className="text-sm text-gray-600 mt-1">❌ Absage</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.zusage}</div>
          <div className="text-sm text-gray-600 mt-1">✅ Zusage</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('alle')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'alle' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({stats.total})
          </button>
          {statusOptions.map(status => (
            <button
              key={status.id}
              onClick={() => setFilter(status.id)}
              className={`px-3 py-1 rounded text-sm ${
                filter === status.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.icon} {status.label} ({stats[status.id]})
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredApps.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">Keine Bewerbungen gefunden.</p>
            <p className="text-gray-400 text-sm mt-2">Erstelle deine erste Bewerbung!</p>
          </div>
        ) : (
          filteredApps
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .map(app => {
              const statusOption = statusOptions.find(s => s.id === app.status);
              const isSelected = selectedApp?.id === app.id;

              return (
                <div
                  key={app.id}
                  className={`card cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedApp(isSelected ? null : app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {app.jobRequirements?.titel || 'Unbekannte Position'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(app.status)}`}>
                          {statusOption?.icon} {statusOption?.label}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {app.jobRequirements?.firma && (
                          <div>🏢 {app.jobRequirements.firma}</div>
                        )}
                        <div className="flex items-center space-x-4">
                          <span>📅 Erstellt: {formatDate(app.createdAt)}</span>
                          {app.appliedDate && (
                            <span className="text-blue-600">
                              📤 Versendet: {formatDate(app.appliedDate)} ({getDaysAgo(app.appliedDate)})
                            </span>
                          )}
                          <span className="text-gray-400">
                            Zuletzt bearbeitet: {formatDate(app.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoad(app.id);
                        }}
                        className="btn-primary text-sm"
                      >
                        Öffnen
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app.id);
                        }}
                        className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Status Change */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status ändern:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map(status => (
                            <button
                              key={status.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(app.id, status.id);
                              }}
                              className={`px-3 py-1 rounded border text-sm ${
                                app.status === status.id
                                  ? getStatusStyle(status.id) + ' font-medium'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {status.icon} {status.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Requirements Summary */}
                      {app.jobRequirements && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Anforderungen:</h4>
                          <div className="flex flex-wrap gap-2">
                            {app.jobRequirements.mustHave?.slice(0, 5).map((req, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                {req}
                              </span>
                            ))}
                            {app.jobRequirements.mustHave?.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{app.jobRequirements.mustHave.length - 5} weitere
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notizen:
                        </label>
                        <textarea
                          value={app.notes || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateApplicationNotes(app.id, e.target.value);
                          }}
                          className="input-field text-sm"
                          rows={3}
                          placeholder="Notizen zur Bewerbung (z.B. Kontaktperson, nächste Schritte...)"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Meta Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        <div>Ausgewählte Projekte: {app.selectedProjects?.length || 0}</div>
                        <div>Skills im CV: {app.selectedSkills?.length || 0}</div>
                        <div>Anschreiben: {app.coverLetter ? '✅ Vorhanden' : '❌ Nicht erstellt'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ApplicationDashboard;

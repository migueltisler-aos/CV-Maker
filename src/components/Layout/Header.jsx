import useCVStore from '../../store/cvStore';

const Header = () => {
  const { currentStep, setCurrentStep, masterCV, resetCurrentCV, generatedCVs } = useCVStore();

  const steps = [
    { id: 'master-cv', label: 'Master CV', enabled: true },
    { id: 'job-input', label: 'Stellenanzeige', enabled: !!masterCV },
    { id: 'project-selection', label: 'Projekte', enabled: !!masterCV },
    { id: 'skill-selection', label: 'Skills', enabled: !!masterCV },
    { id: 'preview', label: 'Vorschau & Export', enabled: !!masterCV },
  ];

  const handleNewCV = () => {
    resetCurrentCV();
  };

  const isInWorkflow = ['master-cv', 'job-input', 'project-selection', 'skill-selection', 'preview'].includes(currentStep);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV Maker</h1>
            <p className="text-sm text-gray-600">Professionelle Bewerbungsunterlagen erstellen</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Dashboard Button */}
            <button
              onClick={() => setCurrentStep('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Dashboard
              {generatedCVs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {generatedCVs.length}
                </span>
              )}
            </button>

            {/* New CV Button */}
            {masterCV && currentStep !== 'master-cv' && (
              <button
                onClick={handleNewCV}
                className="btn-primary"
              >
                ✨ Neue Bewerbung
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps - Only show in workflow */}
        {isInWorkflow && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.enabled && setCurrentStep(step.id)}
                  disabled={!step.enabled}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : step.enabled
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {index + 1}. {step.label}
                </button>
                {index < steps.length - 1 && (
                  <svg
                    className="w-4 h-4 mx-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

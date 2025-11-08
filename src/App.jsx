import { useEffect } from 'react';
import useCVStore from './store/cvStore';
import Header from './components/Layout/Header';
import MasterCVManager from './components/MasterCV/MasterCVManager';
import JobInput from './components/JobAnalysis/JobInput';
import ProjectMatcher from './components/JobAnalysis/ProjectMatcher';
import CVBuilder from './components/CVBuilder/CVBuilder';
import CVPreview from './components/CVPreview/CVPreview';

function App() {
  const { currentStep, initializeStore } = useCVStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const renderStep = () => {
    switch (currentStep) {
      case 'master-cv':
        return <MasterCVManager />;
      case 'job-input':
        return <JobInput />;
      case 'project-selection':
        return <ProjectMatcher />;
      case 'skill-selection':
        return <CVBuilder />;
      case 'preview':
        return <CVPreview />;
      default:
        return <MasterCVManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;

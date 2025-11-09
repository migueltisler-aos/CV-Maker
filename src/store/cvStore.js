import { create } from 'zustand';
import { saveMasterCV, loadMasterCV, saveGeneratedCV, loadGeneratedCVs } from '../services/storageService';

const useCVStore = create((set, get) => ({
  // Master CV State
  masterCV: null,

  // Current Job Analysis
  currentJob: null,
  jobRequirements: null,
  matchedProjects: [],

  // Current CV being built
  currentCV: {
    id: null,
    jobTitle: '',
    selectedProjects: [],
    selectedSkills: [],
    customizations: {},
    coverLetter: null,
    coverLetterStyle: 'strukturiert',
  },

  // Generated CVs
  generatedCVs: [],

  // UI State
  isLoading: false,
  error: null,
  currentStep: 'master-cv', // 'master-cv', 'job-input', 'project-selection', 'skill-selection', 'preview'
  manualMode: true, // true = copy/paste prompts, false = API calls

  // Actions
  initializeStore: () => {
    const masterCV = loadMasterCV();
    const generatedCVs = loadGeneratedCVs();

    // Default to dashboard if there are existing CVs, otherwise start workflow
    const defaultStep = generatedCVs.length > 0 ? 'dashboard' : (masterCV ? 'job-input' : 'master-cv');

    set({
      masterCV,
      generatedCVs,
      currentStep: defaultStep
    });
  },

  setMasterCV: (masterCV) => {
    saveMasterCV(masterCV);
    set({ masterCV, currentStep: 'job-input' });
  },

  updateMasterCV: (updates) => {
    const masterCV = { ...get().masterCV, ...updates };
    saveMasterCV(masterCV);
    set({ masterCV });
  },

  setCurrentJob: (jobText) => {
    set({ currentJob: jobText });
  },

  setJobRequirements: (requirements) => {
    set({ jobRequirements: requirements });
  },

  setMatchedProjects: (projects) => {
    set({ matchedProjects: projects });
  },

  setSelectedProjects: (projectIds) => {
    set(state => ({
      currentCV: {
        ...state.currentCV,
        selectedProjects: projectIds
      }
    }));
  },

  setSelectedSkills: (skills) => {
    set(state => ({
      currentCV: {
        ...state.currentCV,
        selectedSkills: skills
      }
    }));
  },

  updateCurrentCV: (updates) => {
    set(state => ({
      currentCV: {
        ...state.currentCV,
        ...updates
      }
    }));
  },

  saveCurrentCV: () => {
    const { currentCV, jobRequirements } = get();
    const cv = {
      ...currentCV,
      id: currentCV.id || Date.now().toString(),
      createdAt: currentCV.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobRequirements,
      status: currentCV.status || 'entwurf', // entwurf, versendet, in_gespraech, absage, zusage
      appliedDate: currentCV.appliedDate || null,
      notes: currentCV.notes || '',
    };

    saveGeneratedCV(cv);

    const generatedCVs = loadGeneratedCVs();
    set({ generatedCVs, currentCV: cv });
  },

  loadGeneratedCV: (cvId) => {
    const cvs = loadGeneratedCVs();
    const cv = cvs.find(c => c.id === cvId);
    if (cv) {
      set({
        currentCV: cv,
        jobRequirements: cv.jobRequirements,
        currentStep: 'preview'
      });
    }
  },

  resetCurrentCV: () => {
    set({
      currentCV: {
        id: null,
        jobTitle: '',
        selectedProjects: [],
        selectedSkills: [],
        customizations: {},
        coverLetter: null,
        coverLetterStyle: 'strukturiert',
      },
      currentJob: null,
      jobRequirements: null,
      matchedProjects: [],
      currentStep: 'job-input'
    });
  },

  setCurrentStep: (step) => {
    set({ currentStep: step });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  // Cover Letter Actions
  setCoverLetter: (coverLetter) => {
    set(state => ({
      currentCV: {
        ...state.currentCV,
        coverLetter
      }
    }));
  },

  setCoverLetterStyle: (style) => {
    set(state => ({
      currentCV: {
        ...state.currentCV,
        coverLetterStyle: style
      }
    }));
  },

  // Application Tracking Actions
  updateApplicationStatus: (cvId, status, appliedDate = null) => {
    const cvs = loadGeneratedCVs();
    const updated = cvs.map(cv =>
      cv.id === cvId
        ? { ...cv, status, appliedDate: appliedDate || cv.appliedDate, updatedAt: new Date().toISOString() }
        : cv
    );
    localStorage.setItem('cv_maker_generated_cvs', JSON.stringify(updated));
    set({ generatedCVs: updated });

    // Update current CV if it's the one being updated
    const current = get().currentCV;
    if (current.id === cvId) {
      set({
        currentCV: {
          ...current,
          status,
          appliedDate: appliedDate || current.appliedDate
        }
      });
    }
  },

  updateApplicationNotes: (cvId, notes) => {
    const cvs = loadGeneratedCVs();
    const updated = cvs.map(cv =>
      cv.id === cvId
        ? { ...cv, notes, updatedAt: new Date().toISOString() }
        : cv
    );
    localStorage.setItem('cv_maker_generated_cvs', JSON.stringify(updated));
    set({ generatedCVs: updated });
  },

  deleteApplication: (cvId) => {
    const cvs = loadGeneratedCVs();
    const filtered = cvs.filter(cv => cv.id !== cvId);
    localStorage.setItem('cv_maker_generated_cvs', JSON.stringify(filtered));
    set({ generatedCVs: filtered });
  },

  // Manual Mode Toggle
  toggleManualMode: () => {
    set(state => ({ manualMode: !state.manualMode }));
  },
}));

export default useCVStore;

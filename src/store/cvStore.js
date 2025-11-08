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
  },

  // Generated CVs
  generatedCVs: [],

  // UI State
  isLoading: false,
  error: null,
  currentStep: 'master-cv', // 'master-cv', 'job-input', 'project-selection', 'skill-selection', 'preview'

  // Actions
  initializeStore: () => {
    const masterCV = loadMasterCV();
    const generatedCVs = loadGeneratedCVs();
    set({
      masterCV,
      generatedCVs,
      currentStep: masterCV ? 'job-input' : 'master-cv'
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
}));

export default useCVStore;

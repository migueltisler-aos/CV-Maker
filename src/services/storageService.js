const STORAGE_KEYS = {
  MASTER_CV: 'cv_maker_master_cv',
  GENERATED_CVS: 'cv_maker_generated_cvs',
  SETTINGS: 'cv_maker_settings',
};

/**
 * Speichert den Master CV
 */
export function saveMasterCV(masterCV) {
  try {
    localStorage.setItem(STORAGE_KEYS.MASTER_CV, JSON.stringify(masterCV));
    return true;
  } catch (error) {
    console.error('Error saving master CV:', error);
    return false;
  }
}

/**
 * Lädt den Master CV
 */
export function loadMasterCV() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MASTER_CV);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading master CV:', error);
    return null;
  }
}

/**
 * Speichert einen generierten CV
 */
export function saveGeneratedCV(cv) {
  try {
    const cvs = loadGeneratedCVs();
    const existingIndex = cvs.findIndex(c => c.id === cv.id);

    if (existingIndex >= 0) {
      cvs[existingIndex] = cv;
    } else {
      cvs.push(cv);
    }

    localStorage.setItem(STORAGE_KEYS.GENERATED_CVS, JSON.stringify(cvs));
    return true;
  } catch (error) {
    console.error('Error saving generated CV:', error);
    return false;
  }
}

/**
 * Lädt alle generierten CVs
 */
export function loadGeneratedCVs() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GENERATED_CVS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading generated CVs:', error);
    return [];
  }
}

/**
 * Löscht einen generierten CV
 */
export function deleteGeneratedCV(cvId) {
  try {
    const cvs = loadGeneratedCVs();
    const filtered = cvs.filter(c => c.id !== cvId);
    localStorage.setItem(STORAGE_KEYS.GENERATED_CVS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting generated CV:', error);
    return false;
  }
}

/**
 * Exportiert alle Daten als JSON
 */
export function exportAllData() {
  return {
    masterCV: loadMasterCV(),
    generatedCVs: loadGeneratedCVs(),
    exportDate: new Date().toISOString(),
  };
}

/**
 * Importiert Daten aus JSON
 */
export function importData(data) {
  try {
    if (data.masterCV) {
      saveMasterCV(data.masterCV);
    }
    if (data.generatedCVs) {
      localStorage.setItem(STORAGE_KEYS.GENERATED_CVS, JSON.stringify(data.generatedCVs));
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

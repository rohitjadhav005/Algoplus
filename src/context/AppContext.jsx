import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
  dataset: null,       // { columns, rows, types, stats, fileName }
  modelResults: [],    // array of model result objects
  trainingLogs: null,  // { loss, val_loss, accuracy, val_accuracy }
  activeSession: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATASET':
      return { ...state, dataset: action.payload };
    case 'ADD_MODEL_RESULT':
      return { ...state, modelResults: [...state.modelResults, action.payload] };
    case 'REMOVE_MODEL_RESULT':
      return { ...state, modelResults: state.modelResults.filter((_, i) => i !== action.payload) };
    case 'SET_TRAINING_LOGS':
      return { ...state, trainingLogs: action.payload };
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore.js';
import { toast } from '../store/toastStore.js';

// Ensures the store holds the project matching the URL; returns load state.
export function useProjectData() {
  const { projectId } = useParams();
  const { current, selectProject } = useProjectStore();
  const [error, setError] = useState(false);
  const loaded = current?._id === projectId;

  useEffect(() => {
    if (!projectId) return;
    if (current?._id === projectId) return;
    let active = true;
    setError(false);
    selectProject(projectId).catch(() => {
      if (active) {
        setError(true);
        toast.error('Could not load this project');
      }
    });
    return () => {
      active = false;
    };
  }, [projectId, current?._id, selectProject]);

  return { loaded, error, projectId };
}

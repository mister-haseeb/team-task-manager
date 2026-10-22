import { api } from './client';

export const tasksApi = {
  // filters: { teamId, assigneeId, status, priority, search }
  list: (filters) => api.get('/tasks', filters).then((data) => data.tasks),
  reminders: () => api.get('/tasks/reminders').then((data) => data.tasks),
  create: (task) => api.post('/tasks', task).then((data) => data.task),
  update: (taskId, changes) => api.patch(`/tasks/${taskId}`, changes).then((data) => data.task),
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
};

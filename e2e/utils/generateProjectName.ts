import { nanoid } from 'nanoid';

export const generateProjectName = () => `project-${nanoid(5)}`;

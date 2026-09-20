import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';

export const getSession = () => getServerSession(authOptions);

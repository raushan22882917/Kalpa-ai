import { TechStack } from '../types/projectGenerator';

export const PREDEFINED_STACKS: TechStack[] = [
  // Level 1 - Beginner
  {
    id: 'react-supabase',
    name: 'React + Supabase',
    level: 'beginner',
    levelNumber: 1,
    frontend: 'React',
    backend: 'Supabase Edge Functions (optional)',
    database: 'Supabase',
    benefits: ['Fastest to build', 'Best for small apps, dashboards', 'Full auth + storage ready'],
    useCases: ['Dashboards', 'Small web apps', 'Prototypes'],
    packageManager: 'npm'
  },
  
  // Level 2 - Intermediate
  {
    id: 'react-express-supabase',
    name: 'React + Node.js (Express) + Supabase',
    level: 'intermediate',
    levelNumber: 2,
    frontend: 'React',
    backend: 'Express.js',
    database: 'Supabase',
    benefits: ['Classic JavaScript stack', 'Simple REST APIs'],
    useCases: ['Web applications', 'REST APIs'],
    packageManager: 'npm'
  },
  {
    id: 'react-nestjs-supabase',
    name: 'React + NestJS + Supabase',
    level: 'intermediate',
    levelNumber: 2,
    frontend: 'React',
    backend: 'NestJS',
    database: 'Supabase',
    benefits: ['TypeScript everywhere', 'Enterprise architecture'],
    useCases: ['Enterprise apps', 'Scalable APIs'],
    packageManager: 'npm'
  },
  
  // Level 3 - Advanced
  {
    id: 'nextjs-supabase',
    name: 'Next.js + Supabase',
    level: 'advanced',
    levelNumber: 3,
    frontend: 'Next.js',
    backend: 'Next.js API Routes / Server Actions',
    database: 'Supabase',
    benefits: ['Full-stack in one app', 'Best for SaaS', 'Real-time features easy'],
    useCases: ['SaaS applications', 'Modern web apps'],
    packageManager: 'npm'
  },
  {
    id: 'nextjs-nestjs-supabase',
    name: 'Next.js + NestJS + Supabase',
    level: 'advanced',
    levelNumber: 3,
    frontend: 'Next.js',
    backend: 'NestJS or Express',
    database: 'Supabase',
    benefits: ['Separate backend for scalability', 'Clean project structure'],
    useCases: ['Large applications', 'Microservices'],
    packageManager: 'npm'
  },
  {
    id: 'nextjs-fastapi-supabase',
    name: 'Next.js + FastAPI + Supabase',
    level: 'advanced',
    levelNumber: 3,
    frontend: 'Next.js',
    backend: 'FastAPI',
    database: 'Supabase',
    benefits: ['Python + TypeScript combo', 'Great for AI + automation'],
    useCases: ['AI applications', 'Data processing'],
    packageManager: 'npm'
  },
  
  // Level 4 - Mobile
  {
    id: 'expo-supabase',
    name: 'React Native (Expo) + Supabase',
    level: 'mobile',
    levelNumber: 4,
    frontend: 'React Native',
    mobile: 'Expo',
    backend: 'Supabase Edge Functions',
    database: 'Supabase',
    benefits: ['Perfect for mobile apps', 'Real-time chats, auth, file upload'],
    useCases: ['Mobile applications', 'Cross-platform apps'],
    packageManager: 'npm'
  },
  {
    id: 'expo-nextjs-supabase',
    name: 'React Native + Next.js + Supabase',
    level: 'mobile',
    levelNumber: 4,
    frontend: 'Next.js',
    mobile: 'React Native (Expo)',
    backend: 'Next.js',
    database: 'Supabase',
    benefits: ['Both web + mobile connected', 'One database for all', 'Best for social apps, ecommerce, SaaS'],
    useCases: ['Social apps', 'Ecommerce', 'SaaS with mobile'],
    packageManager: 'npm'
  },
  {
    id: 'expo-fastapi-supabase',
    name: 'React Native + FastAPI + Supabase',
    level: 'mobile',
    levelNumber: 4,
    frontend: 'React Native',
    mobile: 'Expo',
    backend: 'FastAPI',
    database: 'Supabase',
    benefits: ['Python backend for ML/AI workflows', 'Very powerful and flexible'],
    useCases: ['AI-powered mobile apps', 'ML applications'],
    packageManager: 'npm'
  },
  
  // Level 5 - Ultimate
  {
    id: 'nextjs-supabase-expo',
    name: 'Next.js + Supabase + React Native (Expo)',
    level: 'ultimate',
    levelNumber: 5,
    frontend: 'Next.js (Web)',
    mobile: 'React Native (Expo)',
    backend: 'Next.js API / Server Actions',
    database: 'Supabase',
    benefits: ['Single backend', 'Works beautifully with Supabase', 'Supports mobile + web + real-time', 'Perfect for your projects'],
    useCases: ['Full-stack applications', 'Multi-platform products'],
    packageManager: 'npm'
  }
];

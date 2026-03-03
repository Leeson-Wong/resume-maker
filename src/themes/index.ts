import type { ThemeType } from '../types/resume';

export interface ThemeConfig {
  id: ThemeType;
  label: string;
  container: string;
  header: string;
  nameText: string;
  title: string;
  contactInfo: string;
  section: string;
  sectionTitle: string;
  sectionContent: string;
  itemTitle: string;
  itemSubtitle: string;
  dateRange: string;
  highlightList: string;
  skillTag: string;
}

export const themes: Record<ThemeType, ThemeConfig> = {
  classic: {
    id: 'classic',
    label: 'themes.classic',
    container: 'bg-white shadow-lg max-w-[800px] mx-auto p-8',
    header: 'border-b-2 border-gray-800 pb-4 mb-6',
    nameText: 'text-3xl font-bold text-gray-900',
    title: 'text-lg text-gray-600 mt-1',
    contactInfo: 'flex flex-wrap gap-4 mt-3 text-sm text-gray-600',
    section: 'mb-6',
    sectionTitle: 'text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide',
    sectionContent: 'space-y-4',
    itemTitle: 'font-bold text-gray-900',
    itemSubtitle: 'text-gray-700',
    dateRange: 'text-sm text-gray-500',
    highlightList: 'list-disc list-inside text-gray-600 text-sm space-y-1 mt-2',
    skillTag: 'inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm mr-2 mb-2',
  },
  modern: {
    id: 'modern',
    label: 'themes.modern',
    container: 'bg-gradient-to-br from-slate-50 to-blue-50 shadow-xl max-w-[800px] mx-auto p-8 rounded-lg',
    header: 'mb-8',
    nameText: 'text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
    title: 'text-xl text-blue-600 mt-2 font-medium',
    contactInfo: 'flex flex-wrap gap-4 mt-4 text-sm text-slate-500',
    section: 'mb-6',
    sectionTitle: 'text-lg font-bold text-blue-700 mb-4 flex items-center before:content-[""] before:w-1 before:h-5 before:bg-blue-500 before:mr-2 before:rounded',
    sectionContent: 'space-y-4',
    itemTitle: 'font-bold text-slate-800 text-lg',
    itemSubtitle: 'text-blue-600',
    dateRange: 'text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded',
    highlightList: 'list-none text-slate-600 text-sm space-y-2 mt-3',
    skillTag: 'inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm mr-2 mb-2',
  },
  minimal: {
    id: 'minimal',
    label: 'themes.minimal',
    container: 'bg-white max-w-[800px] mx-auto p-8',
    header: 'mb-8 text-center',
    nameText: 'text-3xl font-light text-gray-900 tracking-widest',
    title: 'text-sm text-gray-400 mt-2 uppercase tracking-wider',
    contactInfo: 'flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-500',
    section: 'mb-6',
    sectionTitle: 'text-xs font-medium text-gray-400 uppercase tracking-widest mb-4',
    sectionContent: 'space-y-4',
    itemTitle: 'font-medium text-gray-900',
    itemSubtitle: 'text-gray-500 text-sm',
    dateRange: 'text-xs text-gray-400',
    highlightList: 'list-none text-gray-600 text-sm space-y-1 mt-2 text-xs',
    skillTag: 'inline-block border border-gray-200 text-gray-600 px-2 py-1 text-xs mr-2 mb-2',
  },
};

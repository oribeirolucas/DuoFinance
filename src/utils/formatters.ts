import { ExpenseCategory } from '../types';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getCategoryColor = (category: ExpenseCategory): { bg: string; text: string; border: string; dot: string } => {
  switch (category) {
    case 'Moradia':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'Família':
      return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' };
    case 'Assinaturas/Serviços':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'Cartões/Dívidas':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
    case 'Pessoal/Saúde':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'Alimentação':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'Outros':
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
  }
};

export const CATEGORY_HEX_MAP: Record<ExpenseCategory, string> = {
  'Moradia': '#6C63FF',
  'Alimentação': '#43D19E',
  'Cartões/Dívidas': '#FF5A5A',
  'Assinaturas/Serviços': '#A855F7',
  'Família': '#FF6584',
  'Pessoal/Saúde': '#3B82F6',
  'Outros': '#64748B'
};

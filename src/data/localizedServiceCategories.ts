import { useTranslation } from 'react-i18next';
import { serviceCategories } from './serviceCategories';

// Get the type from the serviceCategories array
type ServiceCategory = typeof serviceCategories[0];

export const useLocalizedServiceCategories = (): ServiceCategory[] => {
  const { t } = useTranslation('services');

  return serviceCategories.map(category => ({
    ...category,
    name: t(`categories.${category.slug}.name`),
    description: t(`categories.${category.slug}.description`),
    subcategories: category.subcategories.map(subcategory => ({
      ...subcategory,
      name: t(`categories.${category.slug}.subcategories.${subcategory.slug}`),
      description: subcategory.description, // Keep original for now
    }))
  }));
};

export const getLocalizedServicesBySlug = (slug: string, t: (key: string) => string): ServiceCategory | undefined => {
  const category = serviceCategories.find(cat => cat.slug === slug);
  if (!category) return undefined;

  return {
    ...category,
    name: t(`categories.${category.slug}.name`),
    description: t(`categories.${category.slug}.description`),
    subcategories: category.subcategories.map(subcategory => ({
      ...subcategory,
      name: t(`categories.${category.slug}.subcategories.${subcategory.slug}`),
      description: subcategory.description,
    }))
  };
};
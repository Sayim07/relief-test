import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Category Definition
 */
export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  defaultLimit?: number;
}

/**
 * Category Service
 */
export const categoryService = {
  /**
   * Get all categories
   */
  async getAll(): Promise<CategoryDefinition[]> {
    const q = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as CategoryDefinition));
  },

  /**
   * Create a new category
   */
  async create(category: CategoryDefinition): Promise<void> {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category);
  },
};

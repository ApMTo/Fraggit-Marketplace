export type AdminSelection =
  | { type: 'category'; categoryId: string }
  | { type: 'subcategory'; categoryId: string; subcategoryId: string };

export type CategoryDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; categoryId: string };

export type SubcategoryDialogState =
  | { mode: 'create'; categoryId: string }
  | { mode: 'edit'; categoryId: string; subcategoryId: string };

export type AttributeDialogState =
  | { mode: 'create'; scope: 'category' | 'subcategory'; parentId: string; categoryId: string }
  | {
      mode: 'edit';
      attributeId: string;
      scope: 'category' | 'subcategory';
      parentId: string;
      categoryId: string;
    };

export type DeleteTarget =
  | { type: 'category'; id: string; name: string }
  | { type: 'subcategory'; id: string; name: string; categoryId: string }
  | {
      type: 'attribute';
      id: string;
      name: string;
      scope: 'category' | 'subcategory';
      parentId: string;
      categoryId: string;
    };

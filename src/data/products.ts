export interface Product { id: string; name: string; price: number; category: 'essen' | 'trinken'; }

// Einheitliche Produktbasis – Preise in $ (fiktiv)
export const PRODUCTS: Product[] = [
  { id: 'p-baumkuchen', name: 'Baumkuchen', price: 18, category: 'essen' },
  { id: 'p-cheeseburger', name: 'Cheeseburger', price: 22, category: 'essen' },
  { id: 'p-baguette', name: 'Baguette', price: 20, category: 'essen' },
  { id: 'p-chicken-wings', name: 'Chicken Wings', price: 25, category: 'essen' },
  { id: 'p-cookie', name: 'Cookie', price: 15, category: 'essen' },
  { id: 'p-eis', name: 'Eis', price: 17, category: 'essen' },
  { id: 'p-salat', name: 'Frischer Salat', price: 21, category: 'essen' },
  { id: 'p-rahmschnitzel', name: 'Rahmschnitzel nach Wirtshausart', price: 32, category: 'essen' },
  { id: 'p-rindsroulade', name: 'Rindsroulade mit Soße & Rotkohl', price: 38, category: 'essen' },

  { id: 'p-gin', name: 'Gin', price: 28, category: 'trinken' },
  { id: 'p-cola', name: 'Cola', price: 18, category: 'trinken' },
  { id: 'p-wasser', name: 'Wasser', price: 15, category: 'trinken' },
  { id: 'p-jaegermeister', name: 'Jägermeister', price: 30, category: 'trinken' },
  { id: 'p-bier', name: 'Bier', price: 25, category: 'trinken' },
  { id: 'p-fanta', name: 'Fanta', price: 18, category: 'trinken' },
  { id: 'p-kaffee', name: 'Kaffee', price: 20, category: 'trinken' },
  { id: 'p-eistee', name: 'Eistee', price: 19, category: 'trinken' },
  { id: 'p-vodka', name: 'Vodka', price: 32, category: 'trinken' },
  { id: 'p-whiskey', name: 'Whiskey', price: 40, category: 'trinken' },
  { id: 'p-champagner', name: 'Champagner', price: 300 , category: 'trinken' },
  { id: 'p-hennessy', name: 'Hennessy', price: 50, category: 'trinken' },
  { id: 'p-tequila', name: 'Tequila', price: 40, category: 'trinken' },
  { id: 'p-sex', name: 'Sex on the Beach Cocktail', price: 40, category: 'trinken' },
  { id: 'p-aperol', name: 'Aperol Spritz', price: 35, category: 'trinken' },
  { id: 'p-Sprunk', name: 'Sprunk', price: 20, category: 'trinken' },
];

export const PRODUCT_CATEGORIES: { key: 'essen' | 'trinken'; label: string }[] = [
  { key: 'essen', label: 'Essen' },
  { key: 'trinken', label: 'Trinken' }
];

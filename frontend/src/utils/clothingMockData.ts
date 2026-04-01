/**
 * Centralized mock data for clothing/fashion.
 * Used when backend data is empty for fashion-related categories.
 */

export const CLOTHING_MOCK_DATA = {
  subcategories: [
    {
      id: 'mens-wear',
      name: "Men's Wear",
      image: "/mock_shirt.png",
      type: 'category',
      categoryId: 'mens-wear'
    },
    {
      _id: 'jeans',
      id: 'jeans',
      name: "Jeans",
      image: "/mock_jeans_icon.png",
      type: 'subcategory',
      categoryId: 'mens-wear'
    }
  ],
  products: [
    {
      _id: 'mock-p1',
      id: 'mock-p1',
      name: 'Premium Cotton Shirt',
      price: 1299,
      discountPrice: 899,
      images: ["/mock_shirt.png"],
      imageUrl: "/mock_shirt.png",
      mainImage: "/mock_shirt.png",
      description: 'High quality cotton shirt for men.',
      category: 'mens-wear',
      stock: 100,
      status: 'Available',
      pack: '1 unit',
      sellerId: 'mock-seller'
    },
    {
      _id: 'mock-p2',
      id: 'mock-p2',
      name: 'Slim Fit Denims',
      price: 2499,
      discountPrice: 1599,
      images: ["/mock_denims.png"],
      imageUrl: "/mock_denims.png",
      mainImage: "/mock_denims.png",
      description: 'Stylish slim fit blue denims.',
      category: 'mens-wear',
      subcategoryId: 'jeans',
      stock: 50,
      status: 'Available',
      pack: '1 unit',
      sellerId: 'mock-seller'
    },
    {
      _id: 'mock-p3',
      id: 'mock-p3',
      name: 'Casual Polo T-Shirt',
      price: 899,
      discountPrice: 599,
      images: ["/mock_polo.png"],
      imageUrl: "/mock_polo.png",
      mainImage: "/mock_polo.png",
      description: 'Comfortable cotton polo t-shirt.',
      category: 'mens-wear',
      stock: 150,
      status: 'Available',
      pack: '1 unit',
      sellerId: 'mock-seller'
    },
    {
      _id: 'mock-p4',
      id: 'mock-p4',
      name: 'Classic Chinos',
      price: 1899,
      discountPrice: 1299,
      images: ["/mock_chinos.png"],
      imageUrl: "/mock_chinos.png",
      mainImage: "/mock_chinos.png",
      description: 'Versatile beige chinos for casual wear.',
      category: 'mens-wear',
      stock: 80,
      status: 'Available',
      pack: '1 unit',
      sellerId: 'mock-seller'
    }
  ]
};

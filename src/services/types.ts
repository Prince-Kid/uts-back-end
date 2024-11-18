// types.ts
interface Address {
  street: string;
  city: string;
  country: string;
}

interface ProductItem {
  productId: string;
  quantity: number;
}

interface Order {
  products: ProductItem[];
  totalAmount: number;
  deliveryAddress: Address;
}

interface User {
  name: string;
  email: string;
}

interface Vendor {
  storeName: string;
  user: User;
}

import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}
interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });
  const addProduct = async (productId: number) => {
    try {
        const responseStock = await api.get<Stock>(`/stock/${productId}`);
        const productOnStock = responseStock.data ;
      
      if(productOnStock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

        const product = await api.get(`/products/${productId}`);
        const findProductInCart = cart.find(item => item.id === productId);
        if (findProductInCart) {
            await updateProductAmount({productId: findProductInCart.id, amount :findProductInCart.amount + 1})
            return
          } 
        if (!findProductInCart) {
            const newProduct = {...product.data, amount: 1}
            const newCart = [...cart, newProduct];
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
            toast.success('Adicionado');
        }
            
    } catch {
      toast.error('Erro na adição do produto');
    }

  };

  const removeProduct = (productId: number) => {
    try {
      const indexElement = cart.findIndex(item => item.id === productId);
      console.log('add-product-button',indexElement )
      if (indexElement != -1) {
        cart.splice(indexElement, 1)
        setCart([...cart])    
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart));
        toast.info('Item removido do carrinho.');
      } else {
        toast.error('Erro na remoção do produto');
      }
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stockData } = await api.get(`stock/${productId}`);
      
      if(stockData.amount >= amount && amount > 0){
        const updatedProduct = cart.map(product => {
          if(product.id === productId){
            return { ...product, amount}
          }
          return {...product}
        })
        
        setCart(updatedProduct)
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProduct))
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

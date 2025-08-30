import React from 'react';
import { Cart, Product, getProductById } from '../data/mockData';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: string;
  product?: Product;
}

export interface ShoppingCartProps {
  cart: Cart | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  loading?: boolean;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  loading = false
}) => {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="shopping-cart-empty">
        <div className="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
      </div>
    );
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <span className="item-count">{itemCount} items</span>
      </div>

      <div className="cart-items">
        {cart.items.map((item) => {
          const product = getProductById(item.productId);
          if (!product) return null;

          return (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                <img src={product.image} alt={product.name} />
              </div>
              
              <div className="item-details">
                <h4 className="item-name">{product.name}</h4>
                <p className="item-brand">{product.brand}</p>
                <p className="item-price">${item.price}</p>
                
                {!product.inStock && (
                  <span className="out-of-stock-warning">⚠️ Out of stock</span>
                )}
              </div>
              
              <div className="item-quantity">
                <button 
                  className="quantity-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || loading}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={!product.inStock || loading}
                >
                  +
                </button>
              </div>
              
              <div className="item-total">
                <span className="total-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button 
                  className="remove-btn"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={loading}
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal ({itemCount} items):</span>
          <span className="subtotal">${cart.total.toFixed(2)}</span>
        </div>
        
        <div className="summary-row">
          <span>Shipping:</span>
          <span className="shipping">
            {cart.total > 50 ? 'FREE' : '$5.99'}
          </span>
        </div>
        
        <div className="summary-row total-row">
          <span>Total:</span>
          <span className="total">
            ${(cart.total + (cart.total > 50 ? 0 : 5.99)).toFixed(2)}
          </span>
        </div>
        
        <button 
          className="checkout-btn"
          onClick={onCheckout}
          disabled={loading || cart.items.length === 0}
        >
          {loading ? 'Processing...' : 'Proceed to Checkout'}
        </button>
        
        {cart.total < 50 && (
          <p className="free-shipping-notice">
            Add ${(50 - cart.total).toFixed(2)} more for free shipping!
          </p>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
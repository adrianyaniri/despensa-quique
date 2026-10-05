/**
 * Agnostic, DOM-independent cart state store.
 * Supports adding both standard products and combo offers.
 * Implements a lightweight observer pattern for UI reactivity.
 *
 * Each item in the cart follows the schema:
 * {
 *   id: string,
 *   title: string,
 *   price: number,
 *   regularPrice?: number,
 *   qty: number,
 *   maxStock?: number
 * }
 */

class CartStore {
  constructor() {
    this.items = {}; // { [id]: item }
    this.listeners = new Set();
  }

  /**
   * Subscribe to cart changes. Returns an unsubscribe function.
   * @param {Function} listener - callback(cartState)
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(fn => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('CartStore listener error:', err);
      }
    });
  }

  /**
   * Adds an item to the cart or increments its quantity.
   * @param {{ id: string, title: string, price: number, regularPrice?: number, maxStock?: number }} item
   * @param {number} [qty=1]
   * @returns {boolean} true if added, false if max stock exceeded
   */
  addItem(item, qty = 1) {
    if (!item || !item.id) return false;

    const existing = this.items[item.id];
    const currentQty = existing ? existing.qty : 0;
    const maxStock = item.maxStock || Infinity;

    if (currentQty + qty > maxStock) {
      return false;
    }

    if (existing) {
      existing.qty += qty;
    } else {
      this.items[item.id] = {
        id: item.id,
        title: item.title,
        price: Number(item.price || 0),
        regularPrice: item.regularPrice ? Number(item.regularPrice) : null,
        maxStock: item.maxStock || null,
        qty: qty
      };
    }

    this.notify();
    return true;
  }

  /**
   * Increments quantity of an existing cart item by 1.
   * @param {string} id
   * @returns {boolean}
   */
  increment(id) {
    const item = this.items[id];
    if (!item) return false;

    const maxStock = item.maxStock || Infinity;
    if (item.qty >= maxStock) {
      return false;
    }

    item.qty++;
    this.notify();
    return true;
  }

  /**
   * Decrements quantity of a cart item by 1, removing it if qty reaches 0.
   * @param {string} id
   */
  decrement(id) {
    const item = this.items[id];
    if (!item) return;

    item.qty--;
    if (item.qty <= 0) {
      delete this.items[id];
    }

    this.notify();
  }

  /**
   * Removes an item completely from the cart.
   * @param {string} id
   */
  removeItem(id) {
    if (this.items[id]) {
      delete this.items[id];
      this.notify();
    }
  }

  /**
   * Clears all items from the cart.
   */
  clear() {
    this.items = {};
    this.notify();
  }

  getItems() {
    return Object.values(this.items);
  }

  getItem(id) {
    return this.items[id] || null;
  }

  getQuantity(id) {
    return this.items[id] ? this.items[id].qty : 0;
  }

  getTotalCount() {
    return Object.values(this.items).reduce((sum, item) => sum + item.qty, 0);
  }

  getTotalPrice() {
    return Object.values(this.items).reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  getTotalSavings() {
    return Object.values(this.items).reduce((sum, item) => {
      const regular = item.regularPrice || item.price;
      return sum + item.qty * Math.max(0, regular - item.price);
    }, 0);
  }

  getSnapshot() {
    return {
      items: this.getItems(),
      totalCount: this.getTotalCount(),
      totalPrice: this.getTotalPrice(),
      totalSavings: this.getTotalSavings(),
      isEmpty: this.getTotalCount() === 0
    };
  }
}

export const cartStore = new CartStore();

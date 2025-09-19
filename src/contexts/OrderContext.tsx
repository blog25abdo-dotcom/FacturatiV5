import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Product } from './DataContext';

export interface Order {
  id: string;
  number: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  entrepriseId: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  productId: string;
  action: 'created' | 'confirmed' | 'delivered' | 'cancelled' | 'modified';
  previousStatus?: string;
  newStatus?: string;
  quantity: number;
  timestamp: string;
  notes?: string;
  entrepriseId: string;
}

interface OrderContextType {
  orders: Order[];
  orderHistory: OrderHistory[];
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt' | 'entrepriseId'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status'], notes?: string) => Promise<void>;
  getOrdersByProduct: (productId: string) => Order[];
  getOrderHistory: (productId: string) => OrderHistory[];
  getProductOrderStats: (productId: string) => {
    totalOrders: number;
    totalQuantity: number;
    totalValue: number;
    deliveredQuantity: number;
    pendingQuantity: number;
  };
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    const entrepriseId = user.isAdmin ? user.id : user.entrepriseId;

    // Commandes
    const ordersQuery = query(
      collection(db, 'orders'),
      where('entrepriseId', '==', entrepriseId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
    });

    // Historique des commandes
    const historyQuery = query(
      collection(db, 'orderHistory'),
      where('entrepriseId', '==', entrepriseId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as OrderHistory));
      setOrderHistory(historyData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeHistory();
    };
  }, [isAuthenticated, user]);

  const generateOrderNumber = () => {
    const currentYear = new Date().getFullYear();
    const yearOrders = orders.filter(order => 
      new Date(order.orderDate).getFullYear() === currentYear
    );
    const counter = yearOrders.length + 1;
    return `CMD-${currentYear}-${String(counter).padStart(3, '0')}`;
  };

  const addOrderToHistory = async (orderId: string, productId: string, action: OrderHistory['action'], quantity: number, previousStatus?: string, newStatus?: string, notes?: string) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'orderHistory'), {
        orderId,
        productId,
        action,
        previousStatus,
        newStatus,
        quantity,
        timestamp: new Date().toISOString(),
        notes,
        entrepriseId: user.isAdmin ? user.id : user.entrepriseId
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'number' | 'createdAt' | 'entrepriseId'>) => {
    if (!user) return;
    
    try {
      const orderNumber = generateOrderNumber();
      
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        number: orderNumber,
        entrepriseId: user.isAdmin ? user.id : user.entrepriseId,
        createdAt: new Date().toISOString()
      });

      // Ajouter à l'historique
      await addOrderToHistory(docRef.id, orderData.productId, 'created', orderData.quantity, undefined, orderData.status);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la commande:', error);
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        ...orderData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status'], notes?: string) => {
    try {
      const order = orders.find(o => o.id === id);
      if (!order) return;

      const previousStatus = order.status;
      
      await updateDoc(doc(db, 'orders', id), {
        status,
        notes,
        updatedAt: new Date().toISOString(),
        ...(status === 'delivered' && { deliveryDate: new Date().toISOString() })
      });

      // Ajouter à l'historique
      await addOrderToHistory(id, order.productId, status, order.quantity, previousStatus, status, notes);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
    }
  };

  const getOrdersByProduct = (productId: string) => {
    return orders.filter(order => order.productId === productId);
  };

  const getOrderHistory = (productId: string) => {
    return orderHistory.filter(history => history.productId === productId);
  };

  const getProductOrderStats = (productId: string) => {
    const productOrders = orders.filter(order => order.productId === productId);
    
    const totalOrders = productOrders.length;
    const totalQuantity = productOrders.reduce((sum, order) => sum + order.quantity, 0);
    const totalValue = productOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const deliveredQuantity = productOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.quantity, 0);
    
    const pendingQuantity = productOrders
      .filter(order => order.status === 'pending' || order.status === 'confirmed')
      .reduce((sum, order) => sum + order.quantity, 0);

    return {
      totalOrders,
      totalQuantity,
      totalValue,
      deliveredQuantity,
      pendingQuantity
    };
  };

  const value = {
    orders,
    orderHistory,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrdersByProduct,
    getOrderHistory,
    getProductOrderStats,
    isLoading
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
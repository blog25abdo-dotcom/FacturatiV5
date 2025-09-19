import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  Download,
  Search,
  Crown,
  BarChart3,
  TrendingDown,
  CheckCircle,
  XCircle,
  Filter,
  Calendar,
  PieChart,
  Activity,
  Truck,
  Clock,
  Plus,
  Edit,
  History,
  X
} from 'lucide-react';
import AddOrderModal from '../orders/AddOrderModal';
import OrderStatusModal from '../orders/OrderStatusModal';
import ProductOrderHistory from '../orders/ProductOrderHistory';
import StockEvolutionChart from './charts/StockEvolutionChart';
import DonutChart from './charts/DonutChart';
import MarginChart from './charts/MarginChart';
import MonthlySalesChart from './charts/MonthlySalesChart';
import SalesHeatmap from './charts/SalesHeatmap';
import html2pdf from 'html2pdf.js';

export default function StockManagement() {
  const { user } = useAuth();
  const { products } = useData();
  const { orders, getProductOrderStats, getProductStockInfo, updateOrderStatus } = useOrder();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<string | null>(null);
  const [orderStatusModal, setOrderStatusModal] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  // Vérifier l'accès PRO
  const isProActive = user?.company.subscription === 'pro' && user?.company.expiryDate && 
    new Date(user.company.expiryDate) > new Date();

  if (!isProActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🔒 Fonctionnalité PRO
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            La Gestion de Stock est réservée aux abonnés PRO. 
            Passez à la version PRO pour accéder à cette fonctionnalité avancée.
          </p>
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
            <span className="flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Passer à PRO - 299 MAD/mois</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Générer les données pour les graphiques
  const generateStockEvolutionData = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      // Calculer les commandes livrées pour ce mois
      const monthDelivered = orders
        .filter(order => {
          const orderDate = new Date(order.orderDate);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear() &&
                 order.productId === productId &&
                 order.status === 'delivered';
        })
        .reduce((sum, order) => sum + order.quantity, 0);

      months.push({
        month: monthName,
        initialStock: product.stock,
        delivered: monthDelivered,
        remaining: Math.max(0, product.stock - monthDelivered)
      });
    }
    
    return months;
  };

  // Données détaillées par produit
  const getDetailedProductData = () => {
    return products.map(product => {
      const orderStats = getProductOrderStats(product.id);
      const stockInfo = getProductStockInfo(product.id);

      return {
        ...product,
        quantitySold: orderStats.deliveredQuantity,
        salesValue: orderStats.totalValue,
        ordersCount: orderStats.totalOrders,
        remainingStock: stockInfo.remainingStock,
        purchaseValue: product.stock * product.purchasePrice,
        margin: orderStats.totalValue - (orderStats.deliveredQuantity * product.purchasePrice)
      };
    }).filter(product => {
      if (selectedProduct === 'all') return true;
      return product.id === selectedProduct;
    });
  };

  const detailedData = getDetailedProductData();

  const generateDonutData = (type: 'orders' | 'stock') => {
    const colors = [
      '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
      '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6'
    ];

    if (type === 'orders') {
      const salesByProduct = products.map(product => {
        const orderStats = getProductOrderStats(product.id);
        return { product: product.name, value: orderStats.totalValue };
      }).filter(item => item.value > 0);

      const totalSales = salesByProduct.reduce((sum, item) => sum + item.value, 0);

      return salesByProduct.map((item, index) => ({
        label: item.product,
        value: item.value,
        color: colors[index % colors.length],
        percentage: totalSales > 0 ? (item.value / totalSales) * 100 : 0
      }));
    } else {
      const stockByProduct = products.map(product => {
        const deliveredQuantity = orders
          .filter(order => order.productId === product.id && order.status === 'delivered')
          .reduce((sum, order) => sum + order.quantity, 0);
        
        const remainingStock = Math.max(0, product.stock - deliveredQuantity);
        const stockValue = remainingStock * product.purchasePrice;
        
        return { product: product.name, value: stockValue };
      }).filter(item => item.value > 0);

      const totalStockValue = stockByProduct.reduce((sum, item) => sum + item.value, 0);

      return stockByProduct.map((item, index) => ({
        label: item.product,
        value: item.value,
        color: colors[index % colors.length],
        percentage: totalStockValue > 0 ? (item.value / totalStockValue) * 100 : 0
      }));
    }
  };

  const generateMarginData = () => {
    return products.map(product => {
      const orderStats = getProductOrderStats(product.id);
      const deliveredQuantity = orderStats.deliveredQuantity;
      const deliveredValue = orderStats.totalValue;

      const purchaseValue = deliveredQuantity * product.purchasePrice;
      const margin = deliveredValue - purchaseValue;

      return {
        productName: product.name,
        margin,
        salesValue: deliveredValue,
        purchaseValue,
        unit: product.unit || 'unité'
      };
    }).filter(item => item.salesValue > 0);
  };

  const generateMonthlySalesData = () => {
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthData = orders
        .filter(order => {
          const orderDate = new Date(order.orderDate);
          return orderDate.getMonth() === i && 
                 orderDate.getFullYear() === selectedYear &&
                 order.status === 'delivered' &&
                 (selectedProduct === 'all' || order.productId === selectedProduct);
        })
        .reduce((acc, order) => {
          acc.quantity += order.quantity;
          acc.value += order.totalPrice;
          acc.ordersCount += 1;
          return acc;
        }, { quantity: 0, value: 0, ordersCount: 0 });

      months.push({
        month: monthName,
        ...monthData
      });
    }
    
    return months;
  };

  const generateHeatmapData = () => {
    const months = [];
    const productNames = products.map(p => p.name);
    
    // Générer les données pour chaque mois
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedYear, i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      months.push(monthName);
    }

    const heatmapData: any[] = [];
    let maxQuantity = 0;

    // Calculer les données pour chaque combinaison produit/mois
    productNames.forEach(productName => {
      months.forEach(month => {
        const monthIndex = months.indexOf(month);
        const monthOrders = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === monthIndex && 
                   orderDate.getFullYear() === selectedYear &&
                   order.status === 'delivered';
          })
          .reduce((sum, order) => {
            const product = products.find(p => p.name === productName);
            return order.productId === product?.id ? sum + order.quantity : sum;
          }, 0);

        const monthValue = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === monthIndex && 
                   orderDate.getFullYear() === selectedYear &&
                   order.status === 'delivered';
          })
          .reduce((sum, order) => {
            const product = products.find(p => p.name === productName);
            return order.productId === product?.id ? sum + order.totalPrice : sum;
          }, 0);

        maxQuantity = Math.max(maxQuantity, monthOrders);
        
        heatmapData.push({
          month,
          productName,
          quantity: monthOrders,
          value: monthValue,
          intensity: 0 // sera calculé après
        });
      });
    });

    // Calculer l'intensité (0-1)
    return heatmapData.map(item => ({
      ...item,
      intensity: maxQuantity > 0 ? item.quantity / maxQuantity : 0
    }));
  };

  // Calculer les statistiques existantes
  const calculateStats = (productFilter: string = 'all') => {
    let filteredProducts = products;
    
    if (productFilter !== 'all') {
      filteredProducts = products.filter(p => p.id === productFilter);
    }

    let totalStockInitial = 0;
    let totalPurchaseValue = 0;
    let totalRemainingStock = 0;
    let dormantProducts = 0;

    const orderStats = filteredProducts.reduce((acc, product) => {
      totalStockInitial += product.stock;
      totalPurchaseValue += product.stock * product.purchasePrice;
      
      const productOrderStats = getProductOrderStats(product.id);
      const stockInfo = getProductStockInfo(product.id);
      
      acc.totalValue += productOrderStats.totalValue;
      acc.deliveredQuantity += productOrderStats.deliveredQuantity;
      totalRemainingStock += stockInfo.remainingStock;
      
      if (productOrderStats.deliveredQuantity === 0) {
        dormantProducts++;
      }
      
      return acc;
    }, { totalValue: 0, deliveredQuantity: 0 });

    const grossMargin = orderStats.totalValue - totalPurchaseValue;
    
    return {
      totalStockInitial,
      totalPurchaseValue,
      totalSalesValue: orderStats.totalValue,
      totalQuantitySold: orderStats.deliveredQuantity,
      totalRemainingStock,
      dormantProducts,
      grossMargin: orderStats.totalValue - totalPurchaseValue
    };
  };

  const stats = calculateStats(selectedProduct);
  const ordersDonutData = generateDonutData('orders');
  const stockDonutData = generateDonutData('stock');
  const marginData = generateMarginData();
  const monthlySalesData = generateMonthlySalesData();
  const heatmapData = generateHeatmapData();
  const availableYears = [...new Set(orders.map(order => new Date(order.orderDate).getFullYear()))].sort((a, b) => b - a);
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'evolution', label: 'Évolution', icon: TrendingUp },
    { id: 'margins', label: 'Marges', icon: DollarSign },
    { id: 'heatmap', label: 'Heatmap', icon: Activity }
  ];

  const handleExportPDF = () => {
    const reportContent = generateReportHTML();
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.zIndex = '-1';
    tempDiv.style.opacity = '0';
    tempDiv.innerHTML = reportContent;
    document.body.appendChild(tempDiv);

    const options = {
      margin: [10, 10, 10, 10],
      filename: `Rapport_Stock_Avance_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: false,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    html2pdf()
      .set(options)
      .from(tempDiv)
      .save()
      .then(() => {
        document.body.removeChild(tempDiv);
      })
      .catch((error) => {
        console.error('Erreur lors de la génération du PDF:', error);
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        alert('Erreur lors de la génération du PDF');
      });
  };

  const generateReportHTML = () => {
    return `
      <div style="padding: 20px; font-family: Arial, sans-serif; background: white;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8B5CF6; padding-bottom: 20px;">
          <h1 style="font-size: 28px; color: #8B5CF6; margin: 0; font-weight: bold;">RAPPORT DE GESTION DE STOCK AVANCÉ</h1>
          <h2 style="font-size: 20px; color: #1f2937; margin: 10px 0; font-weight: bold;">${user?.company?.name || ''}</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">📊 Statistiques Globales</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #8B5CF6;">
              <p style="font-size: 14px; color: #5B21B6; margin: 0;"><strong>Marge Brute Totale:</strong> ${stats.grossMargin.toLocaleString()} MAD</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
              <p style="font-size: 14px; color: #92400e; margin: 0;"><strong>Valeur Stock Restant:</strong> ${stats.totalRemainingStock.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleAddOrder = (productId: string) => {
    setSelectedProductForOrder(productId);
    setIsAddOrderModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setViewingHistory(productId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span>Gestion de Stock Avancée</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Analysez vos stocks avec des graphiques interactifs et des visualisations avancées. 
            Fonctionnalité PRO avec export PDF.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filtres et contrôles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrer par produit
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les produits</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Année d'analyse
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Période d'analyse
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="month">Mensuel</option>
              <option value="quarter">Trimestriel</option>
              <option value="year">Annuel</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="space-y-6">


  {/* Dashboard - Blocs d'indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stock Initial */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalStockInitial.toFixed(0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Stock Initial</p>
            </div>
          </div>
        </div>

        {/* Valeur d'Achat */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPurchaseValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Valeur d'Achat (MAD)</p>
            </div>
          </div>
        </div>

        {/* Valeur de Vente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSalesValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Valeur de Vente (MAD)</p>
            </div>
          </div>
        </div>

        {/* Marge Brute */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.grossMargin >= 0 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {stats.grossMargin >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                stats.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.grossMargin >= 0 ? '+' : ''}{stats.grossMargin.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Marge Brute (MAD)</p>
            </div>
          </div>
        </div>

        {/* Stock Restant */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRemainingStock.toFixed(0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Stock Restant</p>
            </div>
          </div>
        </div>

        {/* Quantité Vendue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalQuantitySold.toFixed(0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Quantité Vendue</p>
            </div>
          </div>
        </div>

        {/* Produits Dormants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.dormantProducts}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Produits Non Vendus</p>
            </div>
          </div>
        </div>
     </div>

          {/* Graphiques de synthèse */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChart
              data={ordersDonutData}
              title="Répartition des Commandes"
              subtitle="Par produit (valeur)"
              centerValue={`${ordersDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`}
              centerLabel="MAD Total"
            />
            
            <DonutChart
              data={stockDonutData}
              title="Valeur du Stock Restant"
              subtitle="Par produit (valeur d'achat)"
              centerValue={`${stockDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`}
              centerLabel="MAD Stock"
            />
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Header section commandes */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestion des Commandes</h2>
            <button
              onClick={() => setIsAddOrderModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Commande</span>
            </button>
          </div>

          {/* Stats commandes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Commandes</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Livrées</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">En Cours</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {orders.filter(o => o.status === 'cancelled').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Annulées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des commandes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Toutes les Commandes</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      N° Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => {
                    const product = products.find(p => p.id === order.productId);
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.productName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{product?.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.quantity} {product?.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {order.totalPrice.toLocaleString()} MAD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'delivered' ? 'Livrée' :
                             order.status === 'confirmed' ? 'Confirmée' :
                             order.status === 'cancelled' ? 'Annulée' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => setOrderStatusModal(order.id)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Changer statut"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune commande créée</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Créez votre première commande pour commencer
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'evolution' && selectedProduct !== 'all' && (
        <StockEvolutionChart
          data={generateStockEvolutionData(selectedProduct)}
          productName={products.find(p => p.id === selectedProduct)?.name || 'Produit'}
          unit={products.find(p => p.id === selectedProduct)?.unit || 'unité'}
        />
      )}

      {activeTab === 'evolution' && selectedProduct === 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sélectionnez un produit</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Pour voir l'évolution du stock, veuillez sélectionner un produit spécifique dans les filtres.
          </p>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            data={ordersDonutData}
            title="Répartition des Commandes"
            subtitle="Par produit (valeur en MAD)"
            centerValue={`${ordersDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`}
            centerLabel="MAD Total"
          />
          
          <DonutChart
            data={stockDonutData}
            title="Valeur du Stock Restant"
            subtitle="Par produit (valeur d'achat)"
            centerValue={`${stockDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`}
            centerLabel="MAD Stock"
          />
        </div>
      )}

      {activeTab === 'margins' && (
        <MarginChart data={marginData} />
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <MonthlySalesChart 
            data={monthlySalesData}
            selectedYear={selectedYear}
          />
          
          <SalesHeatmap
            data={heatmapData}
            products={products.map(p => p.name)}
            months={months}
            selectedYear={selectedYear}
          />
        </div>
      )}
   {/* Tableau détaillé */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analyse Détaillée par Produit</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Initial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Qté Commandée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Qté Livrée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock Restant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valeur Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const orderStats = getProductOrderStats(product.id);
                const stockInfo = getProductStockInfo(product.id);
                
                return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.stock.toFixed(3)} {product.unit || 'unité'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {product.minStock.toFixed(3)} {product.unit || 'unité'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {orderStats.totalQuantity.toFixed(3)} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {orderStats.totalOrders} commande{orderStats.totalOrders > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {orderStats.deliveredQuantity.toFixed(3)} {product.unit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      En attente: {orderStats.pendingQuantity.toFixed(3)} {product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        stockInfo.remainingStock <= product.minStock ? 'text-red-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {stockInfo.remainingStock.toFixed(3)} {product.unit}
                      </span>
                      {stockInfo.remainingStock <= product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {orderStats.totalValue.toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleAddOrder(product.id)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="Nouvelle commande"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewHistory(product.id)}
                        className="text-purple-600 hover:text-purple-700 transition-colors"
                        title="Historique"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
          </div>
        )}
      </div>
      {/* Indicateur de performance global */}
      {stats.grossMargin < 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">⚠️ Performance Déficitaire</h3>
          </div>
          <p className="text-red-800 dark:text-red-200">
            Votre marge brute est négative de <strong>{Math.abs(stats.grossMargin).toLocaleString()} MAD</strong>. 
            Analysez les graphiques pour identifier les produits les moins rentables.
          </p>
        </div>
      )}

      {stats.grossMargin > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">✅ Performance Positive</h3>
          </div>
          <p className="text-green-800 dark:text-green-200">
            Excellente performance ! Votre marge brute est de <strong>+{stats.grossMargin.toLocaleString()} MAD</strong>. 
            Utilisez les graphiques pour optimiser davantage vos ventes.
          </p>
        </div>
      )}

      {/* Modals */}
      <AddOrderModal 
        isOpen={isAddOrderModalOpen} 
        onClose={() => {
          setIsAddOrderModalOpen(false);
          setSelectedProductForOrder(null);
        }}
        preselectedProductId={selectedProductForOrder || undefined}
      />

      {/* Modal historique */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Historique des Commandes
                </h3>
                <button
                  onClick={() => setViewingHistory(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ProductOrderHistory 
                  productId={viewingHistory}
                  productName={products.find(p => p.id === viewingHistory)?.name || 'Produit'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal statut commande */}
      {orderStatusModal && (
        <OrderStatusModal
          isOpen={!!orderStatusModal}
          onClose={() => setOrderStatusModal(null)}
          order={orders.find(o => o.id === orderStatusModal)!}
        />
      )}
    </div>
  );
}
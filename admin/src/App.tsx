import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Categories from './pages/Categories';
import Coupons from './pages/Coupons';
import Banners from './pages/Banners';
import Promotions from './pages/Promotions';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <div style={{ padding: 40 }}>Access denied. Admins only.</div>;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductForm />} />
                    <Route path="/products/:id/edit" element={<ProductForm />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/coupons" element={<Coupons />} />
                    <Route path="/banners" element={<Banners />} />
                    <Route path="/promotions" element={<Promotions />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Image, Megaphone, LogOut, Layers } from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/coupons', label: 'Coupons', icon: Tag },
  { to: '/banners', label: 'Banners', icon: Image },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 240, background: '#1e3a8a', color: '#fff', padding: 20 }}>
        <h2 style={{ margin: '0 0 20px' }}>Weblign Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  color: '#fff',
                  textDecoration: 'none',
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>{user?.email}</div>
          <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, background: '#f8fafc' }}>{children}</main>
    </div>
  );
}

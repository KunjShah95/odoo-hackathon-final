import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, LineChart, PieChart, LogIn, Database, RefreshCw } from 'lucide-react';
import { adminAnalytics, adminBootstrap, adminLogin, adminSeed } from '../utils/api';

const AdminDashboard: React.FC = () => {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [stats, setStats] = useState<{ users:number; trips:number; stops:number; activities:number; totalExpenses:number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureBootstrap() {
    try { await adminBootstrap(); } catch {}
  }
  async function doLogin() {
    setError(null);
    setLoading(true);
    try {
      await ensureBootstrap();
  const email = (import.meta as any)?.env?.VITE_ADMIN_EMAIL || 'admin@example.com';
  const password = (import.meta as any)?.env?.VITE_ADMIN_PASSWORD || 'admin123';
      const r = await adminLogin(email, password);
      setAdminToken(r.token);
    } catch (e:any) {
      setError(e?.message || 'Login failed');
    } finally { setLoading(false); }
  }
  async function loadAnalytics(tok: string) {
    setLoading(true);
    setError(null);
    try {
      const r = await adminAnalytics(tok);
      setStats(r);
    } catch (e:any) {
      setError(e?.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  }
  async function seedData() {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      await adminSeed(adminToken);
      await loadAnalytics(adminToken);
    } catch (e:any) { setError(e?.message || 'Seed failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    // Auto-login for convenience in demo
    (async () => {
      try {
        await ensureBootstrap();
  const email = (import.meta as any)?.env?.VITE_ADMIN_EMAIL || 'admin@example.com';
  const password = (import.meta as any)?.env?.VITE_ADMIN_PASSWORD || 'admin123';
        const r = await adminLogin(email, password);
        setAdminToken(r.token);
        await loadAnalytics(r.token);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {!adminToken ? (
            <button onClick={doLogin} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
              <LogIn size={16} /> {loading ? 'Logging in…' : 'Login as Admin'}
            </button>
          ) : (
            <>
              <button onClick={() => loadAnalytics(adminToken)} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-600 text-white disabled:opacity-50">
                <RefreshCw size={16} /> Refresh
              </button>
              <button onClick={seedData} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">
                <Database size={16} /> Seed Dummy Data
              </button>
            </>
          )}
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats ? stats.users : '—'}</div>
            <p className="text-sm text-gray-500">Total registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats ? stats.trips : '—'}</div>
            <p className="text-sm text-gray-500">Total trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${stats ? stats.totalExpenses.toFixed(2) : '—'}</div>
            <p className="text-sm text-gray-500">Sum of all expenses</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">User Growth</h3>
                <LineChart className="w-full h-64" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Trip Distribution</h3>
                <BarChart className="w-full h-64" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Revenue by Source</h3>
                <PieChart className="w-full h-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

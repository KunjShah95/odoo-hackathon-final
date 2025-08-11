import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, LineChart, PieChart } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">1,234</div>
            <p className="text-sm text-gray-500">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">567</div>
            <p className="text-sm text-gray-500">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">$12,345</div>
            <p className="text-sm text-gray-500">+20% from last month</p>
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

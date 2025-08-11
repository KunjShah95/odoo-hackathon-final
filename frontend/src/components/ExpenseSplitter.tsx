import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DollarSign, User } from 'lucide-react';

interface Expense {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
}

const DEMO_USERS = ['Varad', 'Kunj', 'You'];

const ExpenseSplitter: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(DEMO_USERS[0]);

  const addExpense = () => {
    if (!desc || !amount || isNaN(Number(amount))) return;
    setExpenses([
      ...expenses,
      { id: Date.now(), description: desc, amount: Number(amount), paidBy }
    ]);
    setDesc('');
    setAmount('');
  };

  // Calculate who owes whom (very basic logic for demo)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = total / DEMO_USERS.length;
  const paid: Record<string, number> = {};
  DEMO_USERS.forEach(u => (paid[u] = 0));
  expenses.forEach(e => (paid[e.paidBy] += e.amount));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" /> Expense Splitter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <Input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
          <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="border rounded px-2 py-1">
            {DEMO_USERS.map(u => <option key={u}>{u}</option>)}
          </select>
          <Button onClick={addExpense} disabled={!desc || !amount}>Add</Button>
        </div>
        <ul className="mb-4 space-y-1">
          {expenses.map(e => (
            <li key={e.id} className="flex gap-2 text-gray-700">
              <User className="w-4 h-4 text-blue-400" />
              <span>{e.paidBy} paid ${e.amount} for {e.description}</span>
            </li>
          ))}
        </ul>
        <div className="font-medium text-green-700 mb-2">Total: ${total.toFixed(2)} | Per Person: ${perPerson.toFixed(2)}</div>
        <div className="text-sm text-gray-600">
          {DEMO_USERS.map(u => (
            <div key={u}>{u} paid ${paid[u].toFixed(2)} ({paid[u] > perPerson ? 'gets back' : 'owes'} ${(Math.abs(paid[u] - perPerson)).toFixed(2)})</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseSplitter;

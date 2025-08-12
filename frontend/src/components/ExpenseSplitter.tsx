import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DollarSign, Trash2 } from 'lucide-react';
import { addExpense, getExpenses, deleteExpense, getTripSettlement, setExpenseShares } from '../utils/api';
import { User } from '../types';

interface ExpenseBackend { id:number; description?:string; amount:number; category:string; user_id:number; }
interface Participant { id:number; name:string; }

interface ExpenseSplitterProps { tripId: string; participants: Participant[]; user: User; }

const ExpenseSplitter: React.FC<ExpenseSplitterProps> = ({ tripId, participants, user }) => {
  const token = localStorage.getItem('token') || '';
  const [expenses, setExpenses] = useState<ExpenseBackend[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [settlement, setSettlement] = useState<{ user_id:number; net:number }[] | null>(null);
  const [sharesDraft, setSharesDraft] = useState<Record<number, number>>({});
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(()=>{ if(token) refresh(); }, [tripId]);

  function refresh() {
    if(!token) return;
    getExpenses(tripId, token).then(setExpenses).catch((e)=>{ console.warn(e); });
    getTripSettlement(tripId, token).then(r=> setSettlement(r.settlements)).catch((e)=>{ console.warn(e); });
  }

  const add = () => {
    setError(null);
    setSuccess(null);
    if(!token){ setError('Please log in to add expenses.'); return; }
    if(!desc || !amount) { setError('Description and amount are required.'); return; }
    setAdding(true);
    addExpense(tripId, { category, amount: Number(amount), description: desc }, token).then(()=> {
      setDesc(''); setAmount(''); refresh();
      setSuccess('Expense added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }).catch((e:any)=> { setError(e?.message || 'Failed to add expense'); }).finally(()=> setAdding(false));
  };
  const remove = (id:number) => {
    setError(null);
    setSuccess(null);
    if(!token){ setError('Please log in to delete expenses.'); return; }
    deleteExpense(id, token).then(()=>refresh()).catch((e:any)=> setError(e?.message || 'Failed to delete expense'));
  };

  const openShares = (id:number) => {
    setSelectedExpense(id);
    const count = participants.length || 1;
    const equal = 1 / count;
    const draft:Record<number,number>={};
    participants.forEach(p=> draft[p.id]=equal);
    setSharesDraft(draft);
  };
  const saveShares = () => {
    if(selectedExpense==null) return; const shares = Object.entries(sharesDraft).map(([uid, share])=>({ user_id:Number(uid), share_amount: Number(share)}));
    setExpenseShares(selectedExpense, shares, token).then(()=>{ setSelectedExpense(null); refresh(); }).catch(()=>{});
  };

const total = expenses.reduce((s,e)=> s + Number(e.amount), 0);
const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', INR: '₹' };
const userCurrency = user.currency_preference || 'INR';

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /> Expenses & Split</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token && (
          <div className="text-xs text-red-600">You are not logged in. Please log in to manage expenses.</div>
        )}
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} className="w-40" 
            onKeyDown={e => {
              if (e.key === 'Enter' && desc && amount && !adding) {
                e.preventDefault();
                add();
              }
            }} />
            <Input placeholder="Amount" type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-28" 
              onKeyDown={e => {
                if (e.key === 'Enter' && desc && amount && !adding) {
                  e.preventDefault();
                  add();
                }
              }} />
            <Input placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} className="w-28" 
              onKeyDown={e => {
                if (e.key === 'Enter' && desc && amount && !adding) {
                  e.preventDefault();
                  add();
                }
              }} />
            <Button onClick={add} disabled={!desc || !amount || !token || adding}>{adding? 'Adding…':'Add'}</Button>
          <div className="ml-auto font-semibold">Total: {currencySymbols[userCurrency]}{total.toFixed(2)}</div>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        {success && <div className="text-xs text-green-600">{success}</div>}
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th>Description</th><th>Amount</th><th>Category</th><th /></tr></thead>
          <tbody>
            {expenses.map(e=> (
              <tr key={e.id} className="border-t">
                <td className="py-1">{e.description || '—'}</td>
                <td>{currencySymbols[userCurrency]}{Number(e.amount).toFixed(2)}</td>
                <td>{e.category}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={()=> openShares(e.id)}>Shares</Button>
                  <Button size="sm" variant="ghost" onClick={()=> remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
            {expenses.length===0 && <tr><td colSpan={4} className="text-center text-gray-400 py-4">No expenses yet</td></tr>}
          </tbody>
        </table>

        {selectedExpense && (
          <div className="p-3 border rounded-md bg-gray-50 space-y-2">
            <div className="font-medium">Set Shares (fractions summing to 1)</div>
            {participants.map(p=> (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-32 truncate">{p.name}</span>
                <Input type="number" step="0.01" value={sharesDraft[p.id] ?? ''} onChange={e=> setSharesDraft(prev=> ({ ...prev, [p.id]: Number(e.target.value) }))} className="w-24" />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={saveShares}>Save</Button>
              <Button size="sm" variant="outline" onClick={()=> setSelectedExpense(null)}>Cancel</Button>
              <div className="text-xs text-gray-500 ml-auto">Σ = {Object.values(sharesDraft).reduce((s,v)=> s+ (Number(v)||0),0).toFixed(2)}</div>
            </div>
          </div>
        )}

        {settlement && (
          <div className="p-3 border rounded-md bg-white">
            <div className="font-medium mb-2">Settlement</div>
            <ul className="space-y-1 text-xs">
              {settlement.map(s=> {
                const p = participants.find(pp=> pp.id===s.user_id); const name = p? p.name : `User ${s.user_id}`;
                return <li key={s.user_id} className={s.net>=0? 'text-green-600':'text-red-600'}>{name}: {s.net>=0? 'gets': 'owes'} {currencySymbols[userCurrency]}{Math.abs(s.net).toFixed(2)}</li>;
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseSplitter;


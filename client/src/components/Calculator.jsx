import React, { useState, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  IndianRupee, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Info,
  CalendarDays
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Calculator() {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(2);
  const [rateType, setRateType] = useState('monthly_pct'); // 'monthly_pct' or 'annual_pct'
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [result, setResult] = useState(null);

  useEffect(() => {
    calculate();
  }, [principal, rate, rateType, useDateRange, startDate, endDate]);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;

    let monthly = 0;
    let daily = 0;
    let effectiveAnnual = 0;

    if (rateType === 'monthly_pct') {
      monthly = (p * r) / 100;
      daily = monthly / 30;
      effectiveAnnual = r * 12;
    } else {
      monthly = (p * r) / (12 * 100);
      daily = (p * r) / (365 * 100);
      effectiveAnnual = r;
    }

    if (!useDateRange) {
      setResult({
        principal: p,
        rate: r,
        rateType,
        monthlyInterest: Math.round(monthly * 100) / 100,
        dailyInterest: Math.round(daily * 100) / 100,
        effectiveAnnualRate: Math.round(effectiveAnnual * 100) / 100,
        yearlyInterest: Math.round(monthly * 12 * 100) / 100
      });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      // Calculate calendar months and remaining days
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      let tempDate = new Date(start);
      tempDate.setMonth(tempDate.getMonth() + months);
      if (tempDate > end) {
        months--;
        tempDate = new Date(start);
        tempDate.setMonth(tempDate.getMonth() + months);
      }
      const remainingDays = Math.max(0, Math.floor((end.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24)));
      const accrued = Math.round(((months * monthly) + (remainingDays * daily)) * 100) / 100;

      setResult({
        principal: p,
        rate: r,
        rateType,
        monthlyInterest: Math.round(monthly * 100) / 100,
        dailyInterest: Math.round(daily * 100) / 100,
        effectiveAnnualRate: Math.round(effectiveAnnual * 100) / 100,
        yearlyInterest: Math.round(monthly * 12 * 100) / 100,
        totalDays,
        monthsElapsed: months,
        remainingDays,
        accruedInterest: accrued,
        totalPayoffAmount: Math.round((p + accrued) * 100) / 100
      });
    }
  };

  const presetAmounts = [25000, 50000, 100000, 200000, 500000];
  const presetRatesMonthly = [1.5, 2, 2.5, 3, 4];
  const presetRatesAnnual = [12, 18, 24, 30, 36];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CalcIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daily & Monthly Interest Calculator</h1>
            <p className="text-sm text-slate-400">
              Calculate exact interest breakdowns, broken-period accruals, and total repayment sums.
            </p>
          </div>
        </div>

        {/* Rate Type Selector */}
        <div className="inline-flex p-1 bg-slate-900/80 rounded-xl border border-slate-700">
          <button
            onClick={() => setRateType('monthly_pct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              rateType === 'monthly_pct'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ₹ per ₹100 / Month
          </button>
          <button
            onClick={() => setRateType('annual_pct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              rateType === 'annual_pct'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            % Per Annum (p.a.)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-6 bg-slate-800/60 rounded-2xl border border-slate-800 p-6 space-y-6">
          {/* Principal Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Principal Amount Given</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(principal)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-8 pr-4 text-white text-lg font-bold focus:outline-none transition-colors"
                placeholder="100000"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPrincipal(amt)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    principal === amt
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>
                {rateType === 'monthly_pct' ? 'Interest Rate (₹ per ₹100/month)' : 'Annual Interest Rate (% p.a.)'}
              </span>
              <span className="text-emerald-400 font-bold">
                {rate}% {rateType === 'monthly_pct' ? '/ month' : 'p.a.'}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white text-lg font-bold focus:outline-none transition-colors"
                placeholder="2"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                {rateType === 'monthly_pct' ? '% per month' : '% p.a.'}
              </span>
            </div>
            {/* Rate Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(rateType === 'monthly_pct' ? presetRatesMonthly : presetRatesAnnual).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    rate === r
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Broken Period Date Range Toggle */}
          <div className="pt-2 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDateRange}
                  onChange={(e) => setUseDateRange(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Calculate for specific dates / broken period</span>
              </label>
              {useDateRange && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Date Mode On
                </span>
              )}
            </div>

            {useDateRange && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start / Disbursement Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End / Settlement Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Live Breakdown */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Interest Calculation Breakdown
            </h3>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Monthly Interest Card */}
              <div className="bg-slate-900/90 border border-emerald-500/20 p-4 rounded-xl shadow-sm">
                <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Monthly Interest
                </div>
                <div className="text-2xl font-black text-white">
                  {result ? formatCurrency(result.monthlyInterest) : '₹0'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Per month collection
                </div>
              </div>

              {/* Daily Interest Card */}
              <div className="bg-slate-900/90 border border-teal-500/20 p-4 rounded-xl shadow-sm">
                <div className="text-xs font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Daily Interest
                </div>
                <div className="text-2xl font-black text-white">
                  {result ? formatCurrency(result.dailyInterest) : '₹0'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Accrues every single day
                </div>
              </div>
            </div>

            {/* Breakdown Details */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Principal Given</span>
                <span className="font-semibold text-white">{result ? formatCurrency(result.principal) : '₹0'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Effective Annual Rate</span>
                <span className="font-semibold text-emerald-400">{result?.effectiveAnnualRate}% p.a.</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Annual Return (12 Months)</span>
                <span className="font-semibold text-white">{result ? formatCurrency(result.yearlyInterest) : '₹0'}</span>
              </div>

              {useDateRange && result?.accruedInterest !== undefined && (
                <>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                      Duration
                    </span>
                    <span className="font-medium text-white">
                      {result.totalDays} Days ({result.monthsElapsed} mos + {result.remainingDays} days)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Total Accrued Interest</span>
                    <span className="font-bold text-amber-400">{formatCurrency(result.accruedInterest)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Grand Payoff Display */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/30">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              {useDateRange ? 'Total Payoff / Settlement Amount' : 'Total 1-Year Value (Principal + Interest)'}
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {result
                ? formatCurrency(useDateRange ? result.totalPayoffAmount : result.principal + result.yearlyInterest)
                : '₹0'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {useDateRange
                ? `Principal (${formatCurrency(principal)}) + Accrued Interest (${formatCurrency(result?.accruedInterest || 0)})`
                : 'Based on 12 months full interest collection'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

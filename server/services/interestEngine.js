/**
 * Precision Interest Calculation Engine for Loan Providers
 * Supports both Monthly % (Rupees per Rs 100/month) and Annual % (p.a.)
 */

function round2(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate standard monthly and daily interest for a given principal and rate
 */
function calculateBaseInterest(principal, rate, rateType = 'monthly_pct') {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;

  let monthlyInterest = 0;
  let dailyInterest = 0;
  let effectiveAnnualRate = 0;

  if (rateType === 'monthly_pct') {
    // e.g. 2% per month = Rs 2 per Rs 100
    monthlyInterest = (p * r) / 100;
    dailyInterest = monthlyInterest / 30; // 30-day standard financier convention
    effectiveAnnualRate = r * 12;
  } else {
    // Annual % e.g. 18% p.a.
    monthlyInterest = (p * r) / (12 * 100);
    dailyInterest = (p * r) / (365 * 100);
    effectiveAnnualRate = r;
  }

  return {
    principal: round2(p),
    rate: round2(r),
    rateType,
    monthlyInterest: round2(monthlyInterest),
    dailyInterest: round2(dailyInterest),
    effectiveAnnualRate: round2(effectiveAnnualRate)
  };
}

/**
 * Calculates interest accrued between two dates (startDate and endDate)
 */
function calculatePeriodInterest(principal, rate, rateType = 'monthly_pct', startDateStr, endDateStr) {
  const base = calculateBaseInterest(principal, rate, rateType);
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Difference in milliseconds
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate full months and remaining broken days
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  let tempDate = new Date(start);
  tempDate.setMonth(tempDate.getMonth() + months);

  if (tempDate > end) {
    months--;
    tempDate = new Date(start);
    tempDate.setMonth(tempDate.getMonth() + months);
  }

  const remainingDays = Math.max(0, Math.floor((end.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Accrued interest based on full months + remaining days
  const accruedByMonthAndDays = round2((months * base.monthlyInterest) + (remainingDays * base.dailyInterest));
  
  // Accrued interest purely by daily rate
  const accruedByPureDays = round2(totalDays * base.dailyInterest);

  return {
    ...base,
    startDate: startDateStr,
    endDate: endDateStr,
    totalDays,
    monthsElapsed: months,
    remainingDays,
    accruedInterest: accruedByMonthAndDays,
    accruedByPureDays,
    totalPayoffAmount: round2(base.principal + accruedByMonthAndDays)
  };
}

/**
 * Calculate loan live status including payments made, interest pending, and closing balance
 */
function computeLoanLedger(loan, payments = []) {
  const principal = parseFloat(loan.current_principal);
  const originalPrincipal = parseFloat(loan.principal_amount);
  const rate = parseFloat(loan.interest_rate);
  const rateType = loan.rate_type;
  const base = calculateBaseInterest(principal, rate, rateType);

  // Sum payments
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  payments.forEach(p => {
    if (p.payment_type === 'INTEREST') {
      totalInterestPaid += parseFloat(p.amount) || 0;
    } else if (p.payment_type === 'PRINCIPAL') {
      totalPrincipalPaid += parseFloat(p.amount) || 0;
    } else if (p.payment_type === 'SETTLEMENT') {
      totalPrincipalPaid += parseFloat(p.principal_component) || 0;
      totalInterestPaid += parseFloat(p.interest_component) || 0;
    }
  });

  // Calculate days elapsed from disbursement_date to today
  const today = new Date().toISOString().split('T')[0];
  const periodCalc = calculatePeriodInterest(principal, rate, rateType, loan.disbursement_date, today);

  // Total interest expected since disbursement
  // If upfront interest was deducted, treat month 1 interest as already paid
  let adjustedInterestPaid = totalInterestPaid;
  if (loan.upfront_interest_deducted) {
    adjustedInterestPaid += (parseFloat(loan.upfront_interest_amount) || base.monthlyInterest);
  }

  const interestDue = Math.max(0, round2(periodCalc.accruedInterest - adjustedInterestPaid));
  const totalSettlementAmount = round2(principal + interestDue);

  // Calculate how many full months of interest have been paid
  const monthsPaid = base.monthlyInterest > 0 ? Math.floor(adjustedInterestPaid / base.monthlyInterest) : 0;

  // Next due date calculation based on disbursement date, monthly due day, and months paid
  const nextDueDate = calculateNextDueDate(loan.disbursement_date, loan.due_day, monthsPaid);
  const daysUntilDue = getDaysUntil(nextDueDate);

  return {
    loanId: loan.id,
    borrowerId: loan.borrower_id,
    originalPrincipal: round2(originalPrincipal),
    currentPrincipal: round2(principal),
    interestRate: rate,
    rateType,
    monthlyInterest: base.monthlyInterest,
    dailyInterest: base.dailyInterest,
    effectiveAnnualRate: base.effectiveAnnualRate,
    disbursementDate: loan.disbursement_date,
    dueDay: loan.due_day,
    nextDueDate,
    daysUntilDue, // e.g. 1 means due tomorrow, 0 means due today, negative means overdue
    isDueTomorrow: daysUntilDue === 1,
    isDueToday: daysUntilDue === 0,
    isOverdue: daysUntilDue < 0,
    totalDaysElapsed: periodCalc.totalDays,
    totalInterestAccruedToDate: periodCalc.accruedInterest,
    totalInterestPaid: round2(adjustedInterestPaid),
    totalPrincipalPaid: round2(totalPrincipalPaid),
    interestDue,
    totalSettlementAmount,
    status: loan.status
  };
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Determine next due date given disbursement date, due_day of month, and months already paid
 */
function calculateNextDueDate(disbursementDateStr, dueDay, monthsPaid = 0) {
  let year, month, disbDay;
  if (typeof disbursementDateStr === 'string' && disbursementDateStr.includes('-')) {
    const parts = disbursementDateStr.split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1; // 0-indexed
    disbDay = parts[2];
  } else {
    const disb = new Date(disbursementDateStr);
    year = disb.getFullYear();
    month = disb.getMonth();
    disbDay = disb.getDate();
  }

  // First monthly cycle due date: strictly after disbursement (or next month if dueDay <= disbDay)
  if (dueDay <= disbDay) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // Advance by number of full months paid
  month += monthsPaid;
  while (month > 11) {
    month -= 12;
    year++;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(dueDay, daysInMonth);
  const mStr = String(month + 1).padStart(2, '0');
  const dStr = String(safeDay).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

function getNextDueDate(dueDay) {
  const todayStr = formatDateLocal(new Date());
  return calculateNextDueDate(todayStr, dueDay, 0);
}

/**
 * Returns difference in days between today and target date
 */
function getDaysUntil(targetDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  calculateBaseInterest,
  calculatePeriodInterest,
  computeLoanLedger,
  getNextDueDate,
  getDaysUntil,
  round2
};

// ... جميع التعريفات نفسها ...

function getBalloonFinalPayment(loanAmount) {
  const balloonType = balloonTypeSelect.value;
  const balloonValue = +balloonValueInput.value;
  if (balloonType === 'percent') {
    return loanAmount * (balloonValue / 100);
  }
  return balloonValue;
}

// الدالة التالية تصحح طريقة الحساب في حالة balloon مع فترة سماح:
function loanDebtSchedule(amount, annualRate, years, type, totalYears, balloonFinalPayment, graceYears) {
  let debtPayments = Array(totalYears).fill(0);
  let interestPayments = Array(totalYears).fill(0);
  let principalPayments = Array(totalYears).fill(0);
  if (type === 'equalInstallments') {
    let r = annualRate / 100;
    let n = years;
    let pmt = (r === 0) ? amount / n : amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    for (let i = 0; i < totalYears; i++) {
      if (i < graceYears) {
        debtPayments[i] = 0;
        interestPayments[i] = 0;
        principalPayments[i] = 0;
      } else if (i < years) {
        // حساب الرصيد المتبقي
        let prevBalance = amount;
        for (let j = graceYears; j < i; j++) {
          let intP = prevBalance * r;
          let princP = pmt - intP;
          prevBalance -= princP;
        }
        let interest = prevBalance * r;
        let principal = pmt - interest;
        debtPayments[i] = pmt;
        interestPayments[i] = interest;
        principalPayments[i] = principal;
      }
    }
  } else if (type === 'balloon') {
    // القسط السنوي = (المبلغ الأصلي - الدفعة الأخيرة) / عدد سنوات السداد بعد السماح
    let n = years - graceYears;
    if (n < 1) n = 1;
    let balloon = balloonFinalPayment;
    let principalToAmortize = amount - balloon;
    let yearlyPrincipal = (n > 1) ? principalToAmortize / n : principalToAmortize;

    let balance = amount;
    for (let i = 0; i < totalYears; i++) {
      if (i < graceYears) {
        debtPayments[i] = 0;
        interestPayments[i] = 0;
        principalPayments[i] = 0;
      } else if (i < years - 1) {
        let interest = balance * (annualRate / 100);
        debtPayments[i] = yearlyPrincipal + interest;
        interestPayments[i] = interest;
        principalPayments[i] = yearlyPrincipal;
        balance -= yearlyPrincipal;
      } else if (i === years - 1) {
        // السنة الأخيرة: الدفعة الأخيرة + آخر قسط رئيسي + الفائدة
        let interest = balance * (annualRate / 100);
        debtPayments[i] = yearlyPrincipal + balloon + interest;
        interestPayments[i] = interest;
        principalPayments[i] = yearlyPrincipal + balloon;
        balance = 0;
      }
    }
  }
  // الدالة تُعيد فقط مجمل السداد السنوي، لكن يمكن تعديلها للإرجاع التفصيلي إذا أردت (interestPayments, principalPayments)
  return debtPayments;
}

function loanAnnualPayment(amount, annualRate, years, type, balloonFinalPayment = 0, graceYears = 0) {
  if (type === 'equalInstallments') {
    if (annualRate === 0) return amount / years;
    const r = annualRate / 100;
    const n = years;
    return amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  } else if (type === 'balloon') {
    let n = years - graceYears;
    if (n < 1) n = 1;
    let balloon = balloonFinalPayment;
    let principalToAmortize = amount - balloon;
    return (n > 1) ? principalToAmortize / n : principalToAmortize;
  }
  return 0;
}

// ... في دالة financials استدعي loanDebtSchedule بنفس الطريقة مع المتغيرات الجديدة ...

// مثال الاستدعاء الصحيح:
const balloonFinalPayment = loanType === 'balloon' ? getBalloonFinalPayment(loanAmount) : 0;
const annualDebtService = loanAnnualPayment(loanAmount, interestRate, loanYears, loanType, balloonFinalPayment, loanGrace);
const debtSchedule = loanDebtSchedule(loanAmount, interestRate, loanYears, loanType, years, balloonFinalPayment, loanGrace);

// ... بقية الكود كما هو ...

// تأكد من ربط الأحداث:
loanTypeSelect.addEventListener('change', () => {
  updateBalloonVisibility();
  updateSliderAndResults();
});
balloonValueInput.addEventListener('input', updateSliderAndResults);
balloonTypeSelect.addEventListener('change', updateSliderAndResults);
loanGraceInput.addEventListener('input', updateSliderAndResults);

// ... بقية الكود كما هو ...

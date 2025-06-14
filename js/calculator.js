document.addEventListener('DOMContentLoaded', function() {
  // ... [نفس المتغيرات السابقة]
  const capModeRadios = document.getElementsByName('capCostMode');
  const capDetailsDiv = document.getElementById('cap-details');
  const capDirectDiv = document.getElementById('cap-direct');
  const directCapCostInput = document.getElementById('directCapCost');

  // خيارات القرض balloon
  const loanTypeSelect = document.getElementById('loanType');
  const balloonOptionsDiv = document.getElementById('balloon-options');
  const balloonValueInput = document.getElementById('balloonValue');
  const balloonTypeSelect = document.getElementById('balloonType');
  const loanGraceInput = document.getElementById('loanGrace');

  function getCurrentCapMode() {
    let mode = 'detailed';
    capModeRadios.forEach(r => { if (r.checked) mode = r.value; });
    return mode;
  }
  function updateCapVisibility() {
    const mode = getCurrentCapMode();
    capDetailsDiv.classList.toggle('hidden', mode !== 'detailed');
    capDirectDiv.classList.toggle('hidden', mode !== 'direct');
  }
  function updateBalloonVisibility() {
    balloonOptionsDiv.classList.toggle('hidden', loanTypeSelect.value !== 'balloon');
  }
  loanTypeSelect.addEventListener('change', () => {
    updateBalloonVisibility();
    updateSliderAndResults();
  });
  capModeRadios.forEach(r => r.addEventListener('change', () => {
    updateCapVisibility();
    updateSliderAndResults();
  }));

  // ... [دوال المساعدة كما في الكود السابق]

  function getBalloonFinalPayment(loanAmount) {
    const balloonType = balloonTypeSelect.value;
    const balloonValue = +balloonValueInput.value;
    if (balloonType === 'percent') {
      return loanAmount * (balloonValue / 100);
    }
    return balloonValue;
  }

  function loanDebtSchedule(amount, annualRate, years, type, totalYears, balloonFinalPayment, graceYears) {
    let debtPayments = Array(totalYears).fill(0);
    let mainYears = years - graceYears;
    if (mainYears < 1) mainYears = 1;
    if (type === 'equalInstallments') {
      let pmt = loanAnnualPayment(amount, annualRate, years, type);
      for (let i = 0; i < totalYears; i++) {
        if (i < graceYears) {
          debtPayments[i] = 0;
        } else if (i < years) {
          debtPayments[i] = pmt;
        }
      }
    } else if (type === 'balloon') {
      let balloon = balloonFinalPayment;
      let principalToAmortize = amount - balloon;
      let r = annualRate / 100;
      let n = mainYears;
      let pmt = n > 0 ? (principalToAmortize * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
      for (let i = 0; i < totalYears; i++) {
        if (i < graceYears) {
          debtPayments[i] = 0;
        } else if (i < years - 1) {
          debtPayments[i] = pmt;
        } else if (i === years - 1) {
          debtPayments[i] = pmt + balloon;
        }
      }
    }
    return debtPayments;
  }
  function loanAnnualPayment(amount, annualRate, years, type, balloonFinalPayment = 0, graceYears = 0) {
    let mainYears = years - graceYears;
    if (mainYears < 1) mainYears = 1;
    if (type === 'equalInstallments') {
      if (annualRate === 0) return amount / years;
      const r = annualRate / 100;
      const n = years;
      const pmt = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return pmt;
    } else if (type === 'balloon') {
      let balloon = balloonFinalPayment;
      let principalToAmortize = amount - balloon;
      let r = annualRate / 100;
      let n = mainYears;
      if (n <= 0) n = 1;
      let pmt = n > 0 ? (principalToAmortize * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
      return pmt;
    }
    return 0;
  }

  // ... [دالة financials, updateResults, updateSliderAndResults, إلخ كما في الكود السابق مع تحديث القرض ليعمل مع balloon/grace]

  // الربط مع جميع المدخلات
  inputs.forEach(i => i.addEventListener('input', updateSliderAndResults));
  maxRentSlider.addEventListener('input', updateUIFromSlider);
  directCapCostInput.addEventListener('input', updateSliderAndResults);
  balloonValueInput.addEventListener('input', updateSliderAndResults);
  balloonTypeSelect.addEventListener('change', updateSliderAndResults);
  loanGraceInput.addEventListener('input', updateSliderAndResults);

  updateCapVisibility();
  updateBalloonVisibility();
  updateSliderAndResults();

  // ... [زر التصدير PDF كما هو]
});

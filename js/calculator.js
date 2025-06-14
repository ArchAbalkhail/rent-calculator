document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('calc-form');
  const inputs = form.querySelectorAll('input,select');
  const buildingAreasSpan = document.getElementById('buildingAreas');
  const siteAreaSpan = document.getElementById('siteArea');
  const constructionCostSpan = document.getElementById('constructionCost');
  const totalCapCostSpan = document.getElementById('totalCapCost');
  const totalDevCostSpan = document.getElementById('totalDevCost');
  const totalContractRentSpan = document.getElementById('totalContractRent');
  const avgAnnualRentSpan = document.getElementById('avgAnnualRent');
  const avgYearIncomeSpan = document.getElementById('avgYearIncome');
  const avgNetIncomeSpan = document.getElementById('avgNetIncome');
  const totalCashflowSpan = document.getElementById('totalCashflow');
  const npvResultSpan = document.getElementById('npvResult');
  const irrResultSpan = document.getElementById('irrResult');
  const breakEvenPointSpan = document.getElementById('breakEvenPoint');
  const maxRentSlider = document.getElementById('maxRentSlider');
  const sliderRentVal = document.getElementById('sliderRentVal');
  const cashflowTableDiv = document.getElementById('cashflowTable');
  // عناصر التمويل
  const loanAmountSpan = document.getElementById('loanAmount');
  const annualDebtServiceSpan = document.getElementById('annualDebtService');
  const netCashflowAfterDebtSpan = document.getElementById('netCashflowAfterDebt');
  const npvAfterDebtSpan = document.getElementById('npvAfterDebt');
  const irrAfterDebtSpan = document.getElementById('irrAfterDebt');

  // وضع التكاليف الرأسمالية
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

  // إظهار/إخفاء حسب الوضع
  function updateCapVisibility() {
    const mode = getCurrentCapMode();
    if (mode === 'detailed') {
      capDetailsDiv.classList.remove('hidden');
      capDirectDiv.classList.add('hidden');
    } else {
      capDetailsDiv.classList.add('hidden');
      capDirectDiv.classList.remove('hidden');
    }
  }

  // إظهار خيارات balloon حسب نوع القرض
  function updateBalloonVisibility() {
    if (loanTypeSelect.value === 'balloon') {
      balloonOptionsDiv.classList.remove('hidden');
    } else {
      balloonOptionsDiv.classList.add('hidden');
    }
  }
  loanTypeSelect.addEventListener('change', () => {
    updateBalloonVisibility();
    updateSliderAndResults();
  });

  capModeRadios.forEach(r => r.addEventListener('change', () => {
    updateCapVisibility();
    updateSliderAndResults();
  }));

  function numberFormat(n) {
    return Number(n).toLocaleString('ar-EG', {maximumFractionDigits: 0});
  }
  function getFreePeriodInYears() {
    const years = +document.getElementById('years').value;
    const value = +document.getElementById('freePeriodValue').value;
    const unit = document.getElementById('freePeriodUnit').value;
    if (unit === 'years') return value;
    if (unit === 'months') return value / 12;
    if (unit === 'days') return value / 365;
    if (unit === 'percent') return (value / 100) * years;
    return value;
  }

  function getBalloonFinalPayment(loanAmount) {
    const balloonType = balloonTypeSelect.value;
    const balloonValue = +balloonValueInput.value;
    if (balloonType === 'percent') {
      return loanAmount * (balloonValue / 100);
    }
    return balloonValue;
  }

  // graceYears: فترة السماح قبل بدء السداد
  function loanDebtSchedule(amount, annualRate, years, type, totalYears, balloonFinalPayment, graceYears) {
    let debtPayments = Array(totalYears).fill(0);
    // فترة السماح: لا يوجد سداد في أول graceYears سنة (فقط الفوائد المستحقة)
    let mainYears = years - graceYears;
    if (mainYears < 1) mainYears = 1; // على الأقل سنة واحدة للسداد

    if (type === 'equalInstallments') {
      // خلال فترة السماح: لا دفع أقساط، فقط الفائدة (اختياري: يمكن تعديلها لاحقاً)
      let pmt = loanAnnualPayment(amount, annualRate, years, type);
      for (let i = 0; i < totalYears; i++) {
        if (i < graceYears) {
          // لا دفع قسط، فقط الفائدة (أو لا شيء حسب السياسة)
          debtPayments[i] = 0;
        } else if (i < years) {
          debtPayments[i] = pmt;
        }
      }
    } else if (type === 'balloon') {
      // دفعات متساوية ثم دفعة أخيرة كبيرة
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
      // الجزء الذي سيتم تسديده بأقساط
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

  function financials(annualRentBase) {
    const years = +document.getElementById('years').value;
    const freePeriod = getFreePeriodInYears();
    const rentIncreasePercent = +document.getElementById('rentIncreasePercent').value / 100;
    const increaseCycle = +document.getElementById('increaseCycle').value;

    // التكاليف التفصيلية
    const landArea = +document.getElementById('landArea').value;
    const buildRatio = +document.getElementById('buildRatio').value;
    const buildPercent = +document.getElementById('buildPercent').value / 100;
    const buildCost = +document.getElementById('buildCost').value;
    const siteCost = +document.getElementById('siteCost').value;
    const basementCost = +document.getElementById('basementCost').value;
    const engSupervision = +document.getElementById('engSupervisionPercent').value / 100;
    const indirectCost = +document.getElementById('indirectCostPercent').value / 100;
    const riskPercent = +document.getElementById('riskPercent').value / 100;
    const projectDuration = +document.getElementById('projectDuration').value;

    // التكاليف المباشرة (إدخال يدوي)
    const directCapCost = +document.getElementById('directCapCost').value;

    // اختيار الوضع
    const capMode = getCurrentCapMode();
    const buildingAreas = landArea * buildRatio;
    const siteArea = landArea - (landArea * buildPercent);
    const constructionCost =
      (buildingAreas * buildCost) +
      (siteArea * siteCost) +
      (landArea * basementCost);
    const detailedCap =
      constructionCost * (1 + engSupervision + indirectCost + riskPercent);
    const totalCapCost = capMode === 'detailed' ? detailedCap : directCapCost;
    const devCostPerYear = projectDuration > 0 ? totalCapCost / projectDuration : totalCapCost;

    // دخل المشروع
    const totalIncome = +document.getElementById('totalIncome').value;
    const incomeGrowthPercent = +document.getElementById('incomeGrowthPercent').value / 100;
    const netIncomePercent = +document.getElementById('netIncomePercent').value / 100;
    const incomeStartYears = +document.getElementById('incomeStartYears').value;
    const targetGrowthPercent = +document.getElementById('targetGrowthPercent').value / 100;
    const startIncomePercent = +document.getElementById('startIncomePercent').value / 100;

    const discountRate = +document.getElementById('discountRate').value / 100;
    // القرض
    const loanToValue = +document.getElementById('loanToValue').value / 100;
    const loanYears = +document.getElementById('loanYears').value;
    const interestRate = +document.getElementById('interestRate').value;
    const loanType = loanTypeSelect.value;
    const balloonFinalPayment = loanType === 'balloon' ? getBalloonFinalPayment(totalCapCost * loanToValue) : 0;
    const loanGrace = +loanGraceInput.value;

    // حساب القرض
    const loanAmount = totalCapCost * loanToValue;
    const equityAmount = totalCapCost - loanAmount;
    const annualDebtService = loanAnnualPayment(loanAmount, interestRate, loanYears, loanType, balloonFinalPayment, loanGrace);
    const debtSchedule = loanDebtSchedule(loanAmount, interestRate, loanYears, loanType, years, balloonFinalPayment, loanGrace);

    let rows = [];
    let reachedFullIncome = false;
    const fullFreeYears = Math.floor(freePeriod);
    const fractionalFree = freePeriod - fullFreeYears;
    let firstIncomeYear = Math.max(fullFreeYears, incomeStartYears) + 1;
    let yearIncome = 0;
    let cumulativeCashflow = 0;
    let cumulativeCashflowAfterDebt = 0;

    let annualRent = 0;
    let rentYearBase = annualRentBase;
    let rentIncreaseCounter = 0;

    let npv = 0, npvAfterDebt = 0;

    let sumYearIncome = 0, sumNetIncome = 0, sumAnnualRent = 0, sumDevCost = 0, sumCashflow = 0, sumCashflowAfterDebt = 0;
    let cashflows = [];
    let cashflowsAfterDebt = [];
    let totalContractRent = 0;
    let breakEvenYear = null;
    let breakEvenMonth = null;
    let breakEvenDay = null;
    let breakEvenIdx = null;

    for (let i = 1; i <= years; i++) {
      // الدخل السنوي
      if (i < firstIncomeYear) {
        yearIncome = 0;
      } else if (i === firstIncomeYear) {
        yearIncome = totalIncome * startIncomePercent;
      } else if (!reachedFullIncome) {
        yearIncome = yearIncome * (1 + targetGrowthPercent);
        if (yearIncome >= totalIncome) {
          yearIncome = totalIncome;
          reachedFullIncome = true;
        }
      } else {
        yearIncome = yearIncome * (1 + incomeGrowthPercent);
      }

      // الأجرة السنوية مع السماح
      if (i <= fullFreeYears) {
        annualRent = 0;
      } else if (i === fullFreeYears + 1 && fractionalFree > 0) {
        annualRent = rentYearBase * (1 - fractionalFree);
      } else {
        annualRent = rentYearBase;
      }
      if (i > fullFreeYears + 1) {
        rentIncreaseCounter++;
        if (increaseCycle > 0 && rentIncreaseCounter % increaseCycle === 0) {
          rentYearBase *= (1 + rentIncreasePercent);
        }
      }

      let netIncome = yearIncome * netIncomePercent;
      let devCostThisYear = (i <= projectDuration) ? devCostPerYear : 0;
      let debtPayment = debtSchedule[i - 1] || 0;
      let cashflow = netIncome - annualRent - devCostThisYear;
      let cashflowAfterDebt = cashflow - debtPayment;

      cumulativeCashflow += cashflow;
      cumulativeCashflowAfterDebt += cashflowAfterDebt;
      npv += cashflow / Math.pow(1 + discountRate, i);
      npvAfterDebt += cashflowAfterDebt / Math.pow(1 + discountRate, i);

      sumYearIncome += yearIncome;
      sumNetIncome += netIncome;
      sumAnnualRent += annualRent;
      sumDevCost += devCostThisYear;
      sumCashflow += cashflow;
      sumCashflowAfterDebt += cashflowAfterDebt;
      totalContractRent += annualRent;

      cashflows.push(cashflow);
      cashflowsAfterDebt.push(cashflowAfterDebt);

      // نقطة التعادل
      if (breakEvenIdx == null && cumulativeCashflow >= -1 && cumulativeCashflow <= 1) {
        breakEvenIdx = i;
      } else if (breakEvenIdx == null && cumulativeCashflow > 0 && rows.length > 0 && rows[rows.length-1].cumulativeCashflow < 0) {
        let prevCum = rows[rows.length-1].cumulativeCashflow;
        let prevYear = i-1;
        let delta = cumulativeCashflow - prevCum;
        let frac = (-prevCum) / delta;
        let fullDays = frac * 365;
        breakEvenYear = prevYear + Math.floor(fullDays / 365);
        breakEvenMonth = Math.floor((fullDays % 365) / 30.4375);
        breakEvenDay = Math.round((fullDays % 365) % 30.4375);
        breakEvenIdx = i;
      }

      rows.push({
        year: i,
        yearIncome: yearIncome,
        netIncome: netIncome,
        annualRent: annualRent,
        devCostThisYear: devCostThisYear,
        debtPayment: debtPayment,
        cashflow: cashflow,
        cashflowAfterDebt: cashflowAfterDebt,
        cumulativeCashflow: cumulativeCashflow,
        cumulativeCashflowAfterDebt: cumulativeCashflowAfterDebt
      });
    }

    // نقطة التعادل
    let breakEvenText = '';
    if (breakEvenIdx != null && breakEvenYear != null) {
      breakEvenText = `${breakEvenYear} سنة و${breakEvenMonth} شهر و${breakEvenDay} يوم`;
    } else if (breakEvenIdx != null) {
      breakEvenText = `${breakEvenIdx} سنة`;
    } else {
      breakEvenText = 'لم تتحقق نقطة التعادل';
    }

    // إرجاع جميع النتائج المهمة
    return {
      buildingAreas,
      siteArea,
      constructionCost,
      totalDevCost: totalCapCost, // التكاليف الرأسمالية النهائية
      npv,
      npvAfterDebt,
      rows,
      cashflows,
      cashflowsAfterDebt,
      breakEvenText,
      loanAmount,
      annualDebtService,
      sumCashflowAfterDebt,
      totals: {
        sumYearIncome,
        sumNetIncome,
        sumAnnualRent,
        sumDevCost,
        sumCashflow,
        totalContractRent,
        avgAnnualRent: sumAnnualRent / years,
        avgYearIncome: sumYearIncome / years,
        avgNetIncome: sumNetIncome / years
      },
      totalCapCost // لإظهارها في الحقل العلوي
    };
  }

  function findMaxRentValue() {
    let lo = 0, hi = 1e8, best = 0;
    let tolerance = 1.0;
    for (let iter = 0; iter < 40; iter++) {
      let mid = (lo + hi) / 2;
      let npv = financials(mid).npv;
      if (Math.abs(npv) <= tolerance) {
        best = mid;
        break;
      }
      if (npv > 0) {
        lo = mid;
      } else {
        hi = mid;
      }
      best = mid;
    }
    return best;
  }

  function computeIRR(cashflows, initialInvestment) {
    let fullCashflows = [-initialInvestment, ...cashflows];
    let guess = 0.10;
    let maxIter = 1000;
    let tol = 1e-6;
    let irr = guess;
    for (let iter = 0; iter < maxIter; iter++) {
      let npv = 0;
      let d_npv = 0;
      for (let t = 0; t < fullCashflows.length; t++) {
        npv += fullCashflows[t] / Math.pow(1 + irr, t);
        if (t > 0) d_npv += - t * fullCashflows[t] / Math.pow(1 + irr, t + 1);
      }
      if (Math.abs(npv) < tol) return irr * 100;
      let new_irr = irr - npv / d_npv;
      if (Math.abs(new_irr - irr) < tol) return new_irr * 100;
      irr = new_irr;
      if (irr < -0.99) return null;
    }
    return null;
  }

  function updateUIFromSlider() {
    let rentVal = +maxRentSlider.value;
    sliderRentVal.textContent = numberFormat(rentVal);
    document.getElementById('annualRent').value = rentVal;
    updateResults(rentVal);
  }

  function updateResults(sliderRentValOverride = null) {
    let rentVal = sliderRentValOverride !== null
      ? sliderRentValOverride
      : +document.getElementById('annualRent').value;

    const results = financials(rentVal);

    // تحديث نتائج التكاليف داخل بطاقة التكاليف
    buildingAreasSpan.textContent = numberFormat(results.buildingAreas);
    siteAreaSpan.textContent = numberFormat(results.siteArea);
    constructionCostSpan.textContent = numberFormat(results.constructionCost);

    // إظهار إجمالي التكاليف الرأسمالية (الحقل العلوي)
    totalCapCostSpan.textContent = numberFormat(results.totalCapCost);

    // قائمة النتائج المختصرة
    totalDevCostSpan.textContent = numberFormat(results.totalDevCost);
    totalContractRentSpan.textContent = numberFormat(results.totals.totalContractRent);
    avgAnnualRentSpan.textContent = numberFormat(results.totals.avgAnnualRent);
    avgYearIncomeSpan.textContent = numberFormat(results.totals.avgYearIncome);
    avgNetIncomeSpan.textContent = numberFormat(results.totals.avgNetIncome);
    totalCashflowSpan.textContent = numberFormat(results.totals.sumCashflow);
    npvResultSpan.textContent = numberFormat(results.npv);
    let irr = computeIRR(results.cashflows, results.totalDevCost);
    irrResultSpan.textContent = (irr !== null && isFinite(irr)) ? irr.toFixed(2) : "غير متحقق";
    breakEvenPointSpan.textContent = results.breakEvenText;

    // نتائج التمويل
    loanAmountSpan.textContent = numberFormat(results.loanAmount);
    annualDebtServiceSpan.textContent = numberFormat(results.annualDebtService);
    netCashflowAfterDebtSpan.textContent = numberFormat(results.sumCashflowAfterDebt);
    npvAfterDebtSpan.textContent = numberFormat(results.npvAfterDebt);
    let irrAfterDebt = computeIRR(results.cashflowsAfterDebt, results.totalDevCost - results.loanAmount);
    irrAfterDebtSpan.textContent = (irrAfterDebt !== null && isFinite(irrAfterDebt)) ? irrAfterDebt.toFixed(2) : "غير متحقق";

    // جدول التدفقات
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>السنة</th>
            <th>الدخل السنوي (ريال)</th>
            <th>صافي الدخل (ريال)</th>
            <th>الأجرة السنوية (ريال)</th>
            <th>تكاليف التطوير السنوية (ريال)</th>
            <th>خدمة الدين (ريال)</th>
            <th>التدفق النقدي (ريال)</th>
            <th>التدفق بعد الدين (ريال)</th>
            <th>صافي التدفقات التراكمي (ريال)</th>
            <th>صافي التراكمي بعد الدين (ريال)</th>
          </tr>
        </thead>
        <tbody>
    `;
    results.rows.forEach(r => {
      tableHtml += `
        <tr>
          <td>${r.year}</td>
          <td>${numberFormat(r.yearIncome)}</td>
          <td>${numberFormat(r.netIncome)}</td>
          <td class="cashflow-negative">${r.annualRent > 0 ? '-' : ''}${numberFormat(r.annualRent)}</td>
          <td class="cashflow-negative">${r.devCostThisYear > 0 ? '-' : ''}${numberFormat(r.devCostThisYear)}</td>
          <td class="cashflow-negative">${r.debtPayment > 0 ? '-' : ''}${numberFormat(r.debtPayment)}</td>
          <td class="${r.cashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cashflow)}</td>
          <td class="${r.cashflowAfterDebt < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cashflowAfterDebt)}</td>
          <td class="${r.cumulativeCashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cumulativeCashflow)}</td>
          <td class="${r.cumulativeCashflowAfterDebt < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cumulativeCashflowAfterDebt)}</td>
        </tr>
      `;
    });
    tableHtml += `</tbody>
      <tfoot>
        <tr>
          <td>الإجمالي</td>
          <td>${numberFormat(results.totals.sumYearIncome)}</td>
          <td>${numberFormat(results.totals.sumNetIncome)}</td>
          <td class="cashflow-negative">${results.totals.sumAnnualRent > 0 ? '-' : ''}${numberFormat(results.totals.sumAnnualRent)}</td>
          <td class="cashflow-negative">${results.totals.sumDevCost > 0 ? '-' : ''}${numberFormat(results.totals.sumDevCost)}</td>
          <td></td>
          <td class="${results.totals.sumCashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(results.totals.sumCashflow)}</td>
          <td class="${results.sumCashflowAfterDebt < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(results.sumCashflowAfterDebt)}</td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>
    </table>`;
    cashflowTableDiv.innerHTML = tableHtml;
  }

  function updateSliderAndResults() {
    const maxRent = findMaxRentValue();
    maxRentSlider.max = Math.ceil(maxRent / 100) * 100;
    if (+maxRentSlider.value > +maxRentSlider.max) maxRentSlider.value = maxRentSlider.max;
    maxRentSlider.min = 0;
    if (+document.getElementById('annualRent').value !== +maxRentSlider.value) {
      maxRentSlider.value = document.getElementById('annualRent').value;
    }
    sliderRentVal.textContent = numberFormat(maxRentSlider.value);
    updateResults(+maxRentSlider.value);
  }

  // تحديث العرض عند إدخال أي قيمة
  inputs.forEach(i => i.addEventListener('input', updateSliderAndResults));
  maxRentSlider.addEventListener('input', updateUIFromSlider);
  directCapCostInput.addEventListener('input', updateSliderAndResults);
  balloonValueInput.addEventListener('input', updateSliderAndResults);
  balloonTypeSelect.addEventListener('change', updateSliderAndResults);
  loanGraceInput.addEventListener('input', updateSliderAndResults);

  updateCapVisibility();
  updateBalloonVisibility();
  updateSliderAndResults();

  document.getElementById('exportPDF').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const scale = 2;
    const reportSections = [
      document.getElementById('results'),
      document.getElementById('cashflow-section')
    ];
    let y = 10;
    let addSectionToPDF = (section, done) => {
      html2canvas(section, {scale: scale, useCORS:true}).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const pageHeight = doc.internal.pageSize.getHeight() - 20;
        const imgProps = doc.getImageProperties(imgData);
        let pdfWidth = pageWidth;
        let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        if(pdfHeight > pageHeight) {
          pdfHeight = pageHeight;
          pdfWidth = (imgProps.width * pdfHeight) / imgProps.height;
        }
        if (y + pdfHeight > doc.internal.pageSize.getHeight() - 10) {
          doc.addPage();
          y = 10;
        }
        doc.addImage(imgData, 'PNG', 10, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;
        done();
      });
    };

    let i = 0;
    function next() {
      if (i < reportSections.length) {
        addSectionToPDF(reportSections[i++], next);
      } else {
        doc.save('تقرير_تحليل_العقار.pdf');
      }
    }
    next();
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('calc-form');
  const inputs = form.querySelectorAll('input,select');
  // تكاليف رأسمالية
  const buildingAreasSpan = document.getElementById('buildingAreas');
  const siteAreaSpan = document.getElementById('siteArea');
  const constructionCostSpan = document.getElementById('constructionCost');
  // النتائج
  const totalDevCostSpan = document.getElementById('totalDevCost');
  const totalContractRentSpan = document.getElementById('totalContractRent');
  const avgAnnualRentSpan = document.getElementById('avgAnnualRent');
  const avgYearIncomeSpan = document.getElementById('avgYearIncome');
  const avgNetIncomeSpan = document.getElementById('avgNetIncome');
  const totalCashflowSpan = document.getElementById('totalCashflow');
  const npvResultSpan = document.getElementById('npvResult');
  const irrResultSpan = document.getElementById('irrResult');
  const breakEvenPointSpan = document.getElementById('breakEvenPoint');
  // سلايدر
  const maxRentSlider = document.getElementById('maxRentSlider');
  const sliderRentVal = document.getElementById('sliderRentVal');
  // جدول التدفقات
  const cashflowTableDiv = document.getElementById('cashflowTable');

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

  function financials(annualRentBase) {
    const years = +document.getElementById('years').value;
    const freePeriod = getFreePeriodInYears();
    const rentIncreasePercent = +document.getElementById('rentIncreasePercent').value / 100;
    const increaseCycle = +document.getElementById('increaseCycle').value;

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

    const totalIncome = +document.getElementById('totalIncome').value;
    const incomeGrowthPercent = +document.getElementById('incomeGrowthPercent').value / 100;
    const netIncomePercent = +document.getElementById('netIncomePercent').value / 100;
    const incomeStartYears = +document.getElementById('incomeStartYears').value;
    const targetGrowthPercent = +document.getElementById('targetGrowthPercent').value / 100;
    const startIncomePercent = +document.getElementById('startIncomePercent').value / 100;

    const discountRate = +document.getElementById('discountRate').value / 100;

    const buildingAreas = landArea * buildRatio;
    const siteArea = landArea - (landArea * buildPercent);
    const constructionCost =
      (buildingAreas * buildCost) +
      (siteArea * siteCost) +
      (landArea * basementCost);
    const totalDevCost = constructionCost * (
      1 + engSupervision + indirectCost + riskPercent
    );
    const devCostPerYear = projectDuration > 0 ? totalDevCost / projectDuration : totalDevCost;

    let rows = [];
    let reachedFullIncome = false;
    const fullFreeYears = Math.floor(freePeriod);
    const fractionalFree = freePeriod - fullFreeYears;
    let firstIncomeYear = Math.max(fullFreeYears, incomeStartYears) + 1;
    let yearIncome = 0;
    let cumulativeCashflow = 0;

    let annualRent = 0;
    let rentYearBase = annualRentBase;
    let rentIncreaseCounter = 0;

    let npv = 0;

    let sumYearIncome = 0, sumNetIncome = 0, sumAnnualRent = 0, sumDevCost = 0, sumCashflow = 0;
    let cashflows = [];
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
      let cashflow = netIncome - annualRent - devCostThisYear;
      cumulativeCashflow += cashflow;
      npv += cashflow / Math.pow(1 + discountRate, i);

      sumYearIncome += yearIncome;
      sumNetIncome += netIncome;
      sumAnnualRent += annualRent;
      sumDevCost += devCostThisYear;
      sumCashflow += cashflow;
      totalContractRent += annualRent;

      cashflows.push(cashflow);

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
        cashflow: cashflow,
        cumulativeCashflow: cumulativeCashflow
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

    return {
      buildingAreas,
      siteArea,
      constructionCost,
      totalDevCost,
      npv,
      rows,
      cashflows,
      breakEvenText,
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
      }
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

  function computeIRR(cashflows, totalDevCost) {
    let fullCashflows = [-totalDevCost, ...cashflows];
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

    // قائمة النتائج المختصرة فقط
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
            <th>التدفق النقدي (ريال)</th>
            <th>صافي التدفقات التراكمي (ريال)</th>
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
          <td class="${r.cashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cashflow)}</td>
          <td class="${r.cumulativeCashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(r.cumulativeCashflow)}</td>
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
          <td class="${results.totals.sumCashflow < 0 ? 'cashflow-negative' : 'cashflow-positive'}">${numberFormat(results.totals.sumCashflow)}</td>
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

  inputs.forEach(i => i.addEventListener('input', updateSliderAndResults));
  maxRentSlider.addEventListener('input', updateUIFromSlider);

  // تحديث النتائج عند تحميل الصفحة
  updateSliderAndResults();

  // زر التصدير PDF
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

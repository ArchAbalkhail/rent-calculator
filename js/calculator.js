document.addEventListener('DOMContentLoaded', function() {
  try {
    const form = document.getElementById('calc-form');
    if (!form) throw new Error('العنصر calc-form غير موجود');
    const inputs = form.querySelectorAll('input,select');
    const buildingAreasSpan = document.getElementById('buildingAreas');
    const siteAreaSpan = document.getElementById('siteArea');
    const constructionCostSpan = document.getElementById('constructionCost');
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

    function numberFormat(n) {
      return Number(n).toLocaleString('ar-EG', {maximumFractionDigits: 0});
    }

    // ... (ضع هنا جميع الدوال كما في الكود السابق: getFreePeriodInYears, financials, findMaxRentValue, computeIRR, updateUIFromSlider, updateResults, updateSliderAndResults) ...

    // نسخة مختصرة لاستدعاء الدوال السابقة
    // انسخ جميع دوال الحسابات من الردود السابقة هنا دون تغيير

    inputs.forEach(i => i.addEventListener('input', updateSliderAndResults));
    maxRentSlider.addEventListener('input', updateUIFromSlider);

    // تنفيذ أولي عند تحميل الصفحة
    updateSliderAndResults();

  } catch (e) {
    alert('حدث خطأ برمجي: ' + e.message);
    console.error(e);
  }
});

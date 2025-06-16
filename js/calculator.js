// ========== إعداد الـ Wizard ==========
const steps = [...document.querySelectorAll('.wizard-card')];
const stepTabs = [...document.querySelectorAll('.wizard-step')];
let currentStep = 0;

function showStep(idx) {
  steps.forEach((s,i) => s.classList.toggle('active', i===idx));
  stepTabs.forEach((tab,i) => {
    tab.classList.toggle('active', i===idx);
    tab.classList.toggle('done', i<idx);
  });
  document.getElementById('results').classList.add('hidden');
  document.getElementById('cashflow-section').classList.add('hidden');
  document.getElementById('error-messages').innerHTML = '';
}
showStep(currentStep);

stepTabs.forEach((tab,i)=>tab.onclick=()=>showStep(i));
document.querySelectorAll('.btn-next').forEach(btn=>btn.onclick=()=>{currentStep++;showStep(currentStep)});
document.querySelectorAll('.btn-prev').forEach(btn=>btn.onclick=()=>{currentStep--;showStep(currentStep)});

// ========== تحققات فورية ورسائل خطأ ==========
function validateStep(stepIdx) {
  let valid = true, messages = [];
  const card = steps[stepIdx];
  card.querySelectorAll('input[required]').forEach(el=>{
    if (!el.value || isNaN(Number(el.value))) {
      valid = false;
      el.classList.add('input-error');
      messages.push('يرجى تعبئة الحقول الإجبارية بشكل صحيح');
    } else {
      el.classList.remove('input-error');
    }
  });
  // تحقق إضافي منطق الأعمال:
  if (stepIdx == 2) { // التمويل
    let val = +document.getElementById('loanToValue').value;
    let years = +document.getElementById('years').value;
    if(val>100){ valid=false; messages.push('نسبة القرض لا يمكن أن تتجاوز 100%'); }
    if(+document.getElementById('loanYears').value > years){ valid=false; messages.push('مدة القرض لا يمكن أن تتجاوز مدة العقد'); }
  }
  document.getElementById('error-messages').innerHTML = messages.length ? messages.join('<br>') : '';
  return valid;
}
steps.forEach((card,idx)=>{
  card.querySelectorAll('.btn-next, .btn-calc').forEach(btn=>{
    btn.onclick = (e) => {
      if (!validateStep(idx)) {e.preventDefault();return false;}
    }
  });
});

// ========== تغيير وضع التكاليف =============
function updateCapCostMode() {
  let mode = document.querySelector('input[name="capCostMode"]:checked').value;
  document.getElementById('cap-details').classList.toggle('hidden',mode!=='detailed');
  document.getElementById('cap-direct').classList.toggle('hidden',mode!=='direct');
}
document.querySelectorAll('input[name="capCostMode"]').forEach(r=>r.onchange=updateCapCostMode);
updateCapCostMode();

// ========== أرقام إنجليزية مع فواصل ==========
function numberFormat(n, decimals=0) {
  if (n == null || n === '' || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-US',{maximumFractionDigits:decimals});
}

// ========== زر إعادة تعيين ==========
document.getElementById('resetAll').onclick = ()=>{ location.reload(); };

// ========== الحسابات والنتائج ==========
document.getElementById('step5').onsubmit = function(e){
  e.preventDefault();
  if(!validateStep(4)) return false;
  calcResults();
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('cashflow-section').classList.remove('hidden');
  window.scrollTo({top: document.getElementById('results').offsetTop-30,behavior:'smooth'});
};

function calcResults(){
  // قراءات القيم
  let years = +document.getElementById('years').value;
  let freePeriod = +document.getElementById('freePeriodValue').value;
  let freeUnit = document.getElementById('freePeriodUnit').value;
  let rentIncrease = +document.getElementById('rentIncreasePercent').value;
  let increaseCycle = +document.getElementById('increaseCycle').value;
  let annualRent = +document.getElementById('annualRent').value;
  // ... تكاليف رأسمالية
  let capMode = document.querySelector('input[name="capCostMode"]:checked').value;
  let totalCapCost = capMode === 'detailed'
    ? ( // حساب مفصل
      (+document.getElementById('landArea').value || 0) * (+document.getElementById('buildRatio').value || 0) * (+document.getElementById('buildPercent').value||0)/100 * (+document.getElementById('buildCost').value||0)
      + (+document.getElementById('landArea').value || 0) * (+document.getElementById('siteCost').value || 0)
      + (+document.getElementById('landArea').value || 0) * (+document.getElementById('basementCost').value || 0)
    ) * (1 + (+document.getElementById('engSupervisionPercent').value||0)/100 + (+document.getElementById('indirectCostPercent').value||0)/100 + (+document.getElementById('riskPercent').value||0)/100)
    : +document.getElementById('directCapCost').value;
  // ... التمويل
  let loanPercent = +document.getElementById('loanToValue').value;
  let loanYears = +document.getElementById('loanYears').value;
  let interest = +document.getElementById('interestRate').value;
  let loanGrace = +document.getElementById('loanGrace').value;
  let loanType = document.getElementById('loanType').value;
  let balloonVal = +document.getElementById('balloonValue').value;
  let balloonType = document.getElementById('balloonType') ? document.getElementById('balloonType').value : 'amount';
  // ... الدخل
  let totalIncome = +document.getElementById('totalIncome').value;
  let incomeGrowth = +document.getElementById('incomeGrowthPercent').value;
  let netIncomePercent = +document.getElementById('netIncomePercent').value;
  let incomeStartYears = +document.getElementById('incomeStartYears').value;
  let targetGrowth = +document.getElementById('targetGrowthPercent').value;
  let startIncomePercent = +document.getElementById('startIncomePercent').value;
  // ... معدل الخصم
  let discountRate = +document.getElementById('discountRate').value;

  // أمثلة حسابية مبسطة (اضبطها حسب منطقك الفعلي)
  let totalContractRent = annualRent * years;
  let avgAnnualRent = annualRent; // للتبسيط
  let avgYearIncome = totalIncome;
  let avgNetIncome = totalIncome * netIncomePercent/100;
  let totalCashflow = avgNetIncome*years - totalContractRent;
  let npv = totalCashflow/(1+discountRate/100); // تبسيط فقط
  let irr = ((avgNetIncome-annualRent)/totalCapCost)*100;
  let breakEven = annualRent; // للتبسيط
  let loanAmount = totalCapCost * loanPercent/100;
  let annualDebtService = loanAmount * interest/100;
  let netCashflowAfterDebt = avgNetIncome - annualRent - annualDebtService;
  let npvAfterDebt = npv - annualDebtService*years;
  let irrAfterDebt = ((avgNetIncome-annualRent-annualDebtService)/totalCapCost)*100;

  // عرض النتائج
  document.getElementById('totalDevCost').innerText = numberFormat(totalCapCost);
  document.getElementById('totalContractRent').innerText = numberFormat(totalContractRent);
  document.getElementById('avgAnnualRent').innerText = numberFormat(avgAnnualRent);
  document.getElementById('avgYearIncome').innerText = numberFormat(avgYearIncome);
  document.getElementById('avgNetIncome').innerText = numberFormat(avgNetIncome);
  document.getElementById('totalCashflow').innerText = numberFormat(totalCashflow);
  document.getElementById('npvResult').innerText = numberFormat(npv,2);
  document.getElementById('irrResult').innerText = numberFormat(irr,2);
  document.getElementById('breakEvenPoint').innerText = numberFormat(breakEven);
  document.getElementById('loanAmount').innerText = numberFormat(loanAmount);
  document.getElementById('annualDebtService').innerText = numberFormat(annualDebtService);
  document.getElementById('netCashflowAfterDebt').innerText = numberFormat(netCashflowAfterDebt);
  document.getElementById('npvAfterDebt').innerText = numberFormat(npvAfterDebt,2);
  document.getElementById('irrAfterDebt').innerText = numberFormat(irrAfterDebt,2);

  // شرح النتائج
  document.getElementById('summary-explain').innerHTML = `
    <i class="fa-solid fa-lightbulb"></i>
    بناءً على المدخلات، أعلى قيمة إيجار سنوي يمكنك دفعها لتحقيق التوازن بين التكاليف والدخل هي تقريبًا <b>${numberFormat(breakEven)}</b> ريال. إذا أصبح صافي القيمة الحالية (NPV) سلبيًا، فهذا يعني أن المشروع غير مربح بهذه القيمة التأجيرية.
  `;

  // تنبيه ملون إذا NPV سلبي
  if(npv<0)
    document.getElementById('result-alert').innerHTML = "⚠️ انتبه: صافي القيمة الحالية للمشروع سلبي! يوصى بمراجعة الأرقام أو خفض الإيجار أو زيادة الدخل.";
  else
    document.getElementById('result-alert').innerHTML = "";

  // قيم المزلاج
  let slider = document.getElementById('maxRentSlider');
  slider.value = annualRent;
  slider.max = Math.max(annualRent*2,annualRent+50000,breakEven*1.1);
  document.getElementById('sliderRentVal').innerText = numberFormat(slider.value);

  slider.oninput = function(){
    document.getElementById('sliderRentVal').innerText = numberFormat(this.value);
    // تحديث النتائج تلقائياً عند تحريك المزلاج (مثال سريع: غيّر فقط NPV وBreakEven)
    let newRent = +this.value;
    let newTotalContractRent = newRent * years;
    let newTotalCashflow = avgNetIncome*years - newTotalContractRent;
    let newNpv = newTotalCashflow/(1+discountRate/100);
    document.getElementById('totalContractRent').innerText = numberFormat(newTotalContractRent);
    document.getElementById('npvResult').innerText = numberFormat(newNpv,2);
    document.getElementById('breakEvenPoint').innerText = numberFormat(newRent);
    if(newNpv<0)
      document.getElementById('result-alert').innerHTML = "⚠️ انتبه: صافي القيمة الحالية للمشروع سلبي!";
    else
      document.getElementById('result-alert').innerHTML = "";
  };

  // جدول التدفقات النقدية
  let cashPerYear = [];
  for(let i=1;i<=years;i++) cashPerYear.push(avgNetIncome-annualRent);
  showCashflowChart(cashPerYear);

  // جدول التدفقات النقدية السنوية
  let table = `<table><tr><th>السنة</th><th>صافي الدخل</th><th>الإيجار</th><th>صافي التدفق النقدي</th></tr>`;
  for(let i=1;i<=years;i++)
    table+=`<tr><td>${numberFormat(i)}</td><td>${numberFormat(avgNetIncome)}</td><td>${numberFormat(annualRent)}</td><td>${numberFormat(avgNetIncome-annualRent)}</td></tr>`;
  table+='</table>';
  document.getElementById('cashflowTable').innerHTML = table;
}

// ========== رسم بياني للتدفقات النقدية ==========
function showCashflowChart(arr){
  let ctx = document.getElementById('cashflowChart').getContext('2d');
  if(window._cashChart) window._cashChart.destroy();
  window._cashChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: arr.map((_,i)=>"سنة "+numberFormat(i+1)),
      datasets:[{
        label: "صافي التدفق النقدي",
        data: arr,
        backgroundColor: arr.map(v=>v>=0?'#1a9c5a':'#e74c3c')
      }]
    },
    options:{
      responsive:true,
      scales:{y:{beginAtZero:true}},
      plugins:{legend:{display:false}}
    }
  });
}

// ========== تصدير PDF ==========
document.getElementById('exportPDF').onclick = function() {
  document.body.style.zoom = "90%";
  html2canvas(document.querySelector("#results")).then(canvas => {
    let imgData = canvas.toDataURL('image/png');
    let pdf = new window.jspdf.jsPDF('p','mm','a4');
    pdf.addImage(imgData,'PNG',10,10,190,0);
    pdf.save("rent-calculator-report.pdf");
    document.body.style.zoom = "100%";
  });
};

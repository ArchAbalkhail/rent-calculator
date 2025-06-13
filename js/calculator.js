function calculate() {
    // جمع المدخلات
    const propertyValue = parseFloat(document.getElementById('propertyValue').value) || 0;
    const rentAmount = parseFloat(document.getElementById('rentAmount').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;
    const capRate = parseFloat(document.getElementById('capRate').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTerm = parseFloat(document.getElementById('loanTerm').value) || 0;

    // حساب صافي الدخل التشغيلي
    const noi = rentAmount - expenses;

    // حساب العائد على الاستثمار
    const roi = (noi / propertyValue) * 100;

    // حساب الدفعة الشهرية للقرض
    const monthlyInterestRate = (interestRate / 100) / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = loanAmount > 0 ? 
        (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) : 0;

    // حساب نسبة تغطية خدمة الدين
    const annualDebtService = monthlyPayment * 12;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

    // حساب التدفق النقدي قبل الضريبة
    const cashFlow = noi - annualDebtService;

    // عرض النتائج
    document.getElementById('noi').textContent = formatCurrency(noi);
    document.getElementById('roi').textContent = formatPercentage(roi);
    document.getElementById('dscr').textContent = formatNumber(dscr);
    document.getElementById('cashFlow').textContent = formatCurrency(cashFlow);
    
    // إظهار قسم النتائج
    document.getElementById('results').style.display = 'block';
}

function formatCurrency(number) {
    return new Intl.NumberFormat('ar-SA', { 
        style: 'currency', 
        currency: 'SAR',
        maximumFractionDigits: 0 
    }).format(number);
}

function formatPercentage(number) {
    return new Intl.NumberFormat('ar-SA', { 
        style: 'percent', 
        maximumFractionDigits: 2 
    }).format(number / 100);
}

function formatNumber(number) {
    return new Intl.NumberFormat('ar-SA', { 
        maximumFractionDigits: 2 
    }).format(number);
}

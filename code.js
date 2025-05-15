let bankAccounts = [], creditCards = [], transactions = [], incomeLog = [], budgets = {}, loanDetails = [];
let totalIncomeLogged = 0, totalExpenses = 0; // These remain global all-time totals
let expensesByCategory = { Need: 0, Want: 0, Savings: 0 }; // This also refers to all-time totals for dashboard category summary

// For month navigation
let selectedViewMonth = new Date().getMonth(); // 0-indexed
let selectedViewYear = new Date().getFullYear();
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let editingTransactionId = null;
let originalTransactionForEdit = null;
let editingIncomeId = null;
let originalIncomeForEdit = null;
let editingAccountId = null;
let originalAccountForEdit = null;
let editingCardId = null;
let originalCardForEdit = null;
let editingLoanId = null;
let originalLoanForEdit = null;
let editingBudgetKey = null;
let originalBudgetForEdit = null;

let sidebarEl, sidebarOverlayEl, formPopupOverlayEl, addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl, fabActionSelectPopupEl, fabButtonEl, loanDetailPopupEl, loanDetailPopupContentEl, noTransactionsMessageEl, expenseTransactionsWrapperEl, incomeLogWrapperEl, accountsTableWrapperEl, noAccountsMessageEl, budgetTableWrapperEl, noBudgetItemsMessageEl, creditCardsTableWrapperEl, noCreditCardsMessageEl, loanDetailsTableWrapperEl, noLoanDetailsMessageEl, monthlyChartInstance = null;
let recentTransactionsListEl, noRecentActivityMessageEl;
let activeRecentActivityFilter = 'all';
const MAX_RECENT_ITEMS = 10;

// Settings variables
let currentThemeColor = '#007bff';
let isDarkMode = false;
const PREDEFINED_THEME_COLORS = [
    { name: 'Blue', value: '#007bff' }, { name: 'Green', value: '#28a745' },
    { name: 'Teal', value: '#17a2b8' }, { name: 'Indigo', value: '#6610f2' },
    { name: 'Orange', value: '#fd7e14' }, { name: 'Crimson', value: '#dc3545' }
];
let themeColorOptionsContainerEl, customThemeColorPickerEl, darkModeToggleEl, exportDataBtnEl, resetDataBtnEl;


const sampleSubcategoriesByMain = {
    "Need":["🍜 Food & Groceries","🏠 Housing (Rent/Mortgage)","💡 Utilities (Elec,Water,Gas)","🚗 Transport (Fuel, Public)","👕 Basic Clothing","⚕️ Essential Healthcare","👶 Childcare","📞 Phone/Internet Bill"],
    "Want":["🎉 Dining Out/Entertainment","🎨 Hobbies & Leisure","🛍️ Shopping (Non-essential)","✈️ Travel & Vacations","📺 Subscriptions (Streaming, etc.)","💅 Personal Indulgence"],
    "Savings":["🛡️ Emergency Fund","📈 Investment (Stocks, Mutual Funds)","👴 Retirement Fund (Pension)","🎯 Large Purchase Savings (Car, House)"]
};

document.addEventListener('DOMContentLoaded', () => {
    sidebarEl = document.getElementById("sidebarNav"); sidebarOverlayEl = document.getElementById("sidebarOverlay");
    formPopupOverlayEl = document.getElementById("formPopupOverlay"); addAccountFormPopupEl = document.getElementById("addAccountForm");
    expenseFormPopupEl = document.getElementById("transactionForm"); incomeFormPopupEl = document.getElementById("incomeForm");
    budgetFormPopupEl = document.getElementById("budgetForm"); cardFormPopupEl = document.getElementById("cardForm"); loanDetailsFormPopupEl = document.getElementById("loanDetailsForm");
    fabActionSelectPopupEl = document.getElementById("fabActionSelectPopup"); fabButtonEl = document.getElementById("fab");
    loanDetailPopupEl = document.getElementById("loanDetailPopup"); loanDetailPopupContentEl = document.getElementById("loanDetailPopupContent");
    noTransactionsMessageEl = document.getElementById("noTransactionsMessage"); expenseTransactionsWrapperEl = document.getElementById("expenseTransactionsWrapper");
    incomeLogWrapperEl = document.getElementById("incomeLogWrapper"); accountsTableWrapperEl = document.getElementById("accountsTableWrapper");
    noAccountsMessageEl = document.getElementById("noAccountsMessage"); budgetTableWrapperEl = document.getElementById("budgetTableWrapper");
    noBudgetItemsMessageEl = document.getElementById("noBudgetItemsMessage"); creditCardsTableWrapperEl = document.getElementById("creditCardsTableWrapper");
    noCreditCardsMessageEl = document.getElementById("noCreditCardsMessage"); loanDetailsTableWrapperEl = document.getElementById("loanCardContainer");
    noLoanDetailsMessageEl = document.getElementById("noLoanDetailsMessage");
    recentTransactionsListEl = document.getElementById("recentTransactionsList");
    noRecentActivityMessageEl = document.getElementById("noRecentActivityMessage");

    themeColorOptionsContainerEl = document.getElementById('themeColorOptions');
    customThemeColorPickerEl = document.getElementById('customThemeColorPicker');
    darkModeToggleEl = document.getElementById('darkModeToggle');
    exportDataBtnEl = document.getElementById('exportDataBtn');
    resetDataBtnEl = document.getElementById('resetDataBtn');

    document.getElementById("hamburgerMenu")?.addEventListener("click", openNav);
    fabButtonEl?.addEventListener("click", handleFabClick);
    addAccountFormPopupEl?.addEventListener("submit", handleAddAccount);
    incomeFormPopupEl?.addEventListener("submit", handleAddIncome);
    expenseFormPopupEl?.addEventListener("submit", handleAddExpenseTransaction);
    budgetFormPopupEl?.addEventListener("submit", handleAddBudget);
    cardFormPopupEl?.addEventListener("submit", handleAddCard);
    loanDetailsFormPopupEl?.addEventListener("submit", handleAddLoanDetails);
    document.getElementById("fabAddExpenseBtn")?.addEventListener('click', () => openFormPopup('expense'));
    document.getElementById("fabAddIncomeBtn")?.addEventListener('click', () => openFormPopup('income'));

    document.querySelectorAll('.activity-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.activity-filter-btn').forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');
            activeRecentActivityFilter = event.currentTarget.dataset.filter;
            renderRecentTransactionsDashboard(); // This dashboard part is global, not month-specific
        });
    });

    if (customThemeColorPickerEl) {
        customThemeColorPickerEl.addEventListener('input', (e) => { applyThemeColor(e.target.value); });
        customThemeColorPickerEl.addEventListener('change', (e) => { applyThemeColor(e.target.value); saveData(); });
    }
    if (darkModeToggleEl) {
        darkModeToggleEl.addEventListener('click', () => { toggleDarkMode(); saveData(); });
    }
    if (exportDataBtnEl) exportDataBtnEl.addEventListener('click', exportData);
    if (resetDataBtnEl) resetDataBtnEl.addEventListener('click', resetAllData);

    initializeMonthNavigators(); // Initialize month navigators

    try {
        loadData();
        populateThemeColorSwatches();
        updateAllMonthDisplays(); // Set initial display for month navigators after loading selectedViewMonth/Year
        renderAllUI(); // This will now use selectedViewMonth/Year for transactions and budget
        updateDashboard();
    } catch (e) { console.error("Init error:", e); }

    const initActive = document.querySelector('.tab-content.active');
    if (initActive) {
        const id = initActive.id;
        document.querySelector(`.tab-button[data-tabid="${id}"],.menu-tab-button[data-tabid="${id}"]`)?.classList.add('active');
        toggleFabVisibility(id);
        checkAllContentVisibility();
        if (id === 'dashboard') renderMonthlyChart(); // Chart updated with selected month
    } else {
        showTab(null, 'dashboard');
    }
});

function getCategoryIcon(categoryName) {
    switch (categoryName) { case "Need": return "⚠️"; case "Want": return "🛍️"; case "Savings": return "💰"; default: return "▪️"; }
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }

function renderAllUI() {
    renderBankAccounts();
    renderCreditCards();
    renderTransactions();
    renderIncomeLog();
    renderBudgets();
    renderLoanDetails();
    populateAccountDropdowns();
    updateSubcategoryDropdown();
    updatePaymentSourceDropdown();
    renderRecentTransactionsDashboard(); // Global recent activity
}

function updateAffectedUI(changedDataType = null) {
    // Re-render components based on what changed, respecting selectedViewMonth/Year
    if (changedDataType === 'account' || !changedDataType) {
        renderBankAccounts();
        populateAccountDropdowns();
    }
    if (changedDataType === 'card' || !changedDataType) {
        renderCreditCards();
    }
    if (changedDataType === 'expense' || changedDataType === 'account' || changedDataType === 'card' || !changedDataType) {
        renderTransactions(); // Will use selectedViewMonth/Year
        if(changedDataType === 'account' || changedDataType === 'card') updatePaymentSourceDropdown();
    }
    if (changedDataType === 'income' || changedDataType === 'account' || !changedDataType) {
        renderIncomeLog(); // Will use selectedViewMonth/Year
    }
    if (changedDataType === 'budget' || changedDataType === 'expense' || !changedDataType) {
        renderBudgets();  // Will use selectedViewMonth/Year for "spent"
    }
    if (changedDataType === 'loan' || !changedDataType) {
        renderLoanDetails();
    }

    renderRecentTransactionsDashboard(); // Global recent activity
    updateDashboard(); // Dashboard summary global, chart uses selectedViewMonth/Year
}

// --- Month Navigation ---
function initializeMonthNavigators() {
    createMonthNavigatorDOM('transactions');
    createMonthNavigatorDOM('budget');
}

function createMonthNavigatorDOM(tabPrefix) {
    const tabContentEl = document.getElementById(tabPrefix);
    if (!tabContentEl) return;

    const navigatorEl = document.createElement('div');
    navigatorEl.className = 'month-navigator';
    navigatorEl.id = `monthNavigator_${tabPrefix}`;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'month-nav-btn prev-month';
    prevBtn.id = `prevMonthBtn_${tabPrefix}`;
    prevBtn.innerHTML = '&lt;';
    prevBtn.setAttribute('aria-label', 'Previous Month');
    prevBtn.addEventListener('click', () => changeSelectedMonth(-1));

    const displaySpan = document.createElement('span');
    displaySpan.className = 'current-month-display';
    displaySpan.id = `currentMonthDisplay_${tabPrefix}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'month-nav-btn next-month';
    nextBtn.id = `nextMonthBtn_${tabPrefix}`;
    nextBtn.innerHTML = '&gt;';
    nextBtn.setAttribute('aria-label', 'Next Month');
    nextBtn.addEventListener('click', () => changeSelectedMonth(1));

    navigatorEl.appendChild(prevBtn);
    navigatorEl.appendChild(displaySpan);
    navigatorEl.appendChild(nextBtn);

    tabContentEl.prepend(navigatorEl);
}

function changeSelectedMonth(direction) {
    const newDate = new Date(selectedViewYear, selectedViewMonth, 1);
    newDate.setMonth(newDate.getMonth() + direction);

    selectedViewMonth = newDate.getMonth();
    selectedViewYear = newDate.getFullYear();

    updateAllMonthDisplays();
    renderTransactions();
    renderBudgets();
    renderMonthlyChart(); // Update dashboard chart as well
    saveData(); // Save the new selected view date
}

function updateAllMonthDisplays() {
    const displayString = `${MONTH_NAMES_FULL[selectedViewMonth]} ${selectedViewYear}`;

    const transDisplay = document.getElementById('currentMonthDisplay_transactions');
    if (transDisplay) transDisplay.textContent = displayString;

    const budgetDisplay = document.getElementById('currentMonthDisplay_budget');
    if (budgetDisplay) budgetDisplay.textContent = displayString;

    // Disable next button if viewing current month or future (optional)
    const currentRealDate = new Date();
    const isFutureOrCurrent = selectedViewYear > currentRealDate.getFullYear() ||
                             (selectedViewYear === currentRealDate.getFullYear() && selectedViewMonth >= currentRealDate.getMonth());

    ['transactions', 'budget'].forEach(tabPrefix => {
        const nextBtn = document.getElementById(`nextMonthBtn_${tabPrefix}`);
        if (nextBtn) {
            // Let's allow navigating to future for planning, so no disabling for now.
            // If you want to disable: nextBtn.disabled = isFutureOrCurrent;
             nextBtn.disabled = false;
        }
    });

    // Update dashboard chart title
    const monthlyOverviewTitleEl = document.getElementById('monthlyOverviewTitle');
    if (monthlyOverviewTitleEl) {
        monthlyOverviewTitleEl.textContent = `Monthly Overview (${displayString})`;
    }
}


function checkAllContentVisibility() { checkTransactionVisibility(); checkAccountsVisibility(); checkBudgetVisibility(); checkCreditCardsVisibility(); checkLoanDetailsVisibility(); }
function openNav() { if (sidebarEl && sidebarOverlayEl) { sidebarEl.style.width = "250px"; sidebarOverlayEl.style.display = "block"; } }
function closeNav() { if (sidebarEl && sidebarOverlayEl) { sidebarEl.style.width = "0"; sidebarOverlayEl.style.display = "none"; } }
function toggleFabVisibility(activeTabId) { if (!fabButtonEl) return; fabButtonEl.classList.toggle('hidden-fab', activeTabId === 'dashboard' || activeTabId === 'settings'); }

function showTab(e, id, isFromMenu = false) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button,.menu-tab-button').forEach(b => b.classList.remove('active'));
    const tc = document.getElementById(id); if (tc) tc.classList.add('active'); else return;

    const cb = e ? e.currentTarget : (document.querySelector(`.tab-button[data-tabid="${id}"]`) || document.querySelector(`.menu-tab-button[data-tabid="${id}"]`));
    if (cb) cb.classList.add('active');

    toggleFabVisibility(id);
    checkAllContentVisibility();
    if (isFromMenu) closeNav();
    window.scrollTo(0, 0);
    if (id === 'dashboard' || id === 'transactions' || id === 'budget') { // Re-render related views
        renderMonthlyChart(); // Uses selectedViewMonth/Year
        renderTransactions(); // Uses selectedViewMonth/Year
        renderBudgets();      // Uses selectedViewMonth/Year
    }
}

function openFormPopup(formType, itemId = null, itemSubKey = null) {
    if (!formPopupOverlayEl) return;
    [addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl].forEach(form => form?.reset());

    editingTransactionId = null; originalTransactionForEdit = null;
    editingIncomeId = null; originalIncomeForEdit = null;
    editingAccountId = null; originalAccountForEdit = null;
    editingCardId = null; originalCardForEdit = null;
    editingLoanId = null; originalLoanForEdit = null;
    editingBudgetKey = null; originalBudgetForEdit = null;

    document.getElementById('expenseFormTitle').textContent = 'Add Expense';
    document.getElementById('expenseFormSubmitBtn').textContent = 'Add Expense';
    document.getElementById('incomeFormTitle').textContent = 'Add Income';
    document.getElementById('incomeFormSubmitBtn').textContent = 'Add Income';
    addAccountFormPopupEl.querySelector('h3').textContent = 'Add Bank Account';
    addAccountFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Account';
    cardFormPopupEl.querySelector('h3').textContent = 'Add Credit Card';
    cardFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Card';
    loanDetailsFormPopupEl.querySelector('h3').textContent = 'Add Loan Details';
    loanDetailsFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Loan';
    budgetFormPopupEl.querySelector('h3').textContent = 'Add Budget Item';
    budgetFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Budget Item';

    [fabActionSelectPopupEl, addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl, loanDetailPopupEl].forEach(el => el?.classList.add('hidden'));
    formPopupOverlayEl.style.display = 'flex';

    let formToOpen = null, inputToFocusId = null;
    const today = new Date();
    const defaultDateForForm = new Date(selectedViewYear, selectedViewMonth,
        (selectedViewYear === today.getFullYear() && selectedViewMonth === today.getMonth()) ? today.getDate() : 1
    );


    if (formType === 'account') {
        formToOpen = addAccountFormPopupEl; inputToFocusId = 'accountNameInput';
        if (itemId) prepareEditAccount(itemId);
    } else if (formType === 'expense') {
        formToOpen = expenseFormPopupEl; inputToFocusId = 'transactionDateInput';
         document.getElementById('transactionDateInput').valueAsDate = defaultDateForForm;
        updateSubcategoryDropdown(); updatePaymentSourceDropdown();
        if (itemId) prepareEditTransaction(itemId); // This will override date if editing
    } else if (formType === 'income') {
        formToOpen = incomeFormPopupEl; inputToFocusId = 'incomeDateInput';
        document.getElementById('incomeDateInput').valueAsDate = defaultDateForForm;
        populateAccountDropdowns();
        if (itemId) prepareEditIncome(itemId); // This will override date if editing
    } else if (formType === 'budget') {
        formToOpen = budgetFormPopupEl; inputToFocusId = 'budgetCategory';
        updateBudgetSubcategoryOptions();
        if (itemId && itemSubKey) prepareEditBudget(itemId, itemSubKey);
    } else if (formType === 'creditcard') {
        formToOpen = cardFormPopupEl; inputToFocusId = 'cardNameInput';
        if (itemId) prepareEditCard(itemId);
    } else if (formType === 'loanDetails') {
        formToOpen = loanDetailsFormPopupEl; inputToFocusId = 'loanLenderName';
        if (itemId) prepareEditLoan(itemId);
    }

    if (formToOpen) { formToOpen.classList.remove('hidden'); setTimeout(() => { const focusEl = document.getElementById(inputToFocusId); if(focusEl) focusEl.focus();}, 50); }
}

function closeFormPopup() {
    if (!formPopupOverlayEl ) return;
    formPopupOverlayEl.style.display = 'none';
    [addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl, fabActionSelectPopupEl, loanDetailPopupEl].forEach(el => el?.classList.add('hidden'));
    [addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl].forEach(form => form?.reset());
    editingTransactionId = null; originalTransactionForEdit = null;
    editingIncomeId = null; originalIncomeForEdit = null;
    editingAccountId = null; originalAccountForEdit = null;
    editingCardId = null; originalCardForEdit = null;
    editingLoanId = null; originalLoanForEdit = null;
    editingBudgetKey = null; originalBudgetForEdit = null;
    document.getElementById('expenseFormTitle').textContent = 'Add Expense';
    document.getElementById('expenseFormSubmitBtn').textContent = 'Add Expense';
    document.getElementById('incomeFormTitle').textContent = 'Add Income';
    document.getElementById('incomeFormSubmitBtn').textContent = 'Add Income';
    if(addAccountFormPopupEl) { addAccountFormPopupEl.querySelector('h3').textContent = 'Add Bank Account'; addAccountFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Account';}
    if(cardFormPopupEl) { cardFormPopupEl.querySelector('h3').textContent = 'Add Credit Card'; cardFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Card';}
    if(loanDetailsFormPopupEl){ loanDetailsFormPopupEl.querySelector('h3').textContent = 'Add Loan Details'; loanDetailsFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Loan';}
    if(budgetFormPopupEl){ budgetFormPopupEl.querySelector('h3').textContent = 'Add Budget Item'; budgetFormPopupEl.querySelector('button[type="submit"]').textContent = 'Add Budget Item';}
    updateBudgetSubcategoryOptions();
    document.getElementById('budgetSubcategoryOtherInput')?.classList.add('hidden');
    updatePaymentSourceDropdown();
    updateSubcategoryDropdown();
}

function handleFabClick() {
    const activeTabEl = document.querySelector('.tab-content.active');
    if (!activeTabEl) return;
    const activeTabId = activeTabEl.id;

    if (activeTabId === 'dashboard' || activeTabId === 'settings') return;
    else if (activeTabId === 'transactions') {
        if (formPopupOverlayEl && fabActionSelectPopupEl) {
            formPopupOverlayEl.style.display = 'flex';
            fabActionSelectPopupEl.classList.remove('hidden');
            expenseFormPopupEl?.classList.add('hidden');
            incomeFormPopupEl?.classList.add('hidden');
        }
    } else if (activeTabId === 'accounts') { openFormPopup('account'); }
    else if (activeTabId === 'budget') { openFormPopup('budget'); }
    else if (activeTabId === 'creditcard') { openFormPopup('creditcard'); }
    else if (activeTabId === 'loanDetails') { openFormPopup('loanDetails'); }
}

function checkTransactionVisibility() {
    if (!noTransactionsMessageEl || !expenseTransactionsWrapperEl || !incomeLogWrapperEl) return;
    const currentMonthExpenses = transactions.filter(t =>
        new Date(t.date).getFullYear() === selectedViewYear && new Date(t.date).getMonth() === selectedViewMonth
    );
    const currentMonthIncomes = incomeLog.filter(i =>
        new Date(i.date).getFullYear() === selectedViewYear && new Date(i.date).getMonth() === selectedViewMonth
    );

    const hasExp = currentMonthExpenses.length > 0;
    const hasInc = currentMonthIncomes.length > 0;

    expenseTransactionsWrapperEl.style.display = hasExp ? 'block' : 'none';
    expenseTransactionsWrapperEl.classList.toggle('initially-hidden', !hasExp);
    incomeLogWrapperEl.style.display = hasInc ? 'block' : 'none';
    incomeLogWrapperEl.classList.toggle('initially-hidden', !hasInc);
    noTransactionsMessageEl.classList.toggle('hidden', hasExp || hasInc);
}
function checkAccountsVisibility() { if (!accountsTableWrapperEl || !noAccountsMessageEl) return; const hasAcc = bankAccounts.length > 0; accountsTableWrapperEl.style.display = hasAcc ? 'block' : 'none'; accountsTableWrapperEl.classList.toggle('initially-hidden', !hasAcc); noAccountsMessageEl.classList.toggle('hidden', hasAcc); }
function checkBudgetVisibility() { if (!budgetTableWrapperEl || !noBudgetItemsMessageEl) return; const hasBud = Object.keys(budgets).length > 0 && Object.values(budgets).some(cat => Object.keys(cat).length > 0); budgetTableWrapperEl.style.display = hasBud ? 'block' : 'none'; budgetTableWrapperEl.classList.toggle('initially-hidden', !hasBud); noBudgetItemsMessageEl.classList.toggle('hidden', hasBud); }
function checkCreditCardsVisibility() { if (!creditCardsTableWrapperEl || !noCreditCardsMessageEl) return; const hasCC = creditCards.length > 0; creditCardsTableWrapperEl.style.display = hasCC ? 'block' : 'none'; creditCardsTableWrapperEl.classList.toggle('initially-hidden', !hasCC); noCreditCardsMessageEl.classList.toggle('hidden', hasCC); }
function checkLoanDetailsVisibility() { if (!loanDetailsTableWrapperEl || !noLoanDetailsMessageEl) return; const hasLoans = loanDetails.length > 0; loanDetailsTableWrapperEl.style.display = hasLoans ? 'flex' : 'none'; loanDetailsTableWrapperEl.classList.toggle('initially-hidden', !hasLoans); noLoanDetailsMessageEl.classList.toggle('hidden', hasLoans); }

function updateSubcategoryDropdown() {
    const mainCatInput = document.getElementById("transactionCategoryInput");
    const subCatInput = document.getElementById("transactionSubcategoryInput");
    if (!mainCatInput || !subCatInput) return;

    const selectedMainCategory = mainCatInput.value;
    const currentSubCategoryValue = subCatInput.value;

    subCatInput.innerHTML = '<option value="">Subcategory</option>';

    if (sampleSubcategoriesByMain[selectedMainCategory]) {
        sampleSubcategoriesByMain[selectedMainCategory].forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subCatInput.appendChild(option);
        });
    }

    if (sampleSubcategoriesByMain[selectedMainCategory] && sampleSubcategoriesByMain[selectedMainCategory].includes(currentSubCategoryValue)) {
        subCatInput.value = currentSubCategoryValue;
    } else {
         subCatInput.value = "";
    }
}

function updateBudgetSubcategoryOptions() {
    const mainCatSel = document.getElementById("budgetCategory"), subCatSel = document.getElementById("budgetSubcategorySelect"), otherSubIn = document.getElementById("budgetSubcategoryOtherInput");
    if (!mainCatSel || !subCatSel || !otherSubIn) return;
    const selMainCat = mainCatSel.value; const currentSubValue = subCatSel.value;
    subCatSel.innerHTML = '<option value="">-- Select Subcategory --</option>'; otherSubIn.classList.add('hidden'); otherSubIn.value = ''; otherSubIn.required = false;
    if (sampleSubcategoriesByMain[selMainCat]) { sampleSubcategoriesByMain[selMainCat].forEach(sub => { subCatSel.innerHTML += `<option value="${sub}">${sub}</option>`; }); }
    subCatSel.innerHTML += '<option value="_other_">✏️ Other (Specify)</option>';
    if (Array.from(subCatSel.options).some(opt => opt.value === currentSubValue) && currentSubValue !== "_other_") { subCatSel.value = currentSubValue;
    } else if (currentSubValue === "_other_") { subCatSel.value = "_other_"; handleBudgetSubcategoryChange();
    } else { subCatSel.value = ""; }
}
function handleBudgetSubcategoryChange() {
    const subCatSel = document.getElementById("budgetSubcategorySelect"), otherSubIn = document.getElementById("budgetSubcategoryOtherInput");
    if (!subCatSel || !otherSubIn) return;
    if (subCatSel.value === "_other_") { otherSubIn.classList.remove('hidden'); otherSubIn.required = true; if(!editingBudgetKey) otherSubIn.focus(); }
    else { otherSubIn.classList.add('hidden'); otherSubIn.value = ''; otherSubIn.required = false; }
}

// --- Bank Account CRUD --- (Remains global)
function handleAddAccount(e) {
    e.preventDefault();
    const nameInput = document.getElementById("accountNameInput");
    const balanceInput = document.getElementById("initialBalanceInput");
    const newName = nameInput.value.trim();
    const newBalance = parseFloat(balanceInput.value);
    if (!newName || isNaN(newBalance)) { alert("Invalid account name or balance."); return; }
    if (editingAccountId) {
        const account = bankAccounts.find(a => a.id === editingAccountId);
        if (!account) { alert("Account not found for editing."); closeFormPopup(); return; }
        if (newName.toLowerCase() !== account.name.toLowerCase() && bankAccounts.some(a => a.id !== editingAccountId && a.name.toLowerCase() === newName.toLowerCase())) {
            alert("An account with this name already exists."); return;
        }
        account.name = newName; account.balance = newBalance;
    } else {
        if (bankAccounts.find(a => a.name.toLowerCase() === newName.toLowerCase())) { alert("An account with this name already exists."); return; }
        bankAccounts.push({ id: generateId(), name: newName, balance: newBalance });
    }
    updateAffectedUI('account'); e.target.reset(); closeFormPopup(); saveData();
}
function prepareEditAccount(id) {
    const account = bankAccounts.find(a => a.id === id);
    if (!account) { alert("Account not found."); return; }
    originalAccountForEdit = JSON.parse(JSON.stringify(account)); editingAccountId = id;
    addAccountFormPopupEl.querySelector('h3').textContent = 'Edit Bank Account';
    addAccountFormPopupEl.querySelector('button[type="submit"]').textContent = 'Update Account';
    document.getElementById("accountNameInput").value = account.name;
    document.getElementById("initialBalanceInput").value = account.balance.toFixed(2);
}
function deleteAccount(id) {
    const accountToDelete = bankAccounts.find(a => a.id === id);
    if (!accountToDelete) { alert("Account not found."); return; }
    const associatedTransactions = transactions.filter(t => t.paymentMethod === "BankAccount" && t.paymentSourceId === id);
    const associatedIncomes = incomeLog.filter(i => i.accountId === id);
    if (associatedTransactions.length > 0 || associatedIncomes.length > 0) {
        if (!confirm(`WARNING: Account "${accountToDelete.name}" has associated records. Deleting may orphan them (they will refer to a deleted account). Continue?`)) return;
    } else { if (!confirm(`Delete account "${accountToDelete.name}"?`)) return; }
    bankAccounts = bankAccounts.filter(a => a.id !== id);
    transactions.forEach(t => { if(t.paymentMethod === "BankAccount" && t.paymentSourceId === id) t.paymentSourceName = `${accountToDelete.name} (Deleted)`; });
    incomeLog.forEach(i => { if(i.accountId === id) i.accountName = `${accountToDelete.name} (Deleted)`; });
    updateAffectedUI('account'); saveData();
}
function renderBankAccounts() {
    const tb = document.getElementById("accountsTableBody"); if (!tb) return; tb.innerHTML = "";
    bankAccounts.forEach(a => {
        const r = tb.insertRow();
        r.innerHTML = `<td>${a.name}</td><td>₹${a.balance.toFixed(2)}</td><td><button class="action-btn edit-btn" onclick="openFormPopup('account', '${a.id}')">Edit</button><button class="action-btn delete-btn" onclick="deleteAccount('${a.id}')">Delete</button></td>`;
    }); checkAccountsVisibility();
}

// --- Income CRUD ---
function handleAddIncome(e) {
    e.preventDefault();
    const newDate = document.getElementById("incomeDateInput").value; // Get date from new input
    const accountId = document.getElementById("incomeAccountSelect").value;
    const source = document.getElementById("incomeSourceInput").value.trim();
    const newAmount = parseFloat(document.getElementById("incomeAmountInput").value);

    if (!newDate || !accountId || !source || isNaN(newAmount) || newAmount <= 0) { alert("Invalid income details."); return; }
    const targetAccount = bankAccounts.find(acc => acc.id === accountId);
    if (!targetAccount) { alert("Selected account not found."); return; }

    if (editingIncomeId) {
        const incomeItemIndex = incomeLog.findIndex(inc => inc.id === editingIncomeId);
        if (incomeItemIndex === -1 || !originalIncomeForEdit) { alert("Income item to edit not found."); closeFormPopup(); return; }
        revertFinancialImpact(originalIncomeForEdit, 'income');

        targetAccount.balance += newAmount;
        totalIncomeLogged += newAmount; // Global total income
        incomeLog[incomeItemIndex] = { ...incomeLog[incomeItemIndex], date: newDate, accountId, accountName: targetAccount.name, source, amount: newAmount };
    } else {
        targetAccount.balance += newAmount;
        totalIncomeLogged += newAmount; // Global total income
        incomeLog.push({ id: generateId(), date: newDate, accountId, accountName: targetAccount.name, source, amount: newAmount });
    }
    updateAffectedUI('income'); e.target.reset(); closeFormPopup(); saveData();
}
function prepareEditIncome(id) {
    const incomeItem = incomeLog.find(inc => inc.id === id);
    if (!incomeItem) { alert("Income record not found."); return; }
    originalIncomeForEdit = JSON.parse(JSON.stringify(incomeItem)); editingIncomeId = id;
    document.getElementById('incomeFormTitle').textContent = 'Edit Income';
    document.getElementById('incomeFormSubmitBtn').textContent = 'Update Income';
    populateAccountDropdowns();
    document.getElementById('incomeDateInput').value = incomeItem.date;
    document.getElementById('incomeAccountSelect').value = incomeItem.accountId;
    document.getElementById('incomeSourceInput').value = incomeItem.source;
    document.getElementById('incomeAmountInput').value = incomeItem.amount;
}
function deleteIncome(id) {
    if (!confirm("Delete this income record?")) return;
    const incomeIndex = incomeLog.findIndex(inc => inc.id === id);
    if (incomeIndex === -1) { alert("Income record not found."); return; }
    revertFinancialImpact(incomeLog[incomeIndex], 'income');
    incomeLog.splice(incomeIndex, 1);
    updateAffectedUI('income'); saveData();
}
function renderIncomeLog() {
    const tb = document.getElementById("incomeLogTableBody"); if (!tb) return; tb.innerHTML = "";

    const filteredIncome = incomeLog.filter(i => {
        const incomeDate = new Date(i.date);
        return incomeDate.getFullYear() === selectedViewYear && incomeDate.getMonth() === selectedViewMonth;
    });

    [...filteredIncome].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(l => {
        const r = tb.insertRow();
        r.innerHTML = `<td>${l.date}</td><td>${l.accountName}</td><td>${l.source}</td><td>₹${l.amount.toFixed(2)}</td><td><button class="action-btn edit-btn" onclick="openFormPopup('income', '${l.id}')">Edit</button><button class="action-btn delete-btn" onclick="deleteIncome('${l.id}')">Delete</button></td>`;
    });
    checkTransactionVisibility(); // Checks visibility based on filtered data for the current month
}

// --- Expense Transaction CRUD ---
function handleAddExpenseTransaction(e) {
    e.preventDefault();
    const newDate = document.getElementById("transactionDateInput").value;
    const newCategory = document.getElementById("transactionCategoryInput").value;
    const newSubcategory = document.getElementById("transactionSubcategoryInput").value.trim() || "Other";
    const newAmount = parseFloat(document.getElementById("transactionAmountInput").value);
    const newPaymentMethod = document.getElementById("paymentMethodInput").value;
    const newPaymentSourceId = document.getElementById("paymentSourceInput").value;
    const newRemarks = document.getElementById("transactionRemarksInput").value.trim();

    if (!newDate || !newCategory || !newSubcategory || isNaN(newAmount) || newAmount <= 0 || !newPaymentMethod) { alert("Please fill all required fields."); return; }
    if ((newPaymentMethod === "BankAccount" || newPaymentMethod === "CreditCard") && !newPaymentSourceId) { alert("Please select a payment source for Bank Account or Credit Card method."); return; }

    let newPaymentSourceName = newPaymentMethod === "Cash" ? "Cash" : "";

    // Use copies for calculations to ensure atomicity
    let tempTotalExpenses = totalExpenses; // Global total
    let tempExpensesByCategory = {...expensesByCategory}; // Global by category
    let tempBankAccounts = JSON.parse(JSON.stringify(bankAccounts));
    let tempCreditCards = JSON.parse(JSON.stringify(creditCards));

    if (editingTransactionId) {
        if (!originalTransactionForEdit) { alert("Original transaction for edit not found."); closeFormPopup(); return; }

        // Revert impact of original transaction from global totals
        tempTotalExpenses -= originalTransactionForEdit.amount;
        if (tempExpensesByCategory[originalTransactionForEdit.category] !== undefined) {
            tempExpensesByCategory[originalTransactionForEdit.category] -= originalTransactionForEdit.amount;
        }
        if (originalTransactionForEdit.paymentMethod === "BankAccount" && originalTransactionForEdit.paymentSourceId) {
            const acc = tempBankAccounts.find(x => x.id === originalTransactionForEdit.paymentSourceId);
            if (acc) acc.balance += originalTransactionForEdit.amount;
        } else if (originalTransactionForEdit.paymentMethod === "CreditCard" && originalTransactionForEdit.paymentSourceId) {
            const card = tempCreditCards.find(x => x.id === originalTransactionForEdit.paymentSourceId);
            if (card) card.outstanding -= originalTransactionForEdit.amount;
        }
    }

    // Apply impact of new/edited transaction to global totals
    try {
        if (newPaymentMethod === "BankAccount") {
            const acc = tempBankAccounts.find(x => x.id === newPaymentSourceId);
            if (!acc) throw new Error("Selected bank account not found.");
            if (acc.balance < newAmount) {
                 throw new Error(`Insufficient balance in ${acc.name}. Current: ₹${acc.balance.toFixed(2)}, Tried to spend: ₹${newAmount.toFixed(2)}`);
            }
            acc.balance -= newAmount; newPaymentSourceName = acc.name;
        } else if (newPaymentMethod === "CreditCard") {
            const card = tempCreditCards.find(x => x.id === newPaymentSourceId);
            if (!card) throw new Error("Selected credit card not found.");
            if (card.outstanding + newAmount > card.limit) {
                throw new Error(`Transaction exceeds credit limit for ${card.name}. Limit: ₹${card.limit.toFixed(2)}, New Outstanding: ₹${(card.outstanding + newAmount).toFixed(2)}`);
            }
            card.outstanding += newAmount; newPaymentSourceName = card.name;
        }

        tempTotalExpenses += newAmount;
        if (tempExpensesByCategory[newCategory] !== undefined) tempExpensesByCategory[newCategory] += newAmount;
        else tempExpensesByCategory[newCategory] = newAmount;

        // Commit changes if no error
        totalExpenses = tempTotalExpenses;
        expensesByCategory = tempExpensesByCategory;
        bankAccounts = tempBankAccounts;
        creditCards = tempCreditCards;

        if (editingTransactionId) {
            const transactionIndex = transactions.findIndex(t => t.id === editingTransactionId);
            transactions[transactionIndex] = { ...transactions[transactionIndex], date: newDate, category: newCategory, subcategory: newSubcategory, amount: newAmount, remarks: newRemarks, paymentMethod: newPaymentMethod, paymentSourceId: newPaymentSourceId || null, paymentSourceName: newPaymentSourceName };
        } else {
            transactions.push({ id: generateId(), date: newDate, category: newCategory, subcategory: newSubcategory, amount: newAmount, remarks: newRemarks, paymentMethod: newPaymentMethod, paymentSourceId: newPaymentSourceId || null, paymentSourceName: newPaymentSourceName });
        }
    } catch (error) {
        alert(error.message);
        return; // Prevent further execution if error
    }
    updateAffectedUI('expense'); e.target.reset(); closeFormPopup(); saveData();
}

function revertFinancialImpact(item, type) { // Simplified: only for deletion. Edit handles its own reversal.
    if (!item) return;
    const opFactor = -1;

    if (type === 'expense') {
        totalExpenses += opFactor * item.amount; // Global
        if (expensesByCategory[item.category] !== undefined) expensesByCategory[item.category] += opFactor * item.amount; // Global

        if (item.paymentMethod === "BankAccount" && item.paymentSourceId) {
            const acc = bankAccounts.find(x => x.id === item.paymentSourceId);
            if (acc) acc.balance -= opFactor * item.amount;
        } else if (item.paymentMethod === "CreditCard" && item.paymentSourceId) {
            const card = creditCards.find(x => x.id === item.paymentSourceId);
            if (card) card.outstanding += opFactor * item.amount;
        }
    } else if (type === 'income') {
        totalIncomeLogged += opFactor * item.amount; // Global
        const acc = bankAccounts.find(a => a.id === item.accountId);
        if (acc) acc.balance += opFactor * item.amount;
    }
}
function prepareEditTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) { alert("Transaction not found."); return; }
    originalTransactionForEdit = JSON.parse(JSON.stringify(transaction)); editingTransactionId = id;
    document.getElementById('expenseFormTitle').textContent = 'Edit Expense';
    document.getElementById('expenseFormSubmitBtn').textContent = 'Update Expense';
    document.getElementById('transactionDateInput').value = transaction.date; // Set to original date
    document.getElementById('transactionCategoryInput').value = transaction.category;
    updateSubcategoryDropdown(); document.getElementById('transactionSubcategoryInput').value = transaction.subcategory;
    document.getElementById('transactionAmountInput').value = transaction.amount;
    document.getElementById('paymentMethodInput').value = transaction.paymentMethod;
    updatePaymentSourceDropdown();
    if(transaction.paymentSourceId) document.getElementById('paymentSourceInput').value = transaction.paymentSourceId;
    document.getElementById('transactionRemarksInput').value = transaction.remarks;
}
function deleteTransaction(id) {
    if (!confirm("Delete this expense?")) return;
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) { alert("Transaction not found."); return; }
    revertFinancialImpact(transactions[transactionIndex], 'expense');
    transactions.splice(transactionIndex, 1);
    updateAffectedUI('expense'); saveData();
}
function renderTransactions() {
    const tb = document.getElementById("transactionTableBody"); if (!tb) return; tb.innerHTML = "";

    const filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getFullYear() === selectedViewYear && transDate.getMonth() === selectedViewMonth;
    });

    [...filteredTransactions].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
        const r = tb.insertRow();
        r.innerHTML = `<td>${t.date}</td><td>${t.category}</td><td>${t.subcategory}</td><td>₹${t.amount.toFixed(2)}</td><td>${t.paymentMethod === 'BankAccount' ? 'Bank/Tracked Cash' : t.paymentMethod}</td><td>${t.paymentSourceName || 'N/A'}</td><td>${t.remarks}</td>
                         <td><button class="action-btn edit-btn" onclick="openFormPopup('expense', '${t.id}')">Edit</button><button class="action-btn delete-btn" onclick="deleteTransaction('${t.id}')">Delete</button></td>`;
    });
    checkTransactionVisibility(); // Checks visibility based on filtered data for the current month
}

// --- Credit Card CRUD --- (Remains global)
function handleAddCard(e) {
    e.preventDefault();
    const nameInput = document.getElementById("cardNameInput"), limitInput = document.getElementById("cardLimitInput"), outstandingInput = document.getElementById("cardInitialOutstandingInput");
    const newName = nameInput.value.trim(), newLimit = parseFloat(limitInput.value), newOutstanding = parseFloat(outstandingInput.value);
    if (!newName || isNaN(newLimit) || newLimit < 0 || isNaN(newOutstanding) || newOutstanding < 0) { alert("Invalid card details."); return; }
    if (newOutstanding > newLimit) { alert("Outstanding cannot exceed limit."); return; }
    if (editingCardId) {
        const card = creditCards.find(c => c.id === editingCardId);
        if (!card) { alert("Card not found for editing."); closeFormPopup(); return; }
        if (newName.toLowerCase() !== card.name.toLowerCase() && creditCards.some(c => c.id !== editingCardId && c.name.toLowerCase() === newName.toLowerCase())) { alert("Card name already exists."); return; }
        card.name = newName; card.limit = newLimit; card.outstanding = newOutstanding;
    } else {
        if (creditCards.find(c => c.name.toLowerCase() === newName.toLowerCase())) { alert("Card name already exists."); return; }
        creditCards.push({ id: generateId(), name: newName, limit: newLimit, outstanding: newOutstanding });
    }
    updateAffectedUI('card'); e.target.reset(); closeFormPopup(); saveData();
}
function prepareEditCard(id) {
    const card = creditCards.find(c => c.id === id); if (!card) { alert("Card not found."); return; }
    originalCardForEdit = JSON.parse(JSON.stringify(card)); editingCardId = id;
    cardFormPopupEl.querySelector('h3').textContent = 'Edit Credit Card';
    cardFormPopupEl.querySelector('button[type="submit"]').textContent = 'Update Card';
    document.getElementById("cardNameInput").value = card.name;
    document.getElementById("cardLimitInput").value = card.limit;
    document.getElementById("cardInitialOutstandingInput").value = card.outstanding;
}
function deleteCard(id) {
    const cardToDelete = creditCards.find(c => c.id === id); if(!cardToDelete) { alert("Card not found."); return; }
    const associatedTransactions = transactions.filter(t => t.paymentMethod === "CreditCard" && t.paymentSourceId === id);
    if (associatedTransactions.length > 0) { if (!confirm(`WARNING: Card "${cardToDelete.name}" has associated transactions. Deleting may orphan records. Continue?`)) return;
    } else { if (!confirm(`Delete credit card "${cardToDelete.name}"?`)) return; }
    creditCards = creditCards.filter(c => c.id !== id);
    transactions.forEach(t => { if(t.paymentMethod === "CreditCard" && t.paymentSourceId === id) t.paymentSourceName = `${cardToDelete.name} (Deleted)`; });
    updateAffectedUI('card'); saveData();
}
function renderCreditCards() {
    const tb = document.getElementById("cardTableBody"); if (!tb) return; tb.innerHTML = "";
    creditCards.forEach(c => {
        const av = c.limit - c.outstanding; const r = tb.insertRow();
        r.innerHTML = `<td>${c.name}</td><td>₹${c.limit.toFixed(2)}</td><td>₹${c.outstanding.toFixed(2)}</td><td>₹${av.toFixed(2)}</td>
                           <td><button class="action-btn edit-btn" onclick="openFormPopup('creditcard', '${c.id}')">Edit</button><button class="action-btn delete-btn" onclick="deleteCard('${c.id}')">Delete</button></td>`;
    }); checkCreditCardsVisibility();
}

// --- Loan Details CRUD --- (Remains global)
function handleAddLoanDetails(e) {
    e.preventDefault();
    const lenderName = document.getElementById("loanLenderName").value.trim(), totalAmount = parseFloat(document.getElementById("loanTotalAmount").value), interestRate = parseFloat(document.getElementById("loanInterestRate").value) || 0, emiAmount = parseFloat(document.getElementById("loanEmiAmount").value), totalEmis = parseInt(document.getElementById("loanTotalEmis").value), emisPaid = parseInt(document.getElementById("loanEmisPaid").value);
    if (!lenderName || isNaN(totalAmount) || totalAmount <= 0) { alert("Lender Name & Total Loan Amount required."); return; }
    if (isNaN(emiAmount) || emiAmount <= 0 || isNaN(totalEmis) || totalEmis <= 0 || isNaN(emisPaid) || emisPaid < 0) { alert("Valid EMI details required."); return; }
    if (emisPaid > totalEmis) { alert("EMIs Paid cannot exceed Total EMIs."); return; }
    const amountPaidSoFar = emiAmount * emisPaid;
    if (editingLoanId) {
        const loanIndex = loanDetails.findIndex(l => l.id === editingLoanId);
        if (loanIndex === -1) { alert("Loan not found."); closeFormPopup(); return; }
        loanDetails[loanIndex] = { id: editingLoanId, lenderName, totalAmount, interestRate, emiAmount, totalEmis, emisPaid, amountPaidSoFar };
    } else {
        loanDetails.push({ id: generateId(), lenderName, totalAmount, interestRate, emiAmount, totalEmis, emisPaid, amountPaidSoFar });
    }
    updateAffectedUI('loan'); e.target.reset(); closeFormPopup(); saveData();
}
function prepareEditLoan(id) {
    const loan = loanDetails.find(l => l.id === id); if (!loan) { alert("Loan not found."); return; }
    originalLoanForEdit = JSON.parse(JSON.stringify(loan)); editingLoanId = id;
    loanDetailsFormPopupEl.querySelector('h3').textContent = 'Edit Loan Details';
    loanDetailsFormPopupEl.querySelector('button[type="submit"]').textContent = 'Update Loan';
    document.getElementById("loanLenderName").value = loan.lenderName; document.getElementById("loanTotalAmount").value = loan.totalAmount;
    document.getElementById("loanInterestRate").value = loan.interestRate; document.getElementById("loanEmiAmount").value = loan.emiAmount;
    document.getElementById("loanTotalEmis").value = loan.totalEmis; document.getElementById("loanEmisPaid").value = loan.emisPaid;
}
function deleteLoan(id) { if (!confirm("Delete this loan record?")) return; loanDetails = loanDetails.filter(l => l.id !== id); updateAffectedUI('loan'); saveData(); }
function renderLoanDetails() {
    const cardCont = document.getElementById("loanCardContainer"); if (!cardCont) return; cardCont.innerHTML = "";
    if (loanDetails.length === 0) { checkLoanDetailsVisibility(); return; }
    loanDetails.forEach(d => {
        const amtPd = d.emiAmount * d.emisPaid, remAmt = d.totalAmount - amtPd, emisPend = d.totalEmis - d.emisPaid;
        const card = document.createElement('div'); card.className = 'loan-card';
        card.innerHTML = `<h4 onclick="showLoanDetailPopup('${d.id}')">${d.lenderName}</h4><p onclick="showLoanDetailPopup('${d.id}')" class="loan-remaining"><strong>Pending: ₹${remAmt.toFixed(2)}</strong></p><p onclick="showLoanDetailPopup('${d.id}')">EMI: ₹${d.emiAmount.toFixed(2)}</p><p onclick="showLoanDetailPopup('${d.id}')">EMIs Left: ${emisPend >= 0 ? emisPend : 0}/${d.totalEmis}</p><div class="action-buttons-container"><button class="action-btn edit-btn" onclick="openFormPopup('loanDetails', '${d.id}')">Edit</button><button class="action-btn delete-btn" onclick="deleteLoan('${d.id}')">Delete</button></div>`;
        cardCont.appendChild(card);
    }); checkLoanDetailsVisibility();
}
function showLoanDetailPopup(loanId) { const loan = loanDetails.find(l => l.id === loanId); if (!loan || !loanDetailPopupEl || !loanDetailPopupContentEl || !formPopupOverlayEl) return; const amtPd = loan.emiAmount * loan.emisPaid, remAmt = loan.totalAmount - amtPd, emisPend = loan.totalEmis - loan.emisPaid; document.getElementById('loanDetailPopupTitle').textContent = `Details: ${loan.lenderName}`; loanDetailPopupContentEl.innerHTML = `<p><strong>Lender:</strong> ${loan.lenderName}</p><p><strong>Total Loan:</strong> ₹${loan.totalAmount.toFixed(2)}</p><p><strong>EMI Amount:</strong> ₹${loan.emiAmount.toFixed(2)}</p><p><strong>Total EMIs:</strong> ${loan.totalEmis}</p><p><strong>EMIs Paid:</strong> ${loan.emisPaid}</p><p><strong>EMIs Pending:</strong> ${emisPend >= 0 ? emisPend : 0}</p><p class="loan-paid"><strong>Amount Paid:</strong> ₹${amtPd.toFixed(2)}</p><p class="loan-remaining"><strong>Amount Pending:</strong> ₹${remAmt.toFixed(2)}</p><p><strong>Interest Rate:</strong> ${loan.interestRate > 0 ? loan.interestRate.toFixed(2) + '%' : 'N/A'}</p>`;[fabActionSelectPopupEl, addAccountFormPopupEl, expenseFormPopupEl, incomeFormPopupEl, budgetFormPopupEl, cardFormPopupEl, loanDetailsFormPopupEl].forEach(el => el?.classList.add('hidden')); loanDetailPopupEl.classList.remove('hidden'); formPopupOverlayEl.style.display = 'flex'; }

// --- Budget Planner CRUD --- (Targets are global, "Spent" is per selected month)
function handleAddBudget(e) {
    e.preventDefault();
    const catInput = document.getElementById("budgetCategory"), subCatSelect = document.getElementById("budgetSubcategorySelect"), subCatOtherInput = document.getElementById("budgetSubcategoryOtherInput"), amountInput = document.getElementById("budgetAmount");
    const newCategory = catInput.value; let newSubcategory = subCatSelect.value === "_other_" ? subCatOtherInput.value.trim() : subCatSelect.value; const newAmount = parseFloat(amountInput.value);
    if (!newCategory || !newSubcategory || isNaN(newAmount) || newAmount <= 0) { alert("Invalid budget details."); return; }
    if (editingBudgetKey) {
        const oldCategory = editingBudgetKey.category; const oldSubcategory = editingBudgetKey.subcategory;
        if (oldCategory !== newCategory || oldSubcategory !== newSubcategory) {
            if (budgets[oldCategory] && budgets[oldCategory][oldSubcategory] !== undefined) {
                delete budgets[oldCategory][oldSubcategory]; if (Object.keys(budgets[oldCategory]).length === 0) delete budgets[oldCategory];
            }
        }
    }
    if (!budgets[newCategory]) budgets[newCategory] = {}; budgets[newCategory][newSubcategory] = newAmount;
    updateAffectedUI('budget'); e.target.reset(); updateBudgetSubcategoryOptions(); document.getElementById('budgetSubcategoryOtherInput').classList.add('hidden'); closeFormPopup(); saveData();
}
function prepareEditBudget(category, subcategory) {
    if (!budgets[category] || budgets[category][subcategory] === undefined) { alert("Budget item not found."); return; }
    editingBudgetKey = { category, subcategory }; originalBudgetForEdit = { category, subcategory, amount: budgets[category][subcategory] };
    budgetFormPopupEl.querySelector('h3').textContent = 'Edit Budget Item'; budgetFormPopupEl.querySelector('button[type="submit"]').textContent = 'Update Budget';
    document.getElementById("budgetCategory").value = category; updateBudgetSubcategoryOptions();
    const subCatSelect = document.getElementById("budgetSubcategorySelect"), otherSubIn = document.getElementById("budgetSubcategoryOtherInput");
    let foundInSelect = Array.from(subCatSelect.options).some(opt => opt.value === subcategory);
    if (foundInSelect) { subCatSelect.value = subcategory; otherSubIn.classList.add('hidden'); otherSubIn.value = ''; otherSubIn.required = false;
    } else { subCatSelect.value = "_other_"; otherSubIn.classList.remove('hidden'); otherSubIn.value = subcategory; otherSubIn.required = true; }
    document.getElementById("budgetAmount").value = budgets[category][subcategory];
}
function deleteBudget(category, subcategory) {
    if (!confirm(`Delete budget for ${subcategory} in ${category}?`)) return;
    if (budgets[category] && budgets[category][subcategory] !== undefined) {
        delete budgets[category][subcategory]; if (Object.keys(budgets[category]).length === 0) delete budgets[category];
        updateAffectedUI('budget'); saveData();
    }
}

function renderBudgets() {
    const tb = document.getElementById("budgetTableBody"); if (!tb) return; tb.innerHTML = "";

    const sortedCats = Object.keys(budgets).sort();
    for (const cat of sortedCats) {
        const sortedSubcats = Object.keys(budgets[cat] || {}).sort();
        for (const sub of sortedSubcats) {
            if(!budgets[cat][sub] && budgets[cat][sub] !== 0) continue;
            const target = budgets[cat][sub] || 0;

            // Calculate spent for THIS budget item in the selectedViewMonth/Year
            const spent = transactions
                .filter(t => {
                    const transDate = new Date(t.date);
                    return t.category === cat && t.subcategory === sub &&
                           transDate.getFullYear() === selectedViewYear &&
                           transDate.getMonth() === selectedViewMonth;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const rem = target - spent;
            const prog = target > 0 ? Math.min(spent / target * 100, 1000) : (spent > 0 ? 101 : 0);
            const dp = Math.min(prog, 100);
            const catIcon = getCategoryIcon(cat);
            const r = tb.insertRow();
            r.innerHTML = `<td>${catIcon} ${cat}</td><td>${sub}</td><td>₹${target.toFixed(2)}</td><td>₹${spent.toFixed(2)}</td><td style="color:${rem < 0 ? 'var(--amount-expense-color)' : 'var(--amount-income-color)'};">₹${rem.toFixed(2)}</td><td><div class=progress-bar style=height:15px;><div class=progress-fill style="width:${dp.toFixed(2)}%;height:100%;background:${prog > 100 ? 'var(--progress-fill-bad)' : (prog >= 75 ? 'var(--progress-fill-warn)' : 'var(--progress-fill-good)')};"></div></div>(${prog.toFixed(0)}%)</td>
                               <td><button class="action-btn edit-btn" onclick="openFormPopup('budget', '${cat}', '${sub}')">Edit</button><button class="action-btn delete-btn" onclick="deleteBudget('${cat}', '${sub}')">Delete</button></td>`;
        }
    } checkBudgetVisibility();
}

// --- Charting & Dashboard Updates ---
function populateAccountDropdowns() {
    const incomeAccountSelectEl = document.getElementById("incomeAccountSelect");
    if (incomeAccountSelectEl) {
        const currentValue = incomeAccountSelectEl.value;
        incomeAccountSelectEl.innerHTML = `<option value="">Account to Credit</option>`;
        bankAccounts.forEach(a => incomeAccountSelectEl.innerHTML += `<option value="${a.id}">${a.name} (₹${a.balance.toFixed(2)})</option>`);
        if (bankAccounts.some(a => a.id === currentValue)) incomeAccountSelectEl.value = currentValue; else incomeAccountSelectEl.value = "";
    }
}

function updatePaymentSourceDropdown() {
    const methodSelect = document.getElementById("paymentMethodInput");
    const sourceWrapper = document.getElementById("paymentSourceWrapper");
    const sourceSelect = document.getElementById("paymentSourceInput");

    if (!methodSelect || !sourceWrapper || !sourceSelect) return;

    const selectedMethod = methodSelect.value;
    const currentSourceValue = sourceSelect.value;

    sourceSelect.innerHTML = '<option value="">Source</option>';

    if (selectedMethod === "BankAccount") {
        sourceWrapper.classList.remove('hidden');
        sourceSelect.required = true;
        if (bankAccounts.length === 0) {
             sourceSelect.innerHTML += '<option value="" disabled>No bank accounts added</option>';
        }
        bankAccounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.id;
            option.textContent = `${acc.name} (Balance: ₹${acc.balance.toFixed(2)})`;
            sourceSelect.appendChild(option);
        });
        if (bankAccounts.some(acc => acc.id === currentSourceValue)) {
            sourceSelect.value = currentSourceValue;
        } else {
            sourceSelect.value = "";
        }
    } else if (selectedMethod === "CreditCard") {
        sourceWrapper.classList.remove('hidden');
        sourceSelect.required = true;
        if (creditCards.length === 0) {
             sourceSelect.innerHTML += '<option value="" disabled>No credit cards added</option>';
        }
        creditCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `${card.name} (Available: ₹${(card.limit - card.outstanding).toFixed(2)})`;
            sourceSelect.appendChild(option);
        });
        if (creditCards.some(card => card.id === currentSourceValue)) {
            sourceSelect.value = currentSourceValue;
        } else {
            sourceSelect.value = "";
        }
    } else {
        sourceWrapper.classList.add('hidden');
        sourceSelect.required = false;
        sourceSelect.value = "";
    }
}

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

function processMonthlyDataForChart() { // Now uses selectedViewMonth/Year
    const daysInSelectedMonth = getDaysInMonth(selectedViewYear, selectedViewMonth);
    const labels = [];
    const incomeByDay = new Array(daysInSelectedMonth).fill(0);
    const expensesByDay = new Array(daysInSelectedMonth).fill(0);
    const selectedMonthShortName = MONTH_NAMES_FULL[selectedViewMonth].substring(0,3);

    for (let day = 1; day <= daysInSelectedMonth; day++) {
        labels.push(`${day}/${selectedMonthShortName}`);
    }

    incomeLog.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate.getFullYear() === selectedViewYear && logDate.getMonth() === selectedViewMonth) {
            incomeByDay[logDate.getDate() - 1] += log.amount;
        }
    });
    transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (transDate.getFullYear() === selectedViewYear && transDate.getMonth() === selectedViewMonth) {
            expensesByDay[transDate.getDate() - 1] += t.amount;
        }
    });
    return { labels, incomeDataset: incomeByDay, expensesDataset: expensesByDay };
}

function renderMonthlyChart(){
    const{labels,incomeDataset,expensesDataset}=processMonthlyDataForChart();
    const ctx=document.getElementById('monthlyChart')?.getContext('2d');
    if(!ctx) return;
    const chartContainer = ctx.canvas.parentElement;

    const noDataForChart = incomeDataset.every(d => d===0) && expensesDataset.every(d => d===0);

    if(noDataForChart && monthlyChartInstance){
         monthlyChartInstance.destroy(); monthlyChartInstance = null;
    }

    if(noDataForChart){
        if(chartContainer) chartContainer.style.display = 'none';
        return;
    }

    if(chartContainer) chartContainer.style.display = 'block';

    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const ticksColor = isDarkMode ? '#ccc' : '#666';
    const legendColor = isDarkMode ? '#eee' : '#333';

    const chartData = {
        labels:labels,
        datasets:[
            { label:'Income', data:incomeDataset, type: 'bar', backgroundColor:'rgba(75, 192, 192, 0.6)', borderColor:'rgba(75, 192, 192, 1)', borderWidth: 1 },
            { label:'Expenses', data:expensesDataset, type: 'bar', backgroundColor:'rgba(255, 99, 132, 0.6)', borderColor:'rgba(255, 99, 132, 1)', borderWidth: 1 }
        ]
    };
    const chartOptions = {
        responsive:true, maintainAspectRatio:false,
        scales:{
            y:{ display: true, beginAtZero:true, ticks: { font: { size: 9 }, callback: function(value) { return '₹' + value; }, color: ticksColor }, grid: { color: gridColor, borderColor: gridColor } },
            x: { display: true, ticks: { font: {size: 9}, maxRotation: 70, minRotation: 45, autoSkip: true, maxTicksLimit: labels.length > 15 ? 15 : Math.max(1, labels.length), color: ticksColor }, grid: { color: gridColor, borderColor: gridColor } }
        },
        plugins:{
            tooltip:{ enabled: true, mode: 'index', intersect: false, callbacks:{ label:function(c){ let l=c.dataset.label||''; if(l)l+=': '; if(c.parsed.y!==null)l+='₹'+c.parsed.y.toFixed(2); return l;}}},
            legend: { display: true, position: 'top', labels: { font: {size: 10}, boxWidth: 12, padding: 10, color: legendColor }}
        },
        layout: { padding: {top: 5, bottom: 5, left: 5, right: 5} }
    };

    if (monthlyChartInstance) {
        monthlyChartInstance.data = chartData;
        monthlyChartInstance.options = chartOptions;
        monthlyChartInstance.update();
    } else {
        monthlyChartInstance=new Chart(ctx,{ data: chartData, options: chartOptions});
    }
}

function renderRecentTransactionsDashboard() { // This shows latest 10 overall, not tied to selectedViewMonth/Year
     if (!recentTransactionsListEl || !noRecentActivityMessageEl) return; let combinedActivity = [];
     transactions.forEach(t => combinedActivity.push({ originalDate: new Date(t.date), date: t.date, description: t.subcategory || t.remarks || 'Expense', amount: t.amount, type: 'expense', category: t.category }));
     incomeLog.forEach(i => combinedActivity.push({ originalDate: new Date(i.date), date: i.date, description: i.source || 'Income', amount: i.amount, type: 'income', category: 'Income' }));
     combinedActivity.sort((a, b) => b.originalDate - a.originalDate);
     let filteredActivity = combinedActivity;
     if (activeRecentActivityFilter === 'expenses') { filteredActivity = combinedActivity.filter(item => item.type === 'expense'); }
     else if (activeRecentActivityFilter === 'income') { filteredActivity = combinedActivity.filter(item => item.type === 'income'); }
     const recentItems = filteredActivity.slice(0, MAX_RECENT_ITEMS); recentTransactionsListEl.innerHTML = '';
     if (recentItems.length === 0) { noRecentActivityMessageEl.classList.remove('hidden'); recentTransactionsListEl.classList.add('hidden'); }
     else { noRecentActivityMessageEl.classList.add('hidden'); recentTransactionsListEl.classList.remove('hidden');
        recentItems.forEach(item => {
            const itemDiv = document.createElement('div'); itemDiv.className = 'recent-transaction-item';
            const sign = item.type === 'expense' ? '-' : '+';
            const amountClass = item.type === 'expense' ? 'amount-expense' : 'amount-income';
            const displayDate = item.originalDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            itemDiv.innerHTML = `<div class="recent-transaction-info"><span class="recent-transaction-type">${item.type} ${item.type === 'expense' ? '('+item.category+')' : ''}</span><span class="recent-transaction-date">${displayDate}</span><span class="recent-transaction-desc">${item.description}</span></div><div class="recent-transaction-amount ${amountClass}">${sign}₹${item.amount.toFixed(2)}</div>`; recentTransactionsListEl.appendChild(itemDiv); });
    }
}
function updateDashboard() {
    // Dashboard summary boxes show GLOBAL all-time totals
    const g = (i) => document.getElementById(i); const totalIncomeVal = totalIncomeLogged.toFixed(2); const totalIncomeEl = g("totalIncomeDisplay"); if (totalIncomeEl) { totalIncomeEl.innerText = `₹${totalIncomeVal}`; totalIncomeEl.className = 'amount-income'; } const totalExpensesVal = totalExpenses.toFixed(2); const totalExpensesEl = g("totalExpenses"); if (totalExpensesEl) { totalExpensesEl.innerText = `-₹${totalExpensesVal}`; totalExpensesEl.className = 'amount-expense'; } const totalBankBalanceEl = g("totalBankBalance"); if (totalBankBalanceEl) { totalBankBalanceEl.innerText = `₹${bankAccounts.reduce((sm, a) => sm + a.balance, 0).toFixed(2)}`; totalBankBalanceEl.className = ''; }

    // Dashboard category progress bars show GLOBAL all-time expensesByCategory vs GLOBAL budgets
    ['Need', 'Want', 'Savings'].forEach(cat => { const k = cat.toLowerCase(); const totalCatEl = g(k + "Total"); if (totalCatEl) totalCatEl.innerText = (expensesByCategory[cat] || 0).toFixed(2); const pE = g(k + "Progress"); if (pE) { let bdg = 0; if (budgets[cat]) bdg = Object.values(budgets[cat] || {}).reduce((sm, b) => sm + (b || 0), 0); const sp = expensesByCategory[cat] || 0, pc = bdg > 0 ? sp / bdg * 100 : (sp > 0 ? 101 : 0); pE.style.width = `${Math.min(pc, 100)}%`; pE.style.backgroundColor = pc > 100 ? 'var(--progress-fill-bad)' : (pc >= 75 ? 'var(--progress-fill-warn)' : 'var(--progress-fill-good)'); } });

    renderMonthlyChart(); // Dashboard chart reflects selectedViewMonth/Year
    renderRecentTransactionsDashboard(); // Global recent activity
}

// --- Settings Functions ---
function applyThemeColor(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--primary-color', color);
    const darkerColor = shadeColor(color, -20);
    const hoverColor = shadeColor(color, -10);
    document.documentElement.style.setProperty('--primary-color-darker', darkerColor);
    document.documentElement.style.setProperty('--primary-color-hover', hoverColor);

    const rgb = hexToRgb(color);
    if (rgb) {
        document.documentElement.style.setProperty('--rgb-primary-color', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    currentThemeColor = color;
    if (customThemeColorPickerEl) customThemeColorPickerEl.value = color;
    updateActiveColorSwatch(color);
    if (monthlyChartInstance) { // Always re-render chart on theme change if it exists
        renderMonthlyChart();
    }
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);
    R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
    R = Math.max(0, R); G = Math.max(0, G); B = Math.max(0, B);
    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
    return "#"+RR+GG+BB;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function populateThemeColorSwatches() {
    if (!themeColorOptionsContainerEl) return;
    themeColorOptionsContainerEl.innerHTML = '';
    PREDEFINED_THEME_COLORS.forEach(colorObj => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = colorObj.value;
        swatch.dataset.color = colorObj.value;
        swatch.title = colorObj.name;
        swatch.setAttribute('aria-label', `Set theme to ${colorObj.name}`);
        swatch.setAttribute('role', 'button');
        swatch.addEventListener('click', () => {
            applyThemeColor(colorObj.value);
            saveData();
        });
        themeColorOptionsContainerEl.appendChild(swatch);
    });
    updateActiveColorSwatch(currentThemeColor);
}

function updateActiveColorSwatch(activeColor) {
    if (!themeColorOptionsContainerEl) return;
    themeColorOptionsContainerEl.querySelectorAll('.color-swatch').forEach(sw => {
        sw.classList.toggle('active-color', sw.dataset.color === activeColor);
    });
}

function toggleDarkMode(forceState) {
    isDarkMode = typeof forceState === 'boolean' ? forceState : !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    if (darkModeToggleEl) {
         darkModeToggleEl.classList.toggle('active', isDarkMode);
         darkModeToggleEl.setAttribute('aria-pressed', isDarkMode.toString());
    }
    if (monthlyChartInstance) { // Always re-render chart on dark mode change if it exists
        renderMonthlyChart();
    }
}

function exportData() {
    const dataToExport = {
        bankAccounts, creditCards, transactions, incomeLog, budgets, loanDetails,
        totalIncomeLogged, totalExpenses, expensesByCategory, // Global totals
        settings: { themeColor: currentThemeColor, darkMode: isDarkMode },
        selectedView: { month: selectedViewMonth, year: selectedViewYear } // Include selected view
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;
    a.download = `finance_tracker_data_${dateString}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    alert('Data exported successfully!');
}

function resetAllData() {
    if (confirm('ARE YOU SURE you want to reset all financial data? This action cannot be undone. App settings (theme, dark mode, viewed month) will be preserved.')) {
        if (confirm('LAST WARNING: This will delete all accounts, transactions, budgets, etc. Are you absolutely sure?')) {
            localStorage.removeItem('pfaBankAccounts'); localStorage.removeItem('pfaCreditCards');
            localStorage.removeItem('pfaTransactions'); localStorage.removeItem('pfaIncomeLog');
            localStorage.removeItem('pfaBudgets'); localStorage.removeItem('pfaLoanDetails');
            localStorage.removeItem('pfaTotalIncomeLogged'); localStorage.removeItem('pfaTotalExpenses');
            localStorage.removeItem('pfaExpensesByCategory');

            bankAccounts = []; creditCards = []; transactions = []; incomeLog = []; budgets = {}; loanDetails = [];
            totalIncomeLogged = 0; totalExpenses = 0;
            expensesByCategory = { Need: 0, Want: 0, Savings: 0 };

            // Don't reset selectedViewMonth/Year or theme/darkmode here, only financial data
            renderAllUI(); updateDashboard();
            alert('All financial data has been reset. App settings are preserved.');
            showTab(null, 'dashboard');
        }
    }
}

// --- Data Persistence ---
function saveData() {
    localStorage.setItem('pfaBankAccounts', JSON.stringify(bankAccounts));
    localStorage.setItem('pfaCreditCards', JSON.stringify(creditCards));
    localStorage.setItem('pfaTransactions', JSON.stringify(transactions));
    localStorage.setItem('pfaIncomeLog', JSON.stringify(incomeLog));
    localStorage.setItem('pfaBudgets', JSON.stringify(budgets));
    localStorage.setItem('pfaLoanDetails', JSON.stringify(loanDetails));
    localStorage.setItem('pfaTotalIncomeLogged', totalIncomeLogged.toString());
    localStorage.setItem('pfaTotalExpenses', totalExpenses.toString());
    localStorage.setItem('pfaExpensesByCategory', JSON.stringify(expensesByCategory));

    const settings = { themeColor: currentThemeColor, darkMode: isDarkMode };
    localStorage.setItem('pfaSettings', JSON.stringify(settings));
    localStorage.setItem('pfaSelectedViewDate', JSON.stringify({month: selectedViewMonth, year: selectedViewYear}));
 }

function loadData() {
    bankAccounts = JSON.parse(localStorage.getItem('pfaBankAccounts')) || [];
    creditCards = JSON.parse(localStorage.getItem('pfaCreditCards')) || [];
    transactions = JSON.parse(localStorage.getItem('pfaTransactions')) || [];
    incomeLog = JSON.parse(localStorage.getItem('pfaIncomeLog')) || [];
    budgets = JSON.parse(localStorage.getItem('pfaBudgets')) || {};
    loanDetails = JSON.parse(localStorage.getItem('pfaLoanDetails')) || [];
    totalIncomeLogged = parseFloat(localStorage.getItem('pfaTotalIncomeLogged')) || 0;
    totalExpenses = parseFloat(localStorage.getItem('pfaTotalExpenses')) || 0;

    const storedExpensesByCat = JSON.parse(localStorage.getItem('pfaExpensesByCategory'));
    expensesByCategory = storedExpensesByCat && Object.keys(storedExpensesByCat).length > 0 ?
                         storedExpensesByCat :
                         { Need: 0, Want: 0, Savings: 0 };

    const savedSettings = JSON.parse(localStorage.getItem('pfaSettings'));
    if (savedSettings) {
        currentThemeColor = savedSettings.themeColor || '#007bff';
        isDarkMode = savedSettings.darkMode || false;
    } else {
        currentThemeColor = '#007bff';
        isDarkMode = false;
    }
    applyThemeColor(currentThemeColor);
    toggleDarkMode(isDarkMode);

    const savedViewDate = JSON.parse(localStorage.getItem('pfaSelectedViewDate'));
    if (savedViewDate && typeof savedViewDate.month === 'number' && typeof savedViewDate.year === 'number') {
        selectedViewMonth = savedViewDate.month;
        selectedViewYear = savedViewDate.year;
    } else {
        selectedViewMonth = new Date().getMonth();
        selectedViewYear = new Date().getFullYear();
    }
 }
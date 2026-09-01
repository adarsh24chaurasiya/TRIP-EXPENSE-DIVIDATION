const TripState = {
  tripName: 'Group Trip Expenses',
  currency: '₹',
  members: [],
  expenses: [],
  settledPayments: [],
  memberColors: ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'],

  save: function() {
    const payload = {
      tripName: this.tripName,
      currency: this.currency,
      members: this.members,
      expenses: this.expenses,
      settledPayments: this.settledPayments
    };
    localStorage.setItem('tripsplit_data', JSON.stringify(payload));
  },

  load: function() {
    const raw = localStorage.getItem('tripsplit_data');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed) {
          this.tripName = parsed.tripName || 'Group Trip Expense';
          this.currency = parsed.currency || '₹';
          this.members = Array.isArray(parsed.members) ? parsed.members : [];
          this.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
          this.settledPayments = Array.isArray(parsed.settledPayments) ? parsed.settledPayments : [];
        }
      } catch (e) {}
    } else {
      this.tripName = 'Group Trip Expense';
      this.members = [];
      this.expenses = [];
      this.settledPayments = [];
    }
  },

  resetData: function() {
    this.members = [];
    this.expenses = [];
    this.settledPayments = [];
    this.tripName = 'Group Trip Expense';
    this.save();
  }
};

const TripApp = {
  init: function() {
    TripState.load();
    this.bindEvents();
    this.renderAll();
    this.resetExpenseForm();
  },

  bindEvents: function() {
    const self = this;

    const currencySelect = document.getElementById('currencySelect');
    currencySelect.value = TripState.currency || '₹';
    currencySelect.addEventListener('change', () => {
      TripState.currency = currencySelect.value;
      TripState.save();
      self.renderAll();
      self.showToast('Currency updated!');
    });

    document.getElementById('btnEditTripDetails').addEventListener('click', () => {
      document.getElementById('editTripNameInput').value = TripState.tripName;
      self.openModal('modalEditTripDialog');
    });

    document.getElementById('formEditTrip').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('editTripNameInput').value.trim();
      if (!val) return;
      TripState.tripName = val;
      TripState.save();
      self.closeModal('modalEditTripDialog');
      self.renderTripHeader();
      self.showToast('Trip renamed successfully!');
    });

    document.getElementById('btnResetAll').addEventListener('click', () => {
      self.openModal('modalResetConfirmDialog');
    });

    document.getElementById('btnConfirmResetAction').addEventListener('click', () => {
      TripState.resetData();
      self.closeModal('modalResetConfirmDialog');
      self.resetExpenseForm();
      self.renderAll();
      self.showToast('All trip data has been reset!');
    });

    document.getElementById('btnOpenAddMember').addEventListener('click', () => {
      document.getElementById('newMemberName').value = '';
      self.openModal('modalAddMemberDialog');
    });

    document.getElementById('formAddMember').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newMemberName').value.trim();
      if (!name) return;
      const color = TripState.memberColors[TripState.members.length % TripState.memberColors.length];
      const member = {
        id: 'mem-' + Date.now(),
        name: name,
        color: color
      };
      TripState.members.push(member);
      TripState.save();
      self.closeModal('modalAddMemberDialog');
      self.renderAll();
      self.showToast(`Added ${name}!`);
    });

    document.getElementById('tabPendingSettlements').addEventListener('click', () => {
      document.getElementById('tabPendingSettlements').classList.add('active');
      document.getElementById('tabPaidSettlements').classList.remove('active');
      document.getElementById('pendingSettlementsView').classList.remove('hidden');
      document.getElementById('paidSettlementsView').classList.add('hidden');
    });

    document.getElementById('tabPaidSettlements').addEventListener('click', () => {
      document.getElementById('tabPaidSettlements').classList.add('active');
      document.getElementById('tabPendingSettlements').classList.remove('active');
      document.getElementById('paidSettlementsView').classList.remove('hidden');
      document.getElementById('pendingSettlementsView').classList.add('hidden');
    });

    document.getElementById('formAddExpense').addEventListener('submit', (e) => {
      e.preventDefault();
      if (TripState.members.length === 0) {
        self.showToast('Please add trip members first!');
        self.openModal('modalAddMemberDialog');
        return;
      }

      const payerId = document.getElementById('payerSelect').value;
      if (!payerId) {
        self.showToast('Please select who paid!');
        return;
      }

      const editId = document.getElementById('editExpenseId').value;
      const title = document.getElementById('expenseTitleInput').value.trim();
      const amount = parseFloat(document.getElementById('expenseAmountInput').value);
      const date = document.getElementById('expenseDateInput').value;

      if (editId) {
        const exp = TripState.expenses.find(x => x.id === editId);
        if (exp) {
          exp.payerId = payerId;
          exp.title = title;
          exp.amount = amount;
          exp.date = date;
        }
        self.resetExpenseForm();
        self.showToast('Expense updated!');
      } else {
        TripState.expenses.unshift({
          id: 'exp-' + Date.now(),
          payerId: payerId,
          title: title,
          amount: amount,
          date: date
        });
        self.resetExpenseForm();
        self.showToast('Expense added!');
      }

      TripState.save();
      self.renderAll();
    });

    document.getElementById('btnCancelEdit').addEventListener('click', () => {
      self.resetExpenseForm();
    });

    document.getElementById('filterExpensesInput').addEventListener('input', () => {
      self.renderExpenseHistory();
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });
  },

  openModal: function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },

  closeModal: function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },

  showToast: function(msg) {
    const box = document.getElementById('toastMessageContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = msg;
    box.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  },

  resetExpenseForm: function() {
    document.getElementById('formAddExpense').reset();
    document.getElementById('editExpenseId').value = '';
    document.getElementById('formExpenseHeading').textContent = 'Add Expense';
    document.getElementById('btnSubmitExpenseText').textContent = '+ Save Expense';
    document.getElementById('btnCancelEdit').classList.add('hidden');
    document.getElementById('expenseDateInput').value = '';
    document.getElementById('payerSelect').selectedIndex = 0;
  },

  renderAll: function() {
    this.renderTripHeader();
    this.renderBannerStats();
    this.renderMembersBar();
    this.renderPayerDropdown();
    this.renderMemberHisabGrid();
    this.renderSettlements();
    this.renderExpenseHistory();
  },

  renderTripHeader: function() {
    document.getElementById('tripNameDisplay').textContent = TripState.tripName;
  },

  renderBannerStats: function() {
    const cur = TripState.currency || '₹';
    const totalKharcha = TripState.expenses.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
    const memberCount = TripState.members.length;
    const equalShare = memberCount > 0 ? (totalKharcha / memberCount) : 0;
    const billsCount = TripState.expenses.length;

    document.getElementById('bannerTotalExpense').textContent = cur + totalKharcha.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    document.getElementById('bannerEqualShare').textContent = cur + equalShare.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    document.getElementById('bannerTotalMembers').textContent = memberCount;
    document.getElementById('bannerTotalBills').textContent = billsCount;
    document.getElementById('badgeMembersCount').textContent = memberCount + ' Members';
  },

  renderMembersBar: function() {
    const container = document.getElementById('membersContainer');
    container.innerHTML = '';

    if (TripState.members.length === 0) {
      container.innerHTML = '<span style="color:var(--text-muted); font-size:0.86rem;">No members yet. Click <strong>"+ Add Member"</strong> to start.</span>';
      return;
    }

    TripState.members.forEach(m => {
      const chip = document.createElement('div');
      chip.className = 'member-pill';
      chip.innerHTML = `
        <div class="member-avatar" style="background:${m.color}">${m.name.charAt(0)}</div>
        <span>${m.name}</span>
        <button class="member-remove-btn" title="Remove Member">&times;</button>
      `;

      chip.querySelector('.member-remove-btn').addEventListener('click', () => {
        if (confirm(`Remove ${m.name}?`)) {
          TripState.members = TripState.members.filter(x => x.id !== m.id);
          TripState.expenses = TripState.expenses.filter(x => x.payerId !== m.id);
          TripState.settledPayments = TripState.settledPayments.filter(s => s.fromId !== m.id && s.toId !== m.id);
          TripState.save();
          TripApp.renderAll();
          TripApp.showToast(`Removed ${m.name}`);
        }
      });

      container.appendChild(chip);
    });
  },

  renderPayerDropdown: function() {
    const select = document.getElementById('payerSelect');
    const prev = select.value;
    select.innerHTML = '<option value="" disabled selected>Select who paid</option>';

    if (TripState.members.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Add members first';
      opt.disabled = true;
      select.appendChild(opt);
      return;
    }

    TripState.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      select.appendChild(opt);
    });

    if (prev && TripState.members.some(m => m.id === prev)) {
      select.value = prev;
    }
  },

  calculateNetBalances: function() {
    const totalKharcha = TripState.expenses.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
    const memberCount = TripState.members.length;
    const equalShare = memberCount > 0 ? (totalKharcha / memberCount) : 0;

    const paidMap = {};
    const settledSentMap = {};
    const settledReceivedMap = {};

    TripState.members.forEach(m => {
      paidMap[m.id] = 0;
      settledSentMap[m.id] = 0;
      settledReceivedMap[m.id] = 0;
    });

    TripState.expenses.forEach(x => {
      const amt = parseFloat(x.amount) || 0;
      if (paidMap[x.payerId] !== undefined) {
        paidMap[x.payerId] += amt;
      }
    });

    TripState.settledPayments.forEach(s => {
      const amt = parseFloat(s.amount) || 0;
      if (settledSentMap[s.fromId] !== undefined) settledSentMap[s.fromId] += amt;
      if (settledReceivedMap[s.toId] !== undefined) settledReceivedMap[s.toId] += amt;
    });

    const netMap = {};
    TripState.members.forEach(m => {
      const effectivePaid = paidMap[m.id] + settledSentMap[m.id] - settledReceivedMap[m.id];
      netMap[m.id] = effectivePaid - equalShare;
    });

    return { totalKharcha, equalShare, paidMap, settledSentMap, settledReceivedMap, netMap };
  },

  renderMemberHisabGrid: function() {
    const container = document.getElementById('memberHisabGrid');
    container.innerHTML = '';
    const cur = TripState.currency || '₹';

    if (TripState.members.length === 0) {
      container.innerHTML = '<div class="empty-state-wrap"><span>👥</span><p>Add members above to see balances.</p></div>';
      return;
    }

    const { equalShare, paidMap, netMap } = this.calculateNetBalances();

    TripState.members.forEach(m => {
      const directPaid = paidMap[m.id] || 0;
      const net = netMap[m.id] || 0;

      let pillClass = 'net-zero';
      let statusText = 'Settled (₹0)';

      if (net > 0.01) {
        pillClass = 'net-positive';
        statusText = `+${cur}${net.toFixed(0)} (Get Back)`;
      } else if (net < -0.01) {
        pillClass = 'net-negative';
        statusText = `-${cur}${Math.abs(net).toFixed(0)} (To Pay)`;
      }

      const card = document.createElement('div');
      card.className = 'balance-card';
      card.innerHTML = `
        <div class="balance-card-top">
          <div class="member-avatar" style="background:${m.color}">${m.name.charAt(0)}</div>
          <span class="balance-user-name">${m.name}</span>
        </div>
        <div class="balance-stat-row">
          <span>Spent (Paid):</span>
          <strong>${cur}${directPaid.toFixed(0)}</strong>
        </div>
        <div class="balance-stat-row">
          <span>Equal Share:</span>
          <strong>${cur}${equalShare.toFixed(0)}</strong>
        </div>
        <div class="net-status-pill ${pillClass}">
          <span>Net Balance:</span>
          <span>${statusText}</span>
        </div>
      `;
      container.appendChild(card);
    });
  },

  calculatePendingSettlements: function() {
    if (TripState.members.length < 2) return [];

    const { netMap } = this.calculateNetBalances();

    const debtors = [];
    const creditors = [];

    TripState.members.forEach(m => {
      const net = Math.round((netMap[m.id] || 0) * 100) / 100;
      if (net < -0.01) {
        debtors.push({ id: m.id, name: m.name, amount: -net });
      } else if (net > 0.01) {
        creditors.push({ id: m.id, name: m.name, amount: net });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0.01) {
        settlements.push({
          fromId: debtor.id,
          from: debtor.name,
          toId: creditor.id,
          to: creditor.name,
          amount: Math.round(settledAmount)
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.01) d++;
      if (creditor.amount < 0.01) c++;
    }

    return settlements;
  },

  renderSettlements: function() {
    const pendingContainer = document.getElementById('pendingSettlementsView');
    const paidContainer = document.getElementById('paidSettlementsView');
    pendingContainer.innerHTML = '';
    paidContainer.innerHTML = '';

    const cur = TripState.currency || '₹';
    const pendingList = this.calculatePendingSettlements();
    const paidList = TripState.settledPayments;

    document.getElementById('countPendingDues').textContent = pendingList.length;
    document.getElementById('countPaidDues').textContent = paidList.length;

    if (pendingList.length === 0) {
      pendingContainer.innerHTML = `
        <div class="empty-state-wrap">
          <span>🎉</span>
          <p>All accounts settled! Nobody owes anything.</p>
        </div>
      `;
    } else {
      pendingList.forEach(s => {
        const row = document.createElement('div');
        row.className = 'settle-row';
        row.innerHTML = `
          <div class="settle-path">
            <span class="name-debtor">${s.from}</span>
            <span class="settle-arrow">➔ pays ➔</span>
            <span class="name-creditor">${s.to}</span>
          </div>
          <div class="settle-actions">
            <span class="settle-amt-tag">${cur}${s.amount}</span>
            <button class="btn-mark-paid" title="Mark this debt as paid">Mark Paid</button>
          </div>
        `;

        row.querySelector('.btn-mark-paid').addEventListener('click', () => {
          TripApp.markSettlementAsPaid(s.fromId, s.from, s.toId, s.to, s.amount);
        });

        pendingContainer.appendChild(row);
      });
    }

    if (paidList.length === 0) {
      paidContainer.innerHTML = `
        <div class="empty-state-wrap">
          <span>📜</span>
          <p>No paid transactions yet.</p>
        </div>
      `;
    } else {
      paidList.forEach(p => {
        const row = document.createElement('div');
        row.className = 'settle-row';
        row.innerHTML = `
          <div class="settle-path">
            <span class="paid-done-tag">✓ Paid</span>
            <span class="name-debtor">${p.fromName}</span>
            <span class="settle-arrow">➔</span>
            <span class="name-creditor">${p.toName}</span>
          </div>
          <div class="settle-actions">
            <span class="settle-amt-tag">${cur}${p.amount}</span>
            <button class="btn-undo-paid" title="Undo payment">Undo</button>
          </div>
        `;

        row.querySelector('.btn-undo-paid').addEventListener('click', () => {
          TripApp.undoSettlementPayment(p.id);
        });

        paidContainer.appendChild(row);
      });
    }
  },

  markSettlementAsPaid: function(fromId, fromName, toId, toName, amount) {
    const payment = {
      id: 'settle-' + Date.now(),
      fromId: fromId,
      fromName: fromName,
      toId: toId,
      toName: toName,
      amount: amount
    };

    TripState.settledPayments.unshift(payment);
    TripState.save();
    this.renderAll();
    this.showToast(`${fromName} paid ${toName} ${TripState.currency}${amount}!`);
  },

  undoSettlementPayment: function(id) {
    TripState.settledPayments = TripState.settledPayments.filter(p => p.id !== id);
    TripState.save();
    this.renderAll();
    this.showToast('Payment restored to pending dues.');
  },

  renderExpenseHistory: function() {
    const container = document.getElementById('expenseHistoryList');
    container.innerHTML = '';
    const cur = TripState.currency || '₹';
    const query = (document.getElementById('filterExpensesInput').value || '').toLowerCase();

    let list = TripState.expenses.slice();
    if (query) {
      list = list.filter(exp => {
        const payer = TripState.members.find(m => m.id === exp.payerId);
        const payerName = payer ? payer.name.toLowerCase() : '';
        return exp.title.toLowerCase().includes(query) || payerName.includes(query);
      });
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-wrap">
          <span>🧾</span>
          <p>No expenses recorded yet.</p>
        </div>
      `;
      return;
    }

    list.forEach(exp => {
      const payer = TripState.members.find(m => m.id === exp.payerId) || { name: 'Unknown' };

      const row = document.createElement('div');
      row.className = 'ledger-row';
      row.innerHTML = `
        <div class="ledger-left">
          <span class="ledger-title">${exp.title}</span>
          <span class="ledger-sub">Paid by: <strong>${payer.name}</strong> ${exp.date ? '• ' + exp.date : ''}</span>
        </div>
        <div class="ledger-right">
          <span class="ledger-amt">${cur}${parseFloat(exp.amount).toFixed(0)}</span>
          <button class="ledger-btn edit" title="Edit Expense">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="ledger-btn delete" title="Delete Expense">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      row.querySelector('.ledger-btn.edit').addEventListener('click', () => {
        document.getElementById('editExpenseId').value = exp.id;
        document.getElementById('payerSelect').value = exp.payerId;
        document.getElementById('expenseTitleInput').value = exp.title;
        document.getElementById('expenseAmountInput').value = exp.amount;
        document.getElementById('expenseDateInput').value = exp.date || '';
        document.getElementById('formExpenseHeading').textContent = 'Edit Expense';
        document.getElementById('btnSubmitExpenseText').textContent = 'Update Expense';
        document.getElementById('btnCancelEdit').classList.remove('hidden');
        window.scrollTo({ top: 300, behavior: 'smooth' });
      });

      row.querySelector('.ledger-btn.delete').addEventListener('click', () => {
        if (confirm(`Delete "${exp.title}"?`)) {
          TripState.expenses = TripState.expenses.filter(x => x.id !== exp.id);
          TripState.save();
          TripApp.renderAll();
          TripApp.showToast(`Deleted ${exp.title}`);
        }
      });

      container.appendChild(row);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  TripApp.init();
});
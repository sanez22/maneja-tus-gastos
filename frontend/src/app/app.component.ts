import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ExpenseService } from './services/expense.service';
import { Expense } from './models/expense.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ExpenseFormComponent, ExpenseListComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="header-content">
          <h1>💰 Maneja tus Gastos</h1>
          <p>Controla tus finanzas de forma sencilla</p>
        </div>
      </header>

      <main class="main-content">
        @if (errorMsg) {
          <div class="alert alert-error">⚠️ {{ errorMsg }}</div>
        }
        @if (successMsg) {
          <div class="alert alert-success">✅ {{ successMsg }}</div>
        }

        <app-expense-form
          [editingExpense]="editingExpense"
          (save)="onSave($event)"
          (cancel)="onCancelEdit()"
        />

        @if (loading) {
          <div class="loading">⏳ Cargando gastos...</div>
        } @else {
          <app-expense-list
            [expenses]="expenses"
            (edit)="onEdit($event)"
            (delete)="onDelete($event)"
          />
        }
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .app-container { min-height: 100vh; background: #f0f4f8; }
    .app-header {
      background: linear-gradient(135deg, #2c3e50, #3498db);
      color: white; padding: 32px 24px; text-align: center;
    }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    .app-header p { opacity: 0.8; font-size: 1rem; }
    .main-content { max-width: 900px; margin: 0 auto; padding: 32px 16px; }
    .alert {
      padding: 14px 18px; border-radius: 8px;
      margin-bottom: 20px; font-weight: 600;
    }
    .alert-error { background: #fde8e8; color: #c0392b; border-left: 4px solid #e74c3c; }
    .alert-success { background: #eafbea; color: #27ae60; border-left: 4px solid #2ecc71; }
    .loading { text-align: center; padding: 40px; color: #7f8c8d; font-size: 1.1rem; }
  `],
})
export class AppComponent implements OnInit {
  expenses: Expense[] = [];
  editingExpense: Expense | null = null;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading = true;
    this.errorMsg = '';
    this.expenseService.getAll().subscribe({
      next: (data) => { this.expenses = data; this.loading = false; },
      error: () => {
        this.errorMsg = 'No se pudo conectar con el servidor.';
        this.loading = false;
      },
    });
  }

  onSave(expense: Expense): void {
    if (this.editingExpense?.id) {
      this.expenseService.update(this.editingExpense.id, expense).subscribe({
        next: () => { this.showSuccess('Gasto actualizado'); this.editingExpense = null; this.loadExpenses(); },
        error: () => this.showError('Error al actualizar el gasto'),
      });
    } else {
      this.expenseService.create(expense).subscribe({
        next: () => { this.showSuccess('Gasto creado'); this.loadExpenses(); },
        error: () => this.showError('Error al crear el gasto'),
      });
    }
  }

  onEdit(expense: Expense): void {
    this.editingExpense = { ...expense };
  }

  onCancelEdit(): void {
    this.editingExpense = null;
  }

  onDelete(id: number): void {
    if (!confirm('¿Seguro que quieres eliminar este gasto?')) return;
    this.expenseService.delete(id).subscribe({
      next: () => { this.showSuccess('Gasto eliminado'); this.loadExpenses(); },
      error: () => this.showError('Error al eliminar el gasto'),
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.errorMsg = '';
    setTimeout(() => (this.successMsg = ''), 3000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    this.successMsg = '';
    setTimeout(() => (this.errorMsg = ''), 4000);
  }
}


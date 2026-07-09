import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Expense, CATEGORIES } from '../../models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-card">
      <h2>{{ editingExpense ? 'Editar Gasto' : 'Nuevo Gasto' }}</h2>
      <form (ngSubmit)="onSubmit()" #expenseForm="ngForm">
        <div class="form-group">
          <label for="description">Descripción *</label>
          <input
            id="description"
            name="description"
            type="text"
            [(ngModel)]="form.description"
            required
            placeholder="Ej: Supermercado"
          />
        </div>
        <div class="form-group">
          <label for="amount">Monto *</label>
          <input
            id="amount"
            name="amount"
            type="number"
            [(ngModel)]="form.amount"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div class="form-group">
          <label for="category">Categoría *</label>
          <select id="category" name="category" [(ngModel)]="form.category" required>
            <option value="" disabled>Selecciona una categoría</option>
            @for (cat of categories; track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="date">Fecha *</label>
          <input
            id="date"
            name="date"
            type="date"
            [(ngModel)]="form.date"
            required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="expenseForm.invalid">
            {{ editingExpense ? '💾 Actualizar' : '➕ Agregar' }}
          </button>
          @if (editingExpense) {
            <button type="button" class="btn-secondary" (click)="onCancel()">
              ✖ Cancelar
            </button>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    h2 { margin: 0 0 20px; color: #2c3e50; font-size: 1.3rem; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #555; font-size: 0.9rem; }
    input, select {
      width: 100%; padding: 10px 12px; border: 1px solid #ddd;
      border-radius: 8px; font-size: 1rem; box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { outline: none; border-color: #3498db; }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn-primary {
      background: #3498db; color: white; border: none;
      padding: 10px 24px; border-radius: 8px; cursor: pointer;
      font-size: 1rem; font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #2980b9; }
    .btn-primary:disabled { background: #bdc3c7; cursor: not-allowed; }
    .btn-secondary {
      background: #ecf0f1; color: #555; border: none;
      padding: 10px 24px; border-radius: 8px; cursor: pointer;
      font-size: 1rem; font-weight: 600; transition: background 0.2s;
    }
    .btn-secondary:hover { background: #bdc3c7; }
  `]
})
export class ExpenseFormComponent implements OnChanges {
  @Input() editingExpense: Expense | null = null;
  @Output() save = new EventEmitter<Expense>();
  @Output() cancel = new EventEmitter<void>();

  categories = CATEGORIES;
  form: Expense = this.emptyForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingExpense'] && this.editingExpense) {
      this.form = { ...this.editingExpense };
    } else if (changes['editingExpense'] && !this.editingExpense) {
      this.form = this.emptyForm();
    }
  }

  onSubmit(): void {
    this.save.emit({ ...this.form });
    this.form = this.emptyForm();
  }

  onCancel(): void {
    this.form = this.emptyForm();
    this.cancel.emit();
  }

  private emptyForm(): Expense {
    return {
      description: '',
      amount: 0,
      category: 'Otros',
      date: new Date().toISOString().split('T')[0],
    };
  }
}


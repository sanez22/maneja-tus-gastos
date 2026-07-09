import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="list-card">
      <div class="list-header">
        <h2>📋 Mis Gastos</h2>
        <span class="total">Total: {{ total | currency:'USD':'symbol':'1.2-2' }}</span>
      </div>

      @if (expenses.length === 0) {
        <div class="empty-state">
          <p>🎉 No hay gastos registrados. ¡Agrega tu primer gasto!</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (expense of expenses; track expense.id) {
                <tr>
                  <td>{{ expense.description }}</td>
                  <td><span class="badge">{{ expense.category }}</span></td>
                  <td>{{ expense.date | date:'dd/MM/yyyy':'UTC' }}</td>
                  <td class="amount">{{ expense.amount | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="actions">
                    <button class="btn-edit" (click)="edit.emit(expense)" title="Editar">✏️</button>
                    <button class="btn-delete" (click)="delete.emit(expense.id!)" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;
    }
    .list-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #ecf0f1;
    }
    h2 { margin: 0; color: #2c3e50; font-size: 1.3rem; }
    .total { font-weight: 700; color: #e74c3c; font-size: 1.1rem; }
    .empty-state { padding: 48px; text-align: center; color: #7f8c8d; font-size: 1.1rem; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f8f9fa; padding: 12px 16px;
      text-align: left; font-size: 0.85rem;
      color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;
    }
    td { padding: 14px 16px; border-top: 1px solid #f0f0f0; }
    tr:hover td { background: #fafbfc; }
    .badge {
      background: #eaf4fd; color: #2980b9;
      padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;
    }
    .amount { font-weight: 700; color: #e74c3c; }
    .actions { display: flex; gap: 8px; }
    .btn-edit, .btn-delete {
      background: none; border: none; cursor: pointer;
      font-size: 1.1rem; padding: 4px 8px; border-radius: 6px; transition: background 0.2s;
    }
    .btn-edit:hover { background: #eaf4fd; }
    .btn-delete:hover { background: #fde8e8; }
  `]
})
export class ExpenseListComponent {
  @Input() expenses: Expense[] = [];
  @Output() edit = new EventEmitter<Expense>();
  @Output() delete = new EventEmitter<number>();

  get total(): number {
    return this.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }
}


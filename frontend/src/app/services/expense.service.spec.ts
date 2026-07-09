import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environment';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/expenses`;

  const mockExpenses: Expense[] = [
    { id: 1, description: 'Supermercado', amount: 50, category: 'Alimentación', date: '2026-03-01' },
    { id: 2, description: 'Bus', amount: 2.5, category: 'Transporte', date: '2026-03-02' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExpenseService],
    });
    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() debe retornar lista de gastos', () => {
    service.getAll().subscribe((expenses) => {
      expect(expenses.length).toBe(2);
      expect(expenses[0].description).toBe('Supermercado');
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockExpenses);
  });

  it('create() debe enviar POST con el nuevo gasto', () => {
    const newExpense: Expense = {
      description: 'Netflix',
      amount: 15.99,
      category: 'Entretenimiento',
      date: '2026-03-08',
    };
    service.create(newExpense).subscribe((expense) => {
      expect(expense.id).toBe(3);
      expect(expense.description).toBe('Netflix');
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newExpense);
    req.flush({ ...newExpense, id: 3 });
  });

  it('delete() debe enviar DELETE al endpoint correcto', () => {
    service.delete(1).subscribe((res) => {
      expect(res.message).toBe('Gasto eliminado correctamente');
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Gasto eliminado correctamente' });
  });
});


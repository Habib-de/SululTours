package com.sulultours.service;

import com.sulultours.entity.Expense;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public Expense createExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public Expense getExpenseById(String id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
    }

    public List<Expense> getExpensesByTenant(String tenantId) {
        return expenseRepository.findByTenantId(tenantId);
    }

    public List<Expense> getExpensesByVehicle(String vehicleId) {
        return expenseRepository.findByVehicleId(vehicleId);
    }

    public List<Expense> getExpensesByCategory(String category) {
        return expenseRepository.findByCategory(category);
    }

    @Transactional
    public Expense updateExpense(String id, Expense expenseDetails) {
        Expense expense = getExpenseById(id);
        expense.setCategory(expenseDetails.getCategory());
        expense.setDescription(expenseDetails.getDescription());
        expense.setAmount(expenseDetails.getAmount());
        expense.setDate(expenseDetails.getDate());
        expense.setPaymentMethod(expenseDetails.getPaymentMethod());
        expense.setStatus(expenseDetails.getStatus());
        expense.setReceiptNumber(expenseDetails.getReceiptNumber());
        expense.setReceiptImage(expenseDetails.getReceiptImage());
        expense.setNotes(expenseDetails.getNotes());
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(String id) {
        Expense expense = getExpenseById(id);
        expenseRepository.delete(expense);
    }
}
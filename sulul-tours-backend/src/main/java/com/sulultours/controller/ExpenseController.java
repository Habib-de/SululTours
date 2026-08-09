package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.ExpenseDTO;
import com.sulultours.entity.Expense;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.Vehicle;
import com.sulultours.entity.User;
import com.sulultours.entity.CarOwner;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.repository.VehicleRepository;
import com.sulultours.repository.UserRepository;
import com.sulultours.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner')")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final TenantRepository tenantRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDTO>> createExpense(@RequestBody ExpenseDTO expenseDTO) {
        try {
            System.out.println("📥 Received ExpenseDTO:");
            System.out.println("  - category: " + expenseDTO.getCategory());
            System.out.println("  - amount: " + expenseDTO.getAmount());
            System.out.println("  - tenantId: " + expenseDTO.getTenantId());
            System.out.println("  - vehicleId: " + expenseDTO.getVehicleId());
            System.out.println("  - createdByName: " + expenseDTO.getCreatedByName());
            
            // ✅ Convert DTO to Entity
            Expense expense = new Expense();
            
            // Set basic fields
            expense.setCategory(expenseDTO.getCategory() != null ? expenseDTO.getCategory() : "other");
            expense.setDescription(expenseDTO.getDescription());
            expense.setAmount(expenseDTO.getAmount() != null ? expenseDTO.getAmount() : java.math.BigDecimal.ZERO);
            expense.setDate(expenseDTO.getDate());
            expense.setPaymentMethod(expenseDTO.getPaymentMethod() != null ? expenseDTO.getPaymentMethod() : "cash");
            expense.setStatus(expenseDTO.getStatus() != null ? expenseDTO.getStatus() : "paid");
            expense.setReceiptNumber(expenseDTO.getReceiptNumber());
            expense.setReceiptImage(expenseDTO.getReceiptImage());
            expense.setNotes(expenseDTO.getNotes());
            expense.setIsMaintenance(expenseDTO.getIsMaintenance() != null ? expenseDTO.getIsMaintenance() : false);
            expense.setMaintenanceId(expenseDTO.getMaintenanceId());
            expense.setCreatedByName(expenseDTO.getCreatedByName());
            
            // ✅ Set Tenant from tenantId
            if (expenseDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(expenseDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + expenseDTO.getTenantId()));
                expense.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("  ⚠️ No tenantId provided");
            }
            
            // ✅ Set Vehicle from vehicleId
            if (expenseDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(expenseDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + expenseDTO.getVehicleId()));
                expense.setVehicle(vehicle);
                System.out.println("  ✅ Vehicle set: " + vehicle.getId() + " - " + vehicle.getRegistration());
                
                // ✅ Auto-set owner from vehicle
                if (vehicle.getOwner() != null) {
                    expense.setOwner(vehicle.getOwner());
                    System.out.println("  ✅ Owner set: " + vehicle.getOwner().getId() + " - " + vehicle.getOwner().getName());
                } else {
                    System.out.println("  ⚠️ Vehicle has no owner");
                }
            } else {
                System.out.println("  ⚠️ No vehicleId provided");
            }
            
            // ✅ Set CreatedBy from authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String email = auth.getName();
                System.out.println("  👤 Authenticated user email: " + email);
                
                User user = userRepository.findByEmail(email)
                        .orElse(null);
                if (user != null) {
                    expense.setCreatedBy(user);
                    System.out.println("  ✅ CreatedBy set: " + user.getId() + " - " + user.getName());
                    
                    // If no createdByName was provided, use the user's name
                    if (expense.getCreatedByName() == null || expense.getCreatedByName().isEmpty()) {
                        expense.setCreatedByName(user.getName());
                    }
                    
                    // If no tenantId was provided, try to get it from the user
                    if (expenseDTO.getTenantId() == null && user.getTenant() != null) {
                        expense.setTenant(user.getTenant());
                        System.out.println("  ✅ Tenant set from user: " + user.getTenant().getId());
                    }
                } else {
                    System.out.println("  ⚠️ User not found with email: " + email);
                }
            } else {
                System.out.println("  ⚠️ No authenticated user found");
            }
            
            Expense created = expenseService.createExpense(expense);
            System.out.println("✅ Expense created successfully with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Expense created successfully", convertToDTO(created)));
                    
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating expense: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create expense: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDTO>> getExpenseById(@PathVariable String id) {
        try {
            Expense expense = expenseService.getExpenseById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(expense)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<ExpenseDTO>>> getExpensesByTenant(@PathVariable String tenantId) {
        List<Expense> expenses = expenseService.getExpensesByTenant(tenantId);
        List<ExpenseDTO> dtos = expenses.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<ExpenseDTO>>> getExpensesByVehicle(@PathVariable String vehicleId) {
        List<Expense> expenses = expenseService.getExpensesByVehicle(vehicleId);
        List<ExpenseDTO> dtos = expenses.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ExpenseDTO>>> getExpensesByCategory(@PathVariable String category) {
        List<Expense> expenses = expenseService.getExpensesByCategory(category);
        List<ExpenseDTO> dtos = expenses.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDTO>> updateExpense(@PathVariable String id, @RequestBody ExpenseDTO expenseDTO) {
        try {
            System.out.println("📥 Updating expense: " + id);
            
            Expense expense = expenseService.getExpenseById(id);
            
            // Update basic fields
            expense.setCategory(expenseDTO.getCategory() != null ? expenseDTO.getCategory() : "other");
            expense.setDescription(expenseDTO.getDescription());
            expense.setAmount(expenseDTO.getAmount() != null ? expenseDTO.getAmount() : java.math.BigDecimal.ZERO);
            expense.setDate(expenseDTO.getDate());
            expense.setPaymentMethod(expenseDTO.getPaymentMethod() != null ? expenseDTO.getPaymentMethod() : "cash");
            expense.setStatus(expenseDTO.getStatus() != null ? expenseDTO.getStatus() : "paid");
            expense.setReceiptNumber(expenseDTO.getReceiptNumber());
            expense.setReceiptImage(expenseDTO.getReceiptImage());
            expense.setNotes(expenseDTO.getNotes());
            expense.setCreatedByName(expenseDTO.getCreatedByName());
            
            // ✅ Update Tenant from tenantId
            if (expenseDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(expenseDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + expenseDTO.getTenantId()));
                expense.setTenant(tenant);
            }
            
            // ✅ Update Vehicle from vehicleId
            if (expenseDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(expenseDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + expenseDTO.getVehicleId()));
                expense.setVehicle(vehicle);
                
                // Auto-set owner from vehicle
                if (vehicle.getOwner() != null) {
                    expense.setOwner(vehicle.getOwner());
                }
            }
            
            expense.setUpdatedAt(LocalDateTime.now());
            
            Expense updated = expenseService.updateExpense(id, expense);
            System.out.println("✅ Expense updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Expense updated successfully", convertToDTO(updated)));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating expense: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update expense: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable String id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.ok(ApiResponse.success("Expense deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting expense: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete expense: " + e.getMessage()));
        }
    }

    private ExpenseDTO convertToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setTenantId(expense.getTenant() != null ? expense.getTenant().getId() : null);
        dto.setVehicleId(expense.getVehicle() != null ? expense.getVehicle().getId() : null);
        dto.setOwnerId(expense.getOwner() != null ? expense.getOwner().getId() : null);
        dto.setCreatedBy(expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null);
        dto.setCategory(expense.getCategory());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setDate(expense.getDate());
        dto.setPaymentMethod(expense.getPaymentMethod());
        dto.setStatus(expense.getStatus());
        dto.setReceiptNumber(expense.getReceiptNumber());
        dto.setReceiptImage(expense.getReceiptImage());
        dto.setNotes(expense.getNotes());
        dto.setIsMaintenance(expense.getIsMaintenance());
        dto.setMaintenanceId(expense.getMaintenanceId());
        dto.setCreatedByName(expense.getCreatedByName());
        dto.setCreatedAt(expense.getCreatedAt());
        return dto;
    }
}
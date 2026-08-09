package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.MaintenanceDTO;
import com.sulultours.entity.MaintenanceRecord;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.Vehicle;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.repository.VehicleRepository;
import com.sulultours.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/maintenance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner')")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final TenantRepository tenantRepository;
    private final VehicleRepository vehicleRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceDTO>> createMaintenance(@RequestBody MaintenanceDTO maintenanceDTO) {
        try {
            System.out.println("📥 Received MaintenanceDTO:");
            System.out.println("  - vehicleId: " + maintenanceDTO.getVehicleId());
            System.out.println("  - maintenanceType: " + maintenanceDTO.getMaintenanceType());
            System.out.println("  - cost: " + maintenanceDTO.getCost());
            System.out.println("  - date: " + maintenanceDTO.getDate());
            System.out.println("  - tenantId: " + maintenanceDTO.getTenantId());
            
            // ✅ Convert DTO to Entity
            MaintenanceRecord maintenance = new MaintenanceRecord();
            
            // Set basic fields
            maintenance.setMaintenanceType(maintenanceDTO.getMaintenanceType());
            maintenance.setDescription(maintenanceDTO.getDescription());
            maintenance.setCost(maintenanceDTO.getCost());
            maintenance.setDate(maintenanceDTO.getDate());
            maintenance.setNextDueDate(maintenanceDTO.getNextDueDate());
            maintenance.setStatus(maintenanceDTO.getStatus());
            maintenance.setPriority(maintenanceDTO.getPriority());
            maintenance.setTechnician(maintenanceDTO.getTechnician());
            maintenance.setReceiptImage(maintenanceDTO.getReceiptImage());
            maintenance.setNotes(maintenanceDTO.getNotes());
            
            // ✅ Set Tenant from tenantId
            if (maintenanceDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(maintenanceDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + maintenanceDTO.getTenantId()));
                maintenance.setTenant(tenant);
            }
            
            // ✅ Set Vehicle from vehicleId
            if (maintenanceDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(maintenanceDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + maintenanceDTO.getVehicleId()));
                maintenance.setVehicle(vehicle);
            }
            
            MaintenanceRecord created = maintenanceService.createMaintenance(maintenance);
            System.out.println("✅ Maintenance record created: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Maintenance record created successfully", convertToDTO(created)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create maintenance record: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceDTO>> getMaintenanceById(@PathVariable String id) {
        MaintenanceRecord maintenance = maintenanceService.getMaintenanceById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(maintenance)));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<MaintenanceDTO>>> getMaintenanceByTenant(@PathVariable String tenantId) {
        List<MaintenanceRecord> records = maintenanceService.getMaintenanceByTenant(tenantId);
        List<MaintenanceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<MaintenanceDTO>>> getMaintenanceByVehicle(@PathVariable String vehicleId) {
        List<MaintenanceRecord> records = maintenanceService.getMaintenanceByVehicle(vehicleId);
        List<MaintenanceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<MaintenanceDTO>>> getMaintenanceByStatus(@PathVariable String status) {
        List<MaintenanceRecord> records = maintenanceService.getMaintenanceByStatus(status);
        List<MaintenanceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceDTO>> updateMaintenance(@PathVariable String id, @RequestBody MaintenanceDTO maintenanceDTO) {
        try {
            // ✅ Convert DTO to Entity for update
            MaintenanceRecord maintenance = maintenanceService.getMaintenanceById(id);
            
            // Update basic fields
            maintenance.setMaintenanceType(maintenanceDTO.getMaintenanceType());
            maintenance.setDescription(maintenanceDTO.getDescription());
            maintenance.setCost(maintenanceDTO.getCost());
            maintenance.setDate(maintenanceDTO.getDate());
            maintenance.setNextDueDate(maintenanceDTO.getNextDueDate());
            maintenance.setStatus(maintenanceDTO.getStatus());
            maintenance.setPriority(maintenanceDTO.getPriority());
            maintenance.setTechnician(maintenanceDTO.getTechnician());
            maintenance.setReceiptImage(maintenanceDTO.getReceiptImage());
            maintenance.setNotes(maintenanceDTO.getNotes());
            
            // ✅ Update Tenant from tenantId
            if (maintenanceDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(maintenanceDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + maintenanceDTO.getTenantId()));
                maintenance.setTenant(tenant);
            }
            
            // ✅ Update Vehicle from vehicleId
            if (maintenanceDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(maintenanceDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + maintenanceDTO.getVehicleId()));
                maintenance.setVehicle(vehicle);
            }
            
            maintenance.setUpdatedAt(LocalDateTime.now());
            
            MaintenanceRecord updated = maintenanceService.updateMaintenance(id, maintenance);
            return ResponseEntity.ok(ApiResponse.success("Maintenance record updated successfully", convertToDTO(updated)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update maintenance record: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMaintenance(@PathVariable String id) {
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.ok(ApiResponse.success("Maintenance record deleted successfully", null));
    }

    private MaintenanceDTO convertToDTO(MaintenanceRecord maintenance) {
        MaintenanceDTO dto = new MaintenanceDTO();
        dto.setId(maintenance.getId());
        dto.setTenantId(maintenance.getTenant() != null ? maintenance.getTenant().getId() : null);
        dto.setVehicleId(maintenance.getVehicle() != null ? maintenance.getVehicle().getId() : null);
        dto.setMaintenanceType(maintenance.getMaintenanceType());
        dto.setDescription(maintenance.getDescription());
        dto.setCost(maintenance.getCost());
        dto.setDate(maintenance.getDate());
        dto.setNextDueDate(maintenance.getNextDueDate());
        dto.setStatus(maintenance.getStatus());
        dto.setPriority(maintenance.getPriority());
        dto.setTechnician(maintenance.getTechnician());
        dto.setReceiptImage(maintenance.getReceiptImage());
        dto.setNotes(maintenance.getNotes());
        dto.setCreatedAt(maintenance.getCreatedAt());
        return dto;
    }
}
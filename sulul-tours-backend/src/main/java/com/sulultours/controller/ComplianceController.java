package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.ComplianceDTO;
import com.sulultours.entity.Compliance;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.Vehicle;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.repository.VehicleRepository;
import com.sulultours.service.ComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/compliance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner')")
public class ComplianceController {

    private final ComplianceService complianceService;
    private final TenantRepository tenantRepository;
    private final VehicleRepository vehicleRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ComplianceDTO>> createCompliance(@RequestBody ComplianceDTO complianceDTO) {
        try {
            System.out.println("========================================");
            System.out.println("📥 Received ComplianceDTO:");
            System.out.println("  - vehicleId: " + complianceDTO.getVehicleId());
            System.out.println("  - type: " + complianceDTO.getType());
            System.out.println("  - validFrom: " + complianceDTO.getValidFrom());
            System.out.println("  - validUntil: " + complianceDTO.getValidUntil());
            System.out.println("  - tenantId: " + complianceDTO.getTenantId());
            System.out.println("========================================");
            
            // ✅ Convert DTO to Entity
            Compliance compliance = new Compliance();
            
            // Set basic fields
            compliance.setType(complianceDTO.getType());
            compliance.setValidFrom(complianceDTO.getValidFrom());
            compliance.setValidUntil(complianceDTO.getValidUntil());
            compliance.setStatus(complianceDTO.getStatus() != null ? complianceDTO.getStatus() : "valid");
            compliance.setDocumentImage(complianceDTO.getDocumentImage());
            compliance.setNotes(complianceDTO.getNotes());
            compliance.setCreatedBy(complianceDTO.getCreatedBy());
            
            // ✅ Set Tenant from tenantId
            if (complianceDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(complianceDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + complianceDTO.getTenantId()));
                compliance.setTenant(tenant);
            }
            
            // ✅ Set Vehicle from vehicleId
            if (complianceDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(complianceDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + complianceDTO.getVehicleId()));
                compliance.setVehicle(vehicle);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Vehicle ID is required"));
            }
            
            compliance.setCreatedAt(LocalDateTime.now());
            compliance.setUpdatedAt(LocalDateTime.now());
            
            Compliance created = complianceService.createCompliance(compliance);
            System.out.println("✅ Compliance record created: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Compliance record created successfully", convertToDTO(created)));
        } catch (ResourceNotFoundException e) {
            System.out.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ ERROR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create compliance record: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplianceDTO>> getComplianceById(@PathVariable String id) {
        Compliance compliance = complianceService.getComplianceById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(compliance)));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<ComplianceDTO>>> getComplianceByTenant(@PathVariable String tenantId) {
        List<Compliance> records = complianceService.getComplianceByTenant(tenantId);
        List<ComplianceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<ComplianceDTO>>> getComplianceByVehicle(@PathVariable String vehicleId) {
        List<Compliance> records = complianceService.getComplianceByVehicle(vehicleId);
        List<ComplianceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ComplianceDTO>>> getComplianceByStatus(@PathVariable String status) {
        List<Compliance> records = complianceService.getComplianceByStatus(status);
        List<ComplianceDTO> dtos = records.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplianceDTO>> updateCompliance(@PathVariable String id, @RequestBody ComplianceDTO complianceDTO) {
        try {
            Compliance compliance = complianceService.getComplianceById(id);
            
            // Update basic fields
            compliance.setType(complianceDTO.getType());
            compliance.setValidFrom(complianceDTO.getValidFrom());
            compliance.setValidUntil(complianceDTO.getValidUntil());
            compliance.setStatus(complianceDTO.getStatus());
            compliance.setDocumentImage(complianceDTO.getDocumentImage());
            compliance.setNotes(complianceDTO.getNotes());
            compliance.setCreatedBy(complianceDTO.getCreatedBy());
            
            // ✅ Update Vehicle from vehicleId
            if (complianceDTO.getVehicleId() != null) {
                Vehicle vehicle = vehicleRepository.findById(complianceDTO.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + complianceDTO.getVehicleId()));
                compliance.setVehicle(vehicle);
            }
            
            compliance.setUpdatedAt(LocalDateTime.now());
            
            Compliance updated = complianceService.updateCompliance(id, compliance);
            return ResponseEntity.ok(ApiResponse.success("Compliance record updated successfully", convertToDTO(updated)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update compliance record: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCompliance(@PathVariable String id) {
        complianceService.deleteCompliance(id);
        return ResponseEntity.ok(ApiResponse.success("Compliance record deleted successfully", null));
    }

    private ComplianceDTO convertToDTO(Compliance compliance) {
        ComplianceDTO dto = new ComplianceDTO();
        dto.setId(compliance.getId());
        dto.setTenantId(compliance.getTenant() != null ? compliance.getTenant().getId() : null);
        dto.setVehicleId(compliance.getVehicle() != null ? compliance.getVehicle().getId() : null);
        dto.setType(compliance.getType());
        dto.setValidFrom(compliance.getValidFrom());
        dto.setValidUntil(compliance.getValidUntil());
        dto.setStatus(compliance.getStatus());
        dto.setDocumentImage(compliance.getDocumentImage());
        dto.setNotes(compliance.getNotes());
        dto.setCreatedBy(compliance.getCreatedBy());
        dto.setCreatedAt(compliance.getCreatedAt());
        return dto;
    }
}
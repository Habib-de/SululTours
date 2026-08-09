package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.TenantDTO;
import com.sulultours.entity.Tenant;
import com.sulultours.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<ApiResponse<TenantDTO>> createTenant(@RequestBody Tenant tenant) {
        Tenant created = tenantService.createTenant(tenant);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tenant created successfully", convertToDTO(created)));
    }

    @GetMapping
public ResponseEntity<ApiResponse<List<TenantDTO>>> getAllTenants() {
    List<Tenant> tenants = tenantService.getAllTenants();
    List<TenantDTO> dtos = tenants.stream().map(this::convertToDTO).collect(Collectors.toList());
    return ResponseEntity.ok(ApiResponse.success(dtos));
}

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<TenantDTO>> getTenantById(@PathVariable String id) {
        Tenant tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(tenant)));
    }

    @GetMapping("/subdomain/{subdomain}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<TenantDTO>> getTenantBySubdomain(@PathVariable String subdomain) {
        Tenant tenant = tenantService.getTenantBySubdomain(subdomain);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(tenant)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<TenantDTO>> updateTenant(@PathVariable String id, @RequestBody Tenant tenant) {
        Tenant updated = tenantService.updateTenant(id, tenant);
        return ResponseEntity.ok(ApiResponse.success("Tenant updated successfully", convertToDTO(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('super_admin')")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable String id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success("Tenant deleted successfully", null));
    }

    @PutMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTenantLocation(
            @PathVariable String id,
            @RequestBody Map<String, Object> locationData) {
        tenantService.updateTenantLocation(id, locationData);
        Map<String, Object> location = tenantService.getTenantLocation(id);
        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", location));
    }

    @GetMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTenantLocation(@PathVariable String id) {
        Map<String, Object> location = tenantService.getTenantLocation(id);
        return ResponseEntity.ok(ApiResponse.success(location));
    }

    private TenantDTO convertToDTO(Tenant tenant) {
        TenantDTO dto = new TenantDTO();
        dto.setId(tenant.getId());
        dto.setName(tenant.getName());
        dto.setSubdomain(tenant.getSubdomain());
        dto.setStatus(tenant.getStatus());
        dto.setPlan(tenant.getPlan());
        dto.setConfig(tenant.getConfig());
        dto.setCreatedAt(tenant.getCreatedAt());
        dto.setUpdatedAt(tenant.getUpdatedAt());
        return dto;
    }
}
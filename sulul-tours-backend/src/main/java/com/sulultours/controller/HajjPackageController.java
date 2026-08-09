package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.HajjPackageDTO;
import com.sulultours.entity.HajjPackage;
import com.sulultours.entity.Tenant;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.service.HajjPackageService;
import com.sulultours.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/hajj-packages")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class HajjPackageController {

    private final HajjPackageService hajjPackageService;
    private final TenantService tenantService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HajjPackageDTO>>> getAllHajjPackages() {
        List<HajjPackage> hajjPackages = hajjPackageService.getAllHajjPackages();
        List<HajjPackageDTO> dtos = hajjPackages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<HajjPackageDTO>> createHajjPackage(@RequestBody HajjPackageDTO request) {
        try {
            System.out.println("📥 Received HajjPackageDTO:");
            System.out.println("  - name: " + request.getName());
            System.out.println("  - destination: " + request.getDestination());
            System.out.println("  - price: " + request.getPrice());
            System.out.println("  - tenantId: " + request.getTenantId());
            
            // ✅ Convert DTO to Entity
            HajjPackage hajjPackage = new HajjPackage();
            hajjPackage.setName(request.getName());
            hajjPackage.setType(request.getType() != null ? request.getType() : "hajj");
            hajjPackage.setDestination(request.getDestination());
            hajjPackage.setDuration(request.getDuration());
            hajjPackage.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
            hajjPackage.setDescription(request.getDescription());
            hajjPackage.setStatus(request.getStatus() != null ? request.getStatus() : "active");
            hajjPackage.setMaxGroupSize(request.getMaxGroupSize() != null ? request.getMaxGroupSize() : 10);
            hajjPackage.setDepartureDates(request.getDepartureDates());
            
            // ✅ Handle images - convert to JSON array format
            String images = request.getImages();
            if (images != null && !images.trim().isEmpty()) {
                // Check if it's already valid JSON
                try {
                    // Try to parse as JSON
                    if (images.trim().startsWith("[")) {
                        // It's already a JSON array
                        hajjPackage.setImages(images);
                    } else {
                        // It's a single base64 string, wrap in JSON array
                        hajjPackage.setImages("[\"" + images + "\"]");
                    }
                } catch (Exception e) {
                    // If any error, wrap as JSON array
                    hajjPackage.setImages("[\"" + images + "\"]");
                }
            } else {
                hajjPackage.setImages(null);
            }
            
            hajjPackage.setAccommodation(request.getAccommodation());
            hajjPackage.setMeals(request.getMeals());
            hajjPackage.setTransport(request.getTransport());
            hajjPackage.setGuides(request.getGuides());
            hajjPackage.setVisa(request.getVisa());
            hajjPackage.setInsurance(request.getInsurance());
            hajjPackage.setInclusions(request.getInclusions());
            hajjPackage.setHighlights(request.getHighlights());
            
            // ✅ Set Tenant from tenantId
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                Tenant tenant = tenantService.getTenantById(request.getTenantId());
                hajjPackage.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("  ⚠️ No tenantId provided");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("tenantId is required"));
            }
            
            HajjPackage created = hajjPackageService.createHajjPackage(hajjPackage);
            System.out.println("✅ Hajj package created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Hajj package created successfully", convertToDTO(created)));
                    
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating Hajj package: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create Hajj package: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<HajjPackageDTO>> getHajjPackageById(@PathVariable String id) {
        try {
            HajjPackage hajjPackage = hajjPackageService.getHajjPackageById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(hajjPackage)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error fetching Hajj package: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching Hajj package: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HajjPackageDTO>>> getHajjPackagesByTenant(@PathVariable String tenantId) {
        try {
            List<HajjPackage> hajjPackages = hajjPackageService.getHajjPackagesByTenant(tenantId);
            List<HajjPackageDTO> dtos = hajjPackages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching Hajj packages by tenant: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching packages: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HajjPackageDTO>>> getHajjPackagesByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        try {
            List<HajjPackage> hajjPackages = hajjPackageService.getHajjPackagesByTenantAndStatus(tenantId, status);
            List<HajjPackageDTO> dtos = hajjPackages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching Hajj packages by tenant and status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching packages: " + e.getMessage()));
        }
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HajjPackageDTO>>> getHajjPackagesByType(@PathVariable String type) {
        try {
            List<HajjPackage> hajjPackages = hajjPackageService.getHajjPackagesByType(type);
            List<HajjPackageDTO> dtos = hajjPackages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching Hajj packages by type: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching packages: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<HajjPackageDTO>> updateHajjPackage(
            @PathVariable String id, 
            @RequestBody HajjPackageDTO request) {
        try {
            System.out.println("📥 Updating Hajj package: " + id);
            System.out.println("  - images from request: " + (request.getImages() != null ? "present (length: " + request.getImages().length() + ")" : "null"));
            
            // ✅ Get existing package
            HajjPackage existingPackage = hajjPackageService.getHajjPackageById(id);
            
            // ✅ Update fields
            existingPackage.setName(request.getName());
            existingPackage.setType(request.getType() != null ? request.getType() : "hajj");
            existingPackage.setDestination(request.getDestination());
            existingPackage.setDuration(request.getDuration());
            existingPackage.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
            existingPackage.setDescription(request.getDescription());
            existingPackage.setStatus(request.getStatus() != null ? request.getStatus() : "active");
            existingPackage.setMaxGroupSize(request.getMaxGroupSize() != null ? request.getMaxGroupSize() : 10);
            existingPackage.setDepartureDates(request.getDepartureDates());
            
            // ✅ Handle images - convert to JSON array format
            String images = request.getImages();
            if (images != null && !images.trim().isEmpty()) {
                // Check if it's already valid JSON
                try {
                    // Try to parse as JSON
                    if (images.trim().startsWith("[")) {
                        // It's already a JSON array
                        existingPackage.setImages(images);
                    } else {
                        // It's a single base64 string, wrap in JSON array
                        existingPackage.setImages("[\"" + images + "\"]");
                    }
                } catch (Exception e) {
                    // If any error, wrap as JSON array
                    existingPackage.setImages("[\"" + images + "\"]");
                }
            } else {
                existingPackage.setImages(null);
            }
            
            existingPackage.setAccommodation(request.getAccommodation());
            existingPackage.setMeals(request.getMeals());
            existingPackage.setTransport(request.getTransport());
            existingPackage.setGuides(request.getGuides());
            existingPackage.setVisa(request.getVisa());
            existingPackage.setInsurance(request.getInsurance());
            existingPackage.setInclusions(request.getInclusions());
            existingPackage.setHighlights(request.getHighlights());
            
            // ✅ Update tenant if provided
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                Tenant tenant = tenantService.getTenantById(request.getTenantId());
                existingPackage.setTenant(tenant);
            }
            
            HajjPackage updated = hajjPackageService.updateHajjPackage(id, existingPackage);
            System.out.println("✅ Hajj package updated: " + updated.getId());
            System.out.println("  - images after update: " + (updated.getImages() != null ? "present" : "null"));
            
            return ResponseEntity.ok(ApiResponse.success("Hajj package updated successfully", convertToDTO(updated)));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating Hajj package: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update Hajj package: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteHajjPackage(@PathVariable String id) {
        try {
            System.out.println("📥 Deleting Hajj package: " + id);
            hajjPackageService.deleteHajjPackage(id);
            System.out.println("✅ Hajj package deleted: " + id);
            return ResponseEntity.ok(ApiResponse.success("Hajj package deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting Hajj package: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete Hajj package: " + e.getMessage()));
        }
    }

    private HajjPackageDTO convertToDTO(HajjPackage hajjPackage) {
        HajjPackageDTO dto = new HajjPackageDTO();
        dto.setId(hajjPackage.getId());
        dto.setTenantId(hajjPackage.getTenant() != null ? hajjPackage.getTenant().getId() : null);
        dto.setName(hajjPackage.getName());
        dto.setType(hajjPackage.getType());
        dto.setDestination(hajjPackage.getDestination());
        dto.setDuration(hajjPackage.getDuration());
        dto.setPrice(hajjPackage.getPrice());
        dto.setDescription(hajjPackage.getDescription());
        dto.setStatus(hajjPackage.getStatus());
        dto.setMaxGroupSize(hajjPackage.getMaxGroupSize());
        dto.setDepartureDates(hajjPackage.getDepartureDates());
        dto.setImages(hajjPackage.getImages());
        dto.setAccommodation(hajjPackage.getAccommodation());
        dto.setMeals(hajjPackage.getMeals());
        dto.setTransport(hajjPackage.getTransport());
        dto.setGuides(hajjPackage.getGuides());
        dto.setVisa(hajjPackage.getVisa());
        dto.setInsurance(hajjPackage.getInsurance());
        dto.setInclusions(hajjPackage.getInclusions());
        dto.setHighlights(hajjPackage.getHighlights());
        dto.setCreatedAt(hajjPackage.getCreatedAt());
        return dto;
    }
}
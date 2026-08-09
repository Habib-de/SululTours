package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.TourPackageDTO;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.TourPackage;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.service.TourPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tour-packages")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class TourPackageController {

    private final TourPackageService tourPackageService;
    private final TenantRepository tenantRepository;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<TourPackageDTO>>> getAllTourPackages() {
        List<TourPackage> tourPackages = tourPackageService.getAllTourPackages();
        List<TourPackageDTO> dtos = tourPackages.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<TourPackageDTO>> createTourPackage(@RequestBody TourPackageDTO tourPackageDTO) {
        try {
            System.out.println("📥 Received TourPackageDTO:");
            System.out.println("  - name: " + tourPackageDTO.getName());
            System.out.println("  - destination: " + tourPackageDTO.getDestination());
            System.out.println("  - price: " + tourPackageDTO.getPrice());
            System.out.println("  - tenantId: " + tourPackageDTO.getTenantId());
            
            // ✅ Convert DTO to Entity
            TourPackage tourPackage = new TourPackage();
            tourPackage.setName(tourPackageDTO.getName());
            tourPackage.setDestination(tourPackageDTO.getDestination());
            tourPackage.setDuration(tourPackageDTO.getDuration());
            tourPackage.setPrice(tourPackageDTO.getPrice());
            tourPackage.setDescription(tourPackageDTO.getDescription());
            tourPackage.setCategory(tourPackageDTO.getCategory());
            tourPackage.setStatus(tourPackageDTO.getStatus() != null ? tourPackageDTO.getStatus() : "draft");
            tourPackage.setMaxGroupSize(tourPackageDTO.getMaxGroupSize() != null ? tourPackageDTO.getMaxGroupSize() : 10);
            tourPackage.setDifficulty(tourPackageDTO.getDifficulty());
            tourPackage.setRating(tourPackageDTO.getRating() != null ? tourPackageDTO.getRating() : java.math.BigDecimal.ZERO);
            tourPackage.setReviews(tourPackageDTO.getReviews() != null ? tourPackageDTO.getReviews() : 0);
            
            // ✅ Handle JSON fields - they come as strings from the DTO
            // If they're already strings, use them as-is; if they're arrays, convert to JSON
            tourPackage.setInclusions(tourPackageDTO.getInclusions());
            tourPackage.setExclusions(tourPackageDTO.getExclusions());
            tourPackage.setItinerary(tourPackageDTO.getItinerary());
            tourPackage.setHighlights(tourPackageDTO.getHighlights());
            tourPackage.setDepartureDates(tourPackageDTO.getDepartureDates());
            tourPackage.setImages(tourPackageDTO.getImages());
            
            // ✅ Set Tenant from tenantId
            if (tourPackageDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(tourPackageDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tourPackageDTO.getTenantId()));
                tourPackage.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("  ⚠️ No tenantId provided");
            }
            
            TourPackage created = tourPackageService.createTourPackage(tourPackage);
            System.out.println("✅ Tour package created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tour package created successfully", convertToDTO(created)));
                    
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating tour package: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create tour package: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<TourPackageDTO>> getTourPackageById(@PathVariable String id) {
        try {
            TourPackage tourPackage = tourPackageService.getTourPackageById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(tourPackage)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<TourPackageDTO>>> getTourPackagesByTenant(@PathVariable String tenantId) {
        List<TourPackage> tourPackages = tourPackageService.getTourPackagesByTenant(tenantId);
        List<TourPackageDTO> dtos = tourPackages.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<TourPackageDTO>>> getTourPackagesByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        List<TourPackage> tourPackages = tourPackageService.getTourPackagesByTenantAndStatus(tenantId, status);
        List<TourPackageDTO> dtos = tourPackages.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<TourPackageDTO>>> getTourPackagesByCategory(@PathVariable String category) {
        List<TourPackage> tourPackages = tourPackageService.getTourPackagesByCategory(category);
        List<TourPackageDTO> dtos = tourPackages.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<TourPackageDTO>> updateTourPackage(@PathVariable String id, @RequestBody TourPackageDTO tourPackageDTO) {
        try {
            System.out.println("📥 Updating tour package: " + id);
            
            // ✅ Get existing package
            TourPackage tourPackage = tourPackageService.getTourPackageById(id);
            
            // ✅ Update fields
            tourPackage.setName(tourPackageDTO.getName());
            tourPackage.setDestination(tourPackageDTO.getDestination());
            tourPackage.setDuration(tourPackageDTO.getDuration());
            tourPackage.setPrice(tourPackageDTO.getPrice());
            tourPackage.setDescription(tourPackageDTO.getDescription());
            tourPackage.setCategory(tourPackageDTO.getCategory());
            tourPackage.setStatus(tourPackageDTO.getStatus() != null ? tourPackageDTO.getStatus() : "draft");
            tourPackage.setMaxGroupSize(tourPackageDTO.getMaxGroupSize() != null ? tourPackageDTO.getMaxGroupSize() : 10);
            tourPackage.setDifficulty(tourPackageDTO.getDifficulty());
            tourPackage.setRating(tourPackageDTO.getRating() != null ? tourPackageDTO.getRating() : java.math.BigDecimal.ZERO);
            tourPackage.setReviews(tourPackageDTO.getReviews() != null ? tourPackageDTO.getReviews() : 0);
            
            // ✅ Update JSON fields
            tourPackage.setInclusions(tourPackageDTO.getInclusions());
            tourPackage.setExclusions(tourPackageDTO.getExclusions());
            tourPackage.setItinerary(tourPackageDTO.getItinerary());
            tourPackage.setHighlights(tourPackageDTO.getHighlights());
            tourPackage.setDepartureDates(tourPackageDTO.getDepartureDates());
            tourPackage.setImages(tourPackageDTO.getImages());
            
            // ✅ Update Tenant from tenantId
            if (tourPackageDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(tourPackageDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tourPackageDTO.getTenantId()));
                tourPackage.setTenant(tenant);
            }
            
            TourPackage updated = tourPackageService.updateTourPackage(id, tourPackage);
            System.out.println("✅ Tour package updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Tour package updated successfully", convertToDTO(updated)));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating tour package: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update tour package: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteTourPackage(@PathVariable String id) {
        try {
            tourPackageService.deleteTourPackage(id);
            return ResponseEntity.ok(ApiResponse.success("Tour package deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting tour package: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete tour package: " + e.getMessage()));
        }
    }

    private TourPackageDTO convertToDTO(TourPackage tourPackage) {
        TourPackageDTO dto = new TourPackageDTO();
        dto.setId(tourPackage.getId());
        dto.setTenantId(tourPackage.getTenant() != null ? tourPackage.getTenant().getId() : null);
        dto.setName(tourPackage.getName());
        dto.setDestination(tourPackage.getDestination());
        dto.setDuration(tourPackage.getDuration());
        dto.setPrice(tourPackage.getPrice());
        dto.setDescription(tourPackage.getDescription());
        dto.setCategory(tourPackage.getCategory());
        dto.setStatus(tourPackage.getStatus());
        dto.setMaxGroupSize(tourPackage.getMaxGroupSize());
        dto.setDifficulty(tourPackage.getDifficulty());
        dto.setRating(tourPackage.getRating());
        dto.setReviews(tourPackage.getReviews());
        dto.setInclusions(tourPackage.getInclusions());
        dto.setExclusions(tourPackage.getExclusions());
        dto.setItinerary(tourPackage.getItinerary());
        dto.setHighlights(tourPackage.getHighlights());
        dto.setDepartureDates(tourPackage.getDepartureDates());
        dto.setImages(tourPackage.getImages());
        dto.setCreatedAt(tourPackage.getCreatedAt());
        return dto;
    }
}
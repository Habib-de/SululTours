package com.sulultours.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.TourGuideDTO;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.TourGuide;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.service.TourGuideService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tour-guides")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class TourGuideController {

    private final TourGuideService tourGuideService;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping
    public ResponseEntity<ApiResponse<TourGuideDTO>> createTourGuide(@RequestBody TourGuideDTO tourGuideDTO) {
        try {
            System.out.println("📥 Received TourGuideDTO:");
            System.out.println("  - name: " + tourGuideDTO.getName());
            System.out.println("  - email: " + tourGuideDTO.getEmail());
            System.out.println("  - tenantId: " + tourGuideDTO.getTenantId());
            System.out.println("  - specialties: " + tourGuideDTO.getSpecialties());
            System.out.println("  - languages: " + tourGuideDTO.getLanguages());
            System.out.println("  - certifications: " + tourGuideDTO.getCertifications());
            
            // ✅ Convert DTO to Entity
            TourGuide tourGuide = new TourGuide();
            tourGuide.setName(tourGuideDTO.getName());
            tourGuide.setEmail(tourGuideDTO.getEmail());
            tourGuide.setPhone(tourGuideDTO.getPhone());
            tourGuide.setBio(tourGuideDTO.getBio());
            
            // ✅ Handle specialties - supports both String and List
            tourGuide.setSpecialties(convertToString(tourGuideDTO.getSpecialties()));
            
            // ✅ Handle languages - supports both String and List
            tourGuide.setLanguages(convertToString(tourGuideDTO.getLanguages()));
            
            tourGuide.setExperience(tourGuideDTO.getExperience());
            tourGuide.setRating(tourGuideDTO.getRating() != null ? tourGuideDTO.getRating() : BigDecimal.ZERO);
            tourGuide.setReviews(tourGuideDTO.getReviews() != null ? tourGuideDTO.getReviews() : 0);
            tourGuide.setImage(tourGuideDTO.getImage());
            tourGuide.setStatus(tourGuideDTO.getStatus() != null ? tourGuideDTO.getStatus() : "active");
            
            // ✅ Handle certifications - supports both String and List
            tourGuide.setCertifications(convertToString(tourGuideDTO.getCertifications()));
            
            tourGuide.setAvailability(tourGuideDTO.getAvailability() != null ? tourGuideDTO.getAvailability() : "available");
            tourGuide.setPricePerDay(tourGuideDTO.getPricePerDay() != null ? tourGuideDTO.getPricePerDay() : BigDecimal.ZERO);
            tourGuide.setCountry(tourGuideDTO.getCountry());
            tourGuide.setCity(tourGuideDTO.getCity());
            
            // ✅ Set Tenant from tenantId
            if (tourGuideDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(tourGuideDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tourGuideDTO.getTenantId()));
                tourGuide.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            }
            
            TourGuide created = tourGuideService.createTourGuide(tourGuide);
            System.out.println("✅ Tour guide created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tour guide created successfully", convertToDTO(created)));
                    
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating tour guide: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create tour guide: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TourGuideDTO>> getTourGuideById(@PathVariable String id) {
        try {
            TourGuide tourGuide = tourGuideService.getTourGuideById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(tourGuide)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<TourGuideDTO>>> getTourGuidesByTenant(@PathVariable String tenantId) {
        List<TourGuide> tourGuides = tourGuideService.getTourGuidesByTenant(tenantId);
        List<TourGuideDTO> dtos = tourGuides.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    public ResponseEntity<ApiResponse<List<TourGuideDTO>>> getTourGuidesByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        List<TourGuide> tourGuides = tourGuideService.getTourGuidesByTenantAndStatus(tenantId, status);
        List<TourGuideDTO> dtos = tourGuides.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/availability/{availability}")
    public ResponseEntity<ApiResponse<List<TourGuideDTO>>> getTourGuidesByAvailability(@PathVariable String availability) {
        List<TourGuide> tourGuides = tourGuideService.getTourGuidesByAvailability(availability);
        List<TourGuideDTO> dtos = tourGuides.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TourGuideDTO>> updateTourGuide(@PathVariable String id, @RequestBody TourGuideDTO tourGuideDTO) {
        try {
            System.out.println("📥 Updating tour guide: " + id);
            
            // ✅ Get existing tour guide
            TourGuide tourGuide = tourGuideService.getTourGuideById(id);
            
            // ✅ Update fields
            tourGuide.setName(tourGuideDTO.getName());
            tourGuide.setEmail(tourGuideDTO.getEmail());
            tourGuide.setPhone(tourGuideDTO.getPhone());
            tourGuide.setBio(tourGuideDTO.getBio());
            
            // ✅ Handle specialties - supports both String and List
            tourGuide.setSpecialties(convertToString(tourGuideDTO.getSpecialties()));
            
            // ✅ Handle languages - supports both String and List
            tourGuide.setLanguages(convertToString(tourGuideDTO.getLanguages()));
            
            tourGuide.setExperience(tourGuideDTO.getExperience());
            tourGuide.setRating(tourGuideDTO.getRating() != null ? tourGuideDTO.getRating() : BigDecimal.ZERO);
            tourGuide.setReviews(tourGuideDTO.getReviews() != null ? tourGuideDTO.getReviews() : 0);
            tourGuide.setImage(tourGuideDTO.getImage());
            tourGuide.setStatus(tourGuideDTO.getStatus() != null ? tourGuideDTO.getStatus() : "active");
            
            // ✅ Handle certifications - supports both String and List
            tourGuide.setCertifications(convertToString(tourGuideDTO.getCertifications()));
            
            tourGuide.setAvailability(tourGuideDTO.getAvailability() != null ? tourGuideDTO.getAvailability() : "available");
            tourGuide.setPricePerDay(tourGuideDTO.getPricePerDay() != null ? tourGuideDTO.getPricePerDay() : BigDecimal.ZERO);
            tourGuide.setCountry(tourGuideDTO.getCountry());
            tourGuide.setCity(tourGuideDTO.getCity());
            
            // ✅ Update Tenant from tenantId
            if (tourGuideDTO.getTenantId() != null) {
                Tenant tenant = tenantRepository.findById(tourGuideDTO.getTenantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tourGuideDTO.getTenantId()));
                tourGuide.setTenant(tenant);
            }
            
            tourGuide.setUpdatedAt(LocalDateTime.now());
            
            TourGuide updated = tourGuideService.updateTourGuide(id, tourGuide);
            System.out.println("✅ Tour guide updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Tour guide updated successfully", convertToDTO(updated)));
            
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating tour guide: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update tour guide: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTourGuide(@PathVariable String id) {
        try {
            tourGuideService.deleteTourGuide(id);
            return ResponseEntity.ok(ApiResponse.success("Tour guide deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting tour guide: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete tour guide: " + e.getMessage()));
        }
    }

    // ✅ Helper method to convert both String and List to JSON string
    private String convertToString(Object value) {
        if (value == null) {
            return null;
        }
        
        // If it's already a String, check if it's a JSON array or plain string
        if (value instanceof String) {
            String strValue = (String) value;
            // If it starts with '[' it's already a JSON array
            if (strValue.trim().startsWith("[")) {
                return strValue;
            }
            // If it's a plain string, wrap it in an array
            try {
                // Try to parse as JSON to validate
                objectMapper.readTree(strValue);
                return strValue;
            } catch (JsonProcessingException e) {
                // Not JSON, wrap in array
                try {
                    // ✅ FIX: Use Collections.singletonList instead of List.of
                    return objectMapper.writeValueAsString(Collections.singletonList(strValue));
                } catch (JsonProcessingException ex) {
                    return "[]";
                }
            }
        }
        
        // If it's a List, convert to JSON string
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            if (list.isEmpty()) {
                return "[]";
            }
            try {
                return objectMapper.writeValueAsString(list);
            } catch (JsonProcessingException e) {
                return "[]";
            }
        }
        
        return null;
    }

    private TourGuideDTO convertToDTO(TourGuide tourGuide) {
        TourGuideDTO dto = new TourGuideDTO();
        dto.setId(tourGuide.getId());
        dto.setTenantId(tourGuide.getTenant() != null ? tourGuide.getTenant().getId() : null);
        dto.setName(tourGuide.getName());
        dto.setEmail(tourGuide.getEmail());
        dto.setPhone(tourGuide.getPhone());
        dto.setBio(tourGuide.getBio());
        
        // ✅ Keep as String - the frontend will parse it with JSON.parse()
        dto.setSpecialties(tourGuide.getSpecialties());
        dto.setLanguages(tourGuide.getLanguages());
        dto.setCertifications(tourGuide.getCertifications());
        
        dto.setExperience(tourGuide.getExperience());
        dto.setRating(tourGuide.getRating());
        dto.setReviews(tourGuide.getReviews());
        dto.setImage(tourGuide.getImage());
        dto.setStatus(tourGuide.getStatus());
        dto.setAvailability(tourGuide.getAvailability());
        dto.setPricePerDay(tourGuide.getPricePerDay());
        dto.setCountry(tourGuide.getCountry());
        dto.setCity(tourGuide.getCity());
        dto.setCreatedAt(tourGuide.getCreatedAt());
        
        return dto;
    }
}
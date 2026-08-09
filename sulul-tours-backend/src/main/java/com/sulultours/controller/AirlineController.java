package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.AirlineDTO;
import com.sulultours.entity.Airline;
import com.sulultours.entity.Tenant;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.service.AirlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/airlines")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class AirlineController {

    private final AirlineService airlineService;
    private final TenantRepository tenantRepository;  // ✅ ADD THIS

    @PostMapping
    public ResponseEntity<ApiResponse<AirlineDTO>> createAirline(@RequestBody Airline airline) {
        try {
            // ✅ DEBUG LOGS
            System.out.println("========================================");
            System.out.println("📥 Received Airline:");
            System.out.println("  - name: " + airline.getName());
            System.out.println("  - code: " + airline.getCode());
            System.out.println("  - country: " + airline.getCountry());
            System.out.println("  - tenant: " + (airline.getTenant() != null ? airline.getTenant().getId() : "null"));
            System.out.println("========================================");
            
            // ✅ Set Tenant from tenantId if present
            if (airline.getTenant() != null && airline.getTenant().getId() != null) {
                Tenant tenant = tenantRepository.findById(airline.getTenant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + airline.getTenant().getId()));
                airline.setTenant(tenant);
                System.out.println("✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("⚠️ No tenant provided");
            }
            
            Airline created = airlineService.createAirline(airline);
            System.out.println("✅ Airline created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Airline created successfully", convertToDTO(created)));
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating airline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create airline: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AirlineDTO>> getAirlineById(@PathVariable String id) {
        try {
            Airline airline = airlineService.getAirlineById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(airline)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<AirlineDTO>> getAirlineByCode(@PathVariable String code) {
        try {
            Airline airline = airlineService.getAirlineByCode(code);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(airline)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<AirlineDTO>>> getAirlinesByTenant(@PathVariable String tenantId) {
        try {
            System.out.println("📊 Fetching airlines for tenant: " + tenantId);
            List<Airline> airlines = airlineService.getAirlinesByTenant(tenantId);
            List<AirlineDTO> dtos = airlines.stream().map(this::convertToDTO).collect(Collectors.toList());
            System.out.println("📊 Found " + dtos.size() + " airlines");
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching airlines: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch airlines: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AirlineDTO>> updateAirline(@PathVariable String id, @RequestBody Airline airline) {
        try {
            System.out.println("📤 Updating airline: " + id);
            
            // ✅ Set Tenant from tenantId if present
            if (airline.getTenant() != null && airline.getTenant().getId() != null) {
                Tenant tenant = tenantRepository.findById(airline.getTenant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + airline.getTenant().getId()));
                airline.setTenant(tenant);
                System.out.println("✅ Tenant set: " + tenant.getId());
            }
            
            Airline updated = airlineService.updateAirline(id, airline);
            System.out.println("✅ Airline updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Airline updated successfully", convertToDTO(updated)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating airline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update airline: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAirline(@PathVariable String id) {
        try {
            System.out.println("📤 Deleting airline: " + id);
            airlineService.deleteAirline(id);
            System.out.println("✅ Airline deleted: " + id);
            return ResponseEntity.ok(ApiResponse.success("Airline deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting airline: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete airline: " + e.getMessage()));
        }
    }

    private AirlineDTO convertToDTO(Airline airline) {
        AirlineDTO dto = new AirlineDTO();
        dto.setId(airline.getId());
        dto.setTenantId(airline.getTenant() != null ? airline.getTenant().getId() : null);
        dto.setName(airline.getName());
        dto.setCode(airline.getCode());
        dto.setCountry(airline.getCountry());
        dto.setHeadquarters(airline.getHeadquarters());
        dto.setFounded(airline.getFounded());
        dto.setFleetSize(airline.getFleetSize());
        dto.setDestinations(airline.getDestinations());
        dto.setWebsite(airline.getWebsite());
        dto.setPhone(airline.getPhone());
        dto.setEmail(airline.getEmail());
        dto.setStatus(airline.getStatus());
        dto.setAlliance(airline.getAlliance());
        dto.setStarRating(airline.getStarRating());
        dto.setBaggageAllowance(airline.getBaggageAllowance());
        dto.setAmenities(airline.getAmenities());
        dto.setDescription(airline.getDescription());
        dto.setImage(airline.getImage());
        dto.setNotes(airline.getNotes());
        dto.setCreatedAt(airline.getCreatedAt());
        return dto;
    }
}
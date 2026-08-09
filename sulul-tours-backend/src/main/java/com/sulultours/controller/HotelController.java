package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.HotelDTO;
import com.sulultours.entity.Hotel;
import com.sulultours.entity.Tenant;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import com.sulultours.service.HotelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class HotelController {

    private final HotelService hotelService;
    private final TenantRepository tenantRepository; // ✅ ADD THIS

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HotelDTO>>> getAllHotels() {
        List<Hotel> hotels = hotelService.getAllHotels();
        List<HotelDTO> dtos = hotels.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<HotelDTO>> createHotel(@RequestBody Hotel hotel) {
        try {
            // ✅ DEBUG LOGS
            System.out.println("========================================");
            System.out.println("📥 Received Hotel:");
            System.out.println("  - name: " + hotel.getName());
            System.out.println("  - city: " + hotel.getCity());
            System.out.println("  - tenant: " + (hotel.getTenant() != null ? hotel.getTenant().getId() : "null"));
            System.out.println("========================================");
            
            // ✅ Set Tenant from tenantId if present
            if (hotel.getTenant() != null && hotel.getTenant().getId() != null) {
                Tenant tenant = tenantRepository.findById(hotel.getTenant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + hotel.getTenant().getId()));
                hotel.setTenant(tenant);
                System.out.println("✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("⚠️ No tenant provided");
            }
            
            Hotel created = hotelService.createHotel(hotel);
            System.out.println("✅ Hotel created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Hotel created successfully", convertToDTO(created)));
        } catch (ResourceNotFoundException e) {
            System.err.println("❌ Resource not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error creating hotel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create hotel: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<HotelDTO>> getHotelById(@PathVariable String id) {
        try {
            Hotel hotel = hotelService.getHotelById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(hotel)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HotelDTO>>> getHotelsByTenant(@PathVariable String tenantId) {
        try {
            System.out.println("📊 Fetching hotels for tenant: " + tenantId);
            List<Hotel> hotels = hotelService.getHotelsByTenant(tenantId);
            List<HotelDTO> dtos = hotels.stream().map(this::convertToDTO).collect(Collectors.toList());
            System.out.println("📊 Found " + dtos.size() + " hotels");
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching hotels: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch hotels: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HotelDTO>>> getHotelsByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        try {
            List<Hotel> hotels = hotelService.getHotelsByTenantAndStatus(tenantId, status);
            List<HotelDTO> dtos = hotels.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch hotels: " + e.getMessage()));
        }
    }

    @GetMapping("/city/{city}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<HotelDTO>>> getHotelsByCity(@PathVariable String city) {
        try {
            List<Hotel> hotels = hotelService.getHotelsByCity(city);
            List<HotelDTO> dtos = hotels.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch hotels: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<HotelDTO>> updateHotel(@PathVariable String id, @RequestBody Hotel hotel) {
        try {
            System.out.println("📤 Updating hotel: " + id);
            
            // ✅ Set Tenant from tenantId if present
            if (hotel.getTenant() != null && hotel.getTenant().getId() != null) {
                Tenant tenant = tenantRepository.findById(hotel.getTenant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + hotel.getTenant().getId()));
                hotel.setTenant(tenant);
                System.out.println("✅ Tenant set: " + tenant.getId());
            }
            
            Hotel updated = hotelService.updateHotel(id, hotel);
            System.out.println("✅ Hotel updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Hotel updated successfully", convertToDTO(updated)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error updating hotel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update hotel: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteHotel(@PathVariable String id) {
        try {
            System.out.println("📤 Deleting hotel: " + id);
            hotelService.deleteHotel(id);
            System.out.println("✅ Hotel deleted: " + id);
            return ResponseEntity.ok(ApiResponse.success("Hotel deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error deleting hotel: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete hotel: " + e.getMessage()));
        }
    }

    private HotelDTO convertToDTO(Hotel hotel) {
        HotelDTO dto = new HotelDTO();
        dto.setId(hotel.getId());
        dto.setTenantId(hotel.getTenant() != null ? hotel.getTenant().getId() : null);
        dto.setName(hotel.getName());
        dto.setAddress(hotel.getAddress());
        dto.setCity(hotel.getCity());
        dto.setCountry(hotel.getCountry());
        dto.setPhone(hotel.getPhone());
        dto.setEmail(hotel.getEmail());
        dto.setWebsite(hotel.getWebsite());
        dto.setDescription(hotel.getDescription());
        dto.setStarRating(hotel.getStarRating());
        dto.setStatus(hotel.getStatus());
        dto.setCheckIn(hotel.getCheckIn());
        dto.setCheckOut(hotel.getCheckOut());
        dto.setContactPerson(hotel.getContactPerson());
        dto.setContactPhone(hotel.getContactPhone());
        dto.setAmenities(hotel.getAmenities());
        dto.setImages(hotel.getImages());
        dto.setAgreementType(hotel.getAgreementType());
        dto.setAgreementDate(hotel.getAgreementDate());
        dto.setAgreementEndDate(hotel.getAgreementEndDate());
        dto.setCommissionRate(hotel.getCommissionRate());
        dto.setSupplierName(hotel.getSupplierName());
        dto.setSupplierContact(hotel.getSupplierContact());
        dto.setPaymentTerms(hotel.getPaymentTerms());
        dto.setNotes(hotel.getNotes());
        dto.setCreatedAt(hotel.getCreatedAt());
        return dto;
    }
}
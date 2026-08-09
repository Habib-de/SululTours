package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.VisaApplicationDTO;
import com.sulultours.entity.Booking;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.VisaApplication;
import com.sulultours.service.BookingService;
import com.sulultours.service.TenantService;
import com.sulultours.service.VisaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/visa")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class VisaController {

    private final VisaService visaService;
    private final BookingService bookingService;      // ✅ ADD THIS
    private final TenantService tenantService;        // ✅ ADD THIS

    @PostMapping
    public ResponseEntity<ApiResponse<VisaApplicationDTO>> createVisaApplication(@RequestBody VisaApplicationDTO request) {
        try {
            System.out.println("📥 Creating visa application for: " + request.getApplicantName());
            System.out.println("  - bookingId: " + request.getBookingId());
            System.out.println("  - tenantId: " + request.getTenantId());
            
            // ✅ Convert DTO to Entity
            VisaApplication visa = new VisaApplication();
            visa.setApplicantName(request.getApplicantName());
            visa.setPassportNumber(request.getPassportNumber());
            visa.setNationality(request.getNationality());
            visa.setDateOfBirth(request.getDateOfBirth());
            visa.setPassportExpiry(request.getPassportExpiry());
            visa.setVisaType(request.getVisaType());
            visa.setApplicationDate(request.getApplicationDate());
            visa.setSubmissionDate(request.getSubmissionDate());
            visa.setStatus(request.getStatus() != null ? request.getStatus() : "pending");
            visa.setProcessingOfficer(request.getProcessingOfficer());
            visa.setCost(request.getCost());
            visa.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "pending");
            visa.setPassportImage(request.getPassportImage());
            visa.setNotes(request.getNotes());
            visa.setFlightBooked(request.getFlightBooked() != null ? request.getFlightBooked() : false);
            visa.setFlightBookingId(request.getFlightBookingId());
            
            // ✅ Set Tenant
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                Tenant tenant = tenantService.getTenantById(request.getTenantId());
                visa.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("  ⚠️ No tenantId provided");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("tenantId is required"));
            }
            
            // ✅ Handle bookingId - fetch the Booking entity if provided
            if (request.getBookingId() != null && !request.getBookingId().isEmpty()) {
                try {
                    Booking booking = bookingService.getBookingById(request.getBookingId());
                    visa.setBooking(booking);
                    System.out.println("  ✅ Booking set: " + booking.getId());
                } catch (Exception e) {
                    System.out.println("  ⚠️ Booking not found: " + request.getBookingId());
                    // Continue without booking (standalone visa)
                }
            } else {
                System.out.println("  📋 Standalone visa (no booking)");
            }
            
            VisaApplication created = visaService.createVisaApplication(visa);
            System.out.println("✅ Visa created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Visa application created successfully", convertToDTO(created)));
                    
        } catch (Exception e) {
            System.err.println("❌ Error creating visa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create visa: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VisaApplicationDTO>> getVisaApplicationById(@PathVariable String id) {
        try {
            VisaApplication visa = visaService.getVisaApplicationById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(visa)));
        } catch (Exception e) {
            System.err.println("❌ Error fetching visa: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching visa: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<VisaApplicationDTO>>> getVisaApplicationsByTenant(@PathVariable String tenantId) {
        try {
            List<VisaApplication> visas = visaService.getVisaApplicationsByTenant(tenantId);
            List<VisaApplicationDTO> dtos = visas.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching visas: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching visas: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<VisaApplicationDTO>>> getVisaApplicationsByStatus(@PathVariable String status) {
        try {
            List<VisaApplication> visas = visaService.getVisaApplicationsByStatus(status);
            List<VisaApplicationDTO> dtos = visas.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching visas by status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching visas: " + e.getMessage()));
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<VisaApplicationDTO>>> getVisaApplicationsByBookingId(@PathVariable String bookingId) {
        try {
            List<VisaApplication> visas = visaService.getVisaApplicationsByBookingId(bookingId);
            List<VisaApplicationDTO> dtos = visas.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching visas by booking: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching visas: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VisaApplicationDTO>> updateVisaApplication(
            @PathVariable String id, 
            @RequestBody VisaApplicationDTO request) {
        try {
            System.out.println("📥 Updating visa: " + id);
            
            // ✅ Get existing visa
            VisaApplication existing = visaService.getVisaApplicationById(id);
            
            // ✅ Update fields
            existing.setApplicantName(request.getApplicantName());
            existing.setPassportNumber(request.getPassportNumber());
            existing.setNationality(request.getNationality());
            existing.setDateOfBirth(request.getDateOfBirth());
            existing.setPassportExpiry(request.getPassportExpiry());
            existing.setVisaType(request.getVisaType());
            existing.setApplicationDate(request.getApplicationDate());
            existing.setSubmissionDate(request.getSubmissionDate());
            existing.setStatus(request.getStatus() != null ? request.getStatus() : "pending");
            existing.setProcessingOfficer(request.getProcessingOfficer());
            existing.setCost(request.getCost());
            existing.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "pending");
            existing.setPassportImage(request.getPassportImage());
            existing.setNotes(request.getNotes());
            existing.setFlightBooked(request.getFlightBooked() != null ? request.getFlightBooked() : false);
            existing.setFlightBookingId(request.getFlightBookingId());
            
            // ✅ Handle bookingId - fetch the Booking entity if provided
            if (request.getBookingId() != null && !request.getBookingId().isEmpty()) {
                try {
                    Booking booking = bookingService.getBookingById(request.getBookingId());
                    existing.setBooking(booking);
                } catch (Exception e) {
                    System.out.println("  ⚠️ Booking not found: " + request.getBookingId());
                    existing.setBooking(null);
                }
            } else {
                existing.setBooking(null);
            }
            
            VisaApplication updated = visaService.updateVisaApplication(id, existing);
            System.out.println("✅ Visa updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Visa application updated successfully", convertToDTO(updated)));
            
        } catch (Exception e) {
            System.err.println("❌ Error updating visa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update visa: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<VisaApplicationDTO>> approveVisa(@PathVariable String id) {
        try {
            VisaApplication updated = visaService.approveVisa(id);
            return ResponseEntity.ok(ApiResponse.success("Visa approved successfully", convertToDTO(updated)));
        } catch (Exception e) {
            System.err.println("❌ Error approving visa: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to approve visa: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<VisaApplicationDTO>> rejectVisa(@PathVariable String id) {
        try {
            VisaApplication updated = visaService.rejectVisa(id);
            return ResponseEntity.ok(ApiResponse.success("Visa rejected successfully", convertToDTO(updated)));
        } catch (Exception e) {
            System.err.println("❌ Error rejecting visa: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reject visa: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVisaApplication(@PathVariable String id) {
        try {
            visaService.deleteVisaApplication(id);
            return ResponseEntity.ok(ApiResponse.success("Visa application deleted successfully", null));
        } catch (Exception e) {
            System.err.println("❌ Error deleting visa: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete visa: " + e.getMessage()));
        }
    }

    private VisaApplicationDTO convertToDTO(VisaApplication visa) {
        VisaApplicationDTO dto = new VisaApplicationDTO();
        dto.setId(visa.getId());
        dto.setTenantId(visa.getTenant() != null ? visa.getTenant().getId() : null);
        dto.setBookingId(visa.getBookingId());
        dto.setApplicantName(visa.getApplicantName());
        dto.setPassportNumber(visa.getPassportNumber());
        dto.setNationality(visa.getNationality());
        dto.setDateOfBirth(visa.getDateOfBirth());
        dto.setPassportExpiry(visa.getPassportExpiry());
        dto.setVisaType(visa.getVisaType());
        dto.setApplicationDate(visa.getApplicationDate());
        dto.setSubmissionDate(visa.getSubmissionDate());
        dto.setStatus(visa.getStatus());
        dto.setProcessingOfficer(visa.getProcessingOfficer());
        dto.setCost(visa.getCost());
        dto.setPaymentStatus(visa.getPaymentStatus());
        dto.setPassportImage(visa.getPassportImage());
        dto.setNotes(visa.getNotes());
        dto.setFlightBooked(visa.getFlightBooked());
        dto.setFlightBookingId(visa.getFlightBookingId());
        dto.setApprovedAt(visa.getApprovedAt());
        dto.setRejectedAt(visa.getRejectedAt());
        dto.setCreatedAt(visa.getCreatedAt());
        return dto;
    }
}
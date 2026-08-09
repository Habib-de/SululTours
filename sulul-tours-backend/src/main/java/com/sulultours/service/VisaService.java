package com.sulultours.service;

import com.sulultours.entity.Booking;
import com.sulultours.entity.VisaApplication;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.BookingRepository;
import com.sulultours.repository.VisaApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VisaService {

    private final VisaApplicationRepository visaApplicationRepository;
    private final BookingRepository bookingRepository; // ✅ ADD THIS

    @Transactional
    public VisaApplication createVisaApplication(VisaApplication visaApplication) {
        // ✅ Ensure tenant is set if booking exists
        if (visaApplication.getTenant() == null && visaApplication.getBooking() != null) {
            visaApplication.setTenant(visaApplication.getBooking().getTenant());
        }
        return visaApplicationRepository.save(visaApplication);
    }

    public VisaApplication getVisaApplicationById(String id) {
        return visaApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visa application not found with id: " + id));
    }

    public List<VisaApplication> getVisaApplicationsByTenant(String tenantId) {
        return visaApplicationRepository.findByTenantId(tenantId);
    }

    public List<VisaApplication> getVisaApplicationsByStatus(String status) {
        return visaApplicationRepository.findByStatus(status);
    }

    // ✅ FIXED: Use findByBooking_Id (already correct)
    public List<VisaApplication> getVisaApplicationsByBookingId(String bookingId) {
        return visaApplicationRepository.findByBooking_Id(bookingId);
    }

    @Transactional
    public VisaApplication updateVisaApplication(String id, VisaApplication visaDetails) {
        VisaApplication visa = getVisaApplicationById(id);
        
        // Update basic fields
        visa.setApplicantName(visaDetails.getApplicantName());
        visa.setPassportNumber(visaDetails.getPassportNumber());
        visa.setNationality(visaDetails.getNationality());
        visa.setDateOfBirth(visaDetails.getDateOfBirth());
        visa.setPassportExpiry(visaDetails.getPassportExpiry());
        visa.setVisaType(visaDetails.getVisaType());
        visa.setApplicationDate(visaDetails.getApplicationDate());
        visa.setSubmissionDate(visaDetails.getSubmissionDate());
        visa.setStatus(visaDetails.getStatus());
        visa.setProcessingOfficer(visaDetails.getProcessingOfficer());
        visa.setCost(visaDetails.getCost());
        visa.setPaymentStatus(visaDetails.getPaymentStatus());
        visa.setPassportImage(visaDetails.getPassportImage());
        visa.setNotes(visaDetails.getNotes());
        visa.setFlightBooked(visaDetails.getFlightBooked());
        visa.setFlightBookingId(visaDetails.getFlightBookingId());
        
        // ✅ Update booking if provided
        if (visaDetails.getBooking() != null) {
            visa.setBooking(visaDetails.getBooking());
        } else {
            visa.setBooking(null); // Allow removing booking (standalone)
        }
        
        // Handle approval/rejection timestamps
        if ("approved".equals(visaDetails.getStatus()) && visa.getApprovedAt() == null) {
            visa.setApprovedAt(LocalDateTime.now());
        }
        if ("rejected".equals(visaDetails.getStatus()) && visa.getRejectedAt() == null) {
            visa.setRejectedAt(LocalDateTime.now());
        }
        
        return visaApplicationRepository.save(visa);
    }

    @Transactional
    public VisaApplication approveVisa(String id) {
        VisaApplication visa = getVisaApplicationById(id);
        visa.setStatus("approved");
        visa.setApprovedAt(LocalDateTime.now());
        return visaApplicationRepository.save(visa);
    }

    @Transactional
    public VisaApplication rejectVisa(String id) {
        VisaApplication visa = getVisaApplicationById(id);
        visa.setStatus("rejected");
        visa.setRejectedAt(LocalDateTime.now());
        return visaApplicationRepository.save(visa);
    }

    @Transactional
    public void deleteVisaApplication(String id) {
        VisaApplication visa = getVisaApplicationById(id);
        visaApplicationRepository.delete(visa);
    }
}
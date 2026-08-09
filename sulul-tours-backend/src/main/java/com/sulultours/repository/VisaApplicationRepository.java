package com.sulultours.repository;

import com.sulultours.entity.VisaApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisaApplicationRepository extends JpaRepository<VisaApplication, String> {
    List<VisaApplication> findByTenantId(String tenantId);
    List<VisaApplication> findByStatus(String status);
    
    // ✅ FIXED: Use booking.id instead of bookingId
    List<VisaApplication> findByBooking_Id(String bookingId);
}
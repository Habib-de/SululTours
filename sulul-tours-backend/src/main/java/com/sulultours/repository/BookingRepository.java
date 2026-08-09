package com.sulultours.repository;

import com.sulultours.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    Optional<Booking> findByReference(String reference);
    List<Booking> findByTenantId(String tenantId);
    List<Booking> findByUserId(String userId);
    List<Booking> findByServiceType(String serviceType);
    List<Booking> findByStatus(String status);
    List<Booking> findByCustomerEmail(String customerEmail);
}
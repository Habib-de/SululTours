package com.sulultours.repository;

import com.sulultours.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.jpa.repository.Modifying;    
import org.springframework.data.repository.query.Param; 
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime; 
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

    // ✅ ADD THESE TWO NEW METHODS BELOW
    // ============================================
    // 1. Find ALL bookings that overlap with the given date range
    // ============================================
    @Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND (b.status = 'pending' OR b.status = 'confirmed') " +
           "AND ((b.startDate < :endDate) AND (b.endDate > :startDate))")
    List<Booking> findOverlappingBookings(
        @Param("vehicleId") String vehicleId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // ============================================
    // 2. Check if ANY booking overlaps (returns true/false)
    // ============================================
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND (b.status = 'pending' OR b.status = 'confirmed') " +
           "AND ((b.startDate < :endDate) AND (b.endDate > :startDate))")
    boolean existsOverlappingBooking(
        @Param("vehicleId") String vehicleId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // ✅ Broker's own bookings (all time, newest first)
List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

// ✅ Broker's bookings created today
@Query("SELECT b FROM Booking b WHERE b.user.id = :userId " +
       "AND b.createdAt >= :startOfDay AND b.createdAt < :endOfDay " +
       "ORDER BY b.createdAt DESC")
List<Booking> findBrokerBookingsToday(
    @Param("userId") String userId,
    @Param("startOfDay") LocalDateTime startOfDay,
    @Param("endOfDay") LocalDateTime endOfDay
);
// ⚡ NEW — clears user_id on all this user's bookings (keeps the bookings)
@Modifying
@Query("update Booking b set b.user = null where b.user.id = :userId")
int nullifyUser(@Param("userId") String userId);
}
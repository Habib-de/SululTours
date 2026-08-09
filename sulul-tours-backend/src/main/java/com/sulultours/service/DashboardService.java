package com.sulultours.service;

import com.sulultours.entity.Booking;
import com.sulultours.entity.User;
import com.sulultours.entity.Vehicle;
import com.sulultours.repository.BookingRepository;
import com.sulultours.repository.UserRepository;
import com.sulultours.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    public Map<String, Object> getDashboardStats(String tenantId) {
        Map<String, Object> stats = new HashMap<>();

        List<Booking> bookings = bookingRepository.findByTenantId(tenantId);
        long totalBookings = bookings.size();
        long pendingBookings = bookings.stream().filter(b -> "pending".equals(b.getStatus())).count();
        long confirmedBookings = bookings.stream().filter(b -> "confirmed".equals(b.getStatus())).count();
        long completedBookings = bookings.stream().filter(b -> "completed".equals(b.getStatus())).count();
        long cancelledBookings = bookings.stream().filter(b -> "cancelled".equals(b.getStatus())).count();

        BigDecimal totalRevenue = bookings.stream()
                .map(Booking::getTotalPrice)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<User> users = userRepository.findByTenantId(tenantId);
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(u -> "active".equals(u.getStatus())).count();

        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        long totalVehicles = vehicles.size();
        long activeVehicles = vehicles.stream().filter(v -> "active".equals(v.getStatus())).count();

        stats.put("totalBookings", totalBookings);
        stats.put("pendingBookings", pendingBookings);
        stats.put("confirmedBookings", confirmedBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalVehicles", totalVehicles);
        stats.put("activeVehicles", activeVehicles);

        return stats;
    }

    public Map<String, Object> getBookingStats(String tenantId) {
        List<Booking> bookings = bookingRepository.findByTenantId(tenantId);
        
        Map<String, Long> bookingsByService = new HashMap<>();
        Map<String, BigDecimal> revenueByService = new HashMap<>();

        for (Booking booking : bookings) {
            String serviceType = booking.getServiceType() != null ? booking.getServiceType() : "unknown";
            bookingsByService.merge(serviceType, 1L, Long::sum);
            
            BigDecimal price = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            revenueByService.merge(serviceType, price, BigDecimal::add);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("bookingsByService", bookingsByService);
        stats.put("revenueByService", revenueByService);
        return stats;
    }
}
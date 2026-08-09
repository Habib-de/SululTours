package com.sulultours.service;

import com.sulultours.entity.Booking;
import com.sulultours.entity.Expense;
import com.sulultours.entity.Vehicle;
import com.sulultours.repository.BookingRepository;
import com.sulultours.repository.ExpenseRepository;
import com.sulultours.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final ExpenseRepository expenseRepository;

    public Map<String, Object> getDashboardSummary(String tenantId) {
        Map<String, Object> summary = new HashMap<>();

        List<Booking> bookings = bookingRepository.findByTenantId(tenantId);
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        List<Expense> expenses = expenseRepository.findByTenantId(tenantId);

        // Booking stats
        long totalBookings = bookings.size();
        long pendingBookings = bookings.stream().filter(b -> "pending".equals(b.getStatus())).count();
        long confirmedBookings = bookings.stream().filter(b -> "confirmed".equals(b.getStatus())).count();
        long completedBookings = bookings.stream().filter(b -> "completed".equals(b.getStatus())).count();

        // Revenue
        BigDecimal totalRevenue = bookings.stream()
                .map(Booking::getTotalPrice)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Expenses
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Vehicle stats
        long totalVehicles = vehicles.size();
        long activeVehicles = vehicles.stream().filter(v -> "active".equals(v.getStatus())).count();

        summary.put("totalBookings", totalBookings);
        summary.put("pendingBookings", pendingBookings);
        summary.put("confirmedBookings", confirmedBookings);
        summary.put("completedBookings", completedBookings);
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalExpenses", totalExpenses);
        summary.put("netProfit", totalRevenue.subtract(totalExpenses));
        summary.put("totalVehicles", totalVehicles);
        summary.put("activeVehicles", activeVehicles);

        return summary;
    }

    public Map<String, Object> getRevenueReport(String tenantId) {
        List<Booking> bookings = bookingRepository.findByTenantId(tenantId);
        
        Map<String, BigDecimal> revenueByService = new HashMap<>();
        Map<String, Long> bookingsByService = new HashMap<>();

        for (Booking booking : bookings) {
            String serviceType = booking.getServiceType() != null ? booking.getServiceType() : "unknown";
            BigDecimal price = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            
            revenueByService.merge(serviceType, price, BigDecimal::add);
            bookingsByService.merge(serviceType, 1L, Long::sum);
        }

        Map<String, Object> report = new HashMap<>();
        report.put("revenueByService", revenueByService);
        report.put("bookingsByService", bookingsByService);
        report.put("totalRevenue", revenueByService.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
        
        return report;
    }
}
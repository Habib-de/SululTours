package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
// ⬇️ REMOVE THIS IMPORT - import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
// ⬇️ REMOVE THIS LINE - @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner', 'client')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(@PathVariable String tenantId) {
        Map<String, Object> stats = dashboardService.getDashboardStats(tenantId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/bookings/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBookingStats(@PathVariable String tenantId) {
        Map<String, Object> stats = dashboardService.getBookingStats(tenantId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
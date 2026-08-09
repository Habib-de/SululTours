package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
// ⬇️ REMOVE THIS IMPORT - import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
// ⬇️ REMOVE THIS LINE - @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary(@PathVariable String tenantId) {
        Map<String, Object> summary = reportService.getDashboardSummary(tenantId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/revenue/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueReport(@PathVariable String tenantId) {
        Map<String, Object> report = reportService.getRevenueReport(tenantId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.AuditLogDTO;
import com.sulultours.entity.AuditLog;
import com.sulultours.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('super_admin')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<ApiResponse<AuditLogDTO>> createAuditLog(@RequestBody AuditLog auditLog) {
        AuditLog created = auditLogService.createAuditLog(auditLog);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Audit log created successfully", convertToDTO(created)));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsByTenant(@PathVariable String tenantId) {
        List<AuditLog> logs = auditLogService.getAuditLogsByTenant(tenantId);
        List<AuditLogDTO> dtos = logs.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsByUser(@PathVariable String userId) {
        List<AuditLog> logs = auditLogService.getAuditLogsByUser(userId);
        List<AuditLogDTO> dtos = logs.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/entity/{entity}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsByEntity(@PathVariable String entity) {
        List<AuditLog> logs = auditLogService.getAuditLogsByEntity(entity);
        List<AuditLogDTO> dtos = logs.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAuditLog(@PathVariable String id) {
        auditLogService.deleteAuditLog(id);
        return ResponseEntity.ok(ApiResponse.success("Audit log deleted successfully", null));
    }

    private AuditLogDTO convertToDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setTenantId(log.getTenant() != null ? log.getTenant().getId() : null);
        dto.setUserId(log.getUser() != null ? log.getUser().getId() : null);
        dto.setUserEmail(log.getUserEmail());
        dto.setUserRole(log.getUserRole());
        dto.setAction(log.getAction());
        dto.setEntity(log.getEntity());
        dto.setEntityId(log.getEntityId());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setUserAgent(log.getUserAgent());
        dto.setStatus(log.getStatus());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
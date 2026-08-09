package com.sulultours.service;

import com.sulultours.entity.Compliance;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.ComplianceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private final ComplianceRepository complianceRepository;

    @Transactional
    public Compliance createCompliance(Compliance compliance) {
        return complianceRepository.save(compliance);
    }

    public Compliance getComplianceById(String id) {
        return complianceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
    }

    public List<Compliance> getComplianceByTenant(String tenantId) {
        return complianceRepository.findByTenantId(tenantId);
    }

    public List<Compliance> getComplianceByVehicle(String vehicleId) {
        return complianceRepository.findByVehicleId(vehicleId);
    }

    public List<Compliance> getComplianceByStatus(String status) {
        return complianceRepository.findByStatus(status);
    }

    @Transactional
    public Compliance updateCompliance(String id, Compliance complianceDetails) {
        Compliance compliance = getComplianceById(id);
        compliance.setType(complianceDetails.getType());
        compliance.setValidFrom(complianceDetails.getValidFrom());
        compliance.setValidUntil(complianceDetails.getValidUntil());
        compliance.setStatus(complianceDetails.getStatus());
        compliance.setDocumentImage(complianceDetails.getDocumentImage());
        compliance.setNotes(complianceDetails.getNotes());
        compliance.setCreatedBy(complianceDetails.getCreatedBy());
        compliance.setUpdatedAt(LocalDateTime.now());  // ✅ ADD THIS
        return complianceRepository.save(compliance);
    }

    @Transactional
    public void deleteCompliance(String id) {
        Compliance compliance = getComplianceById(id);
        complianceRepository.delete(compliance);
    }
}
package com.sulultours.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sulultours.entity.Tenant;
import com.sulultours.exception.BadRequestException;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Tenant createTenant(Tenant tenant) {
        if (tenantRepository.existsBySubdomain(tenant.getSubdomain())) {
            throw new BadRequestException("Subdomain already exists: " + tenant.getSubdomain());
        }
        return tenantRepository.save(tenant);
    }

    public Tenant getTenantById(String id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + id));
    }

    public Tenant getTenantBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with subdomain: " + subdomain));
    }

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    @Transactional
    public Tenant updateTenant(String id, Tenant tenantDetails) {
        Tenant tenant = getTenantById(id);
        tenant.setName(tenantDetails.getName());
        tenant.setSubdomain(tenantDetails.getSubdomain());
        tenant.setStatus(tenantDetails.getStatus());
        tenant.setPlan(tenantDetails.getPlan());
        tenant.setConfig(tenantDetails.getConfig());
        return tenantRepository.save(tenant);
    }

    @Transactional
    public void deleteTenant(String id) {
        Tenant tenant = getTenantById(id);
        tenantRepository.delete(tenant);
    }

    @Transactional
    public Tenant updateTenantLocation(String id, Map<String, Object> locationData) {
        Tenant tenant = getTenantById(id);
        try {
            Map<String, Object> config = objectMapper.readValue(
                    tenant.getConfig() != null ? tenant.getConfig() : "{}", 
                    Map.class
            );
            config.put("location", locationData);
            tenant.setConfig(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            throw new RuntimeException("Failed to update location: " + e.getMessage());
        }
        return tenantRepository.save(tenant);
    }

    public Map<String, Object> getTenantLocation(String id) {
        Tenant tenant = getTenantById(id);
        try {
            if (tenant.getConfig() == null || tenant.getConfig().isEmpty()) {
                return null;
            }
            Map<String, Object> config = objectMapper.readValue(tenant.getConfig(), Map.class);
            return (Map<String, Object>) config.get("location");
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse location: " + e.getMessage());
        }
    }
}
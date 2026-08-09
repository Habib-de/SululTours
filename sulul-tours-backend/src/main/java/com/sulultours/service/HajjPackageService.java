package com.sulultours.service;

import com.sulultours.entity.HajjPackage;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.HajjPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HajjPackageService {

    private final HajjPackageRepository hajjPackageRepository;

    @Transactional
    public HajjPackage createHajjPackage(HajjPackage hajjPackage) {
        return hajjPackageRepository.save(hajjPackage);
    }

    public HajjPackage getHajjPackageById(String id) {
        return hajjPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hajj package not found with id: " + id));
    }

    public List<HajjPackage> getHajjPackagesByTenant(String tenantId) {
        return hajjPackageRepository.findByTenantId(tenantId);
    }

    public List<HajjPackage> getHajjPackagesByTenantAndStatus(String tenantId, String status) {
        return hajjPackageRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<HajjPackage> getHajjPackagesByType(String type) {
        return hajjPackageRepository.findByType(type);
    }

    public List<HajjPackage> getAllHajjPackages() {
        return hajjPackageRepository.findAll();
    }

    @Transactional
    public HajjPackage updateHajjPackage(String id, HajjPackage hajjPackageDetails) {
        HajjPackage hajjPackage = getHajjPackageById(id);
        hajjPackage.setName(hajjPackageDetails.getName());
        hajjPackage.setType(hajjPackageDetails.getType());
        hajjPackage.setDestination(hajjPackageDetails.getDestination());
        hajjPackage.setDuration(hajjPackageDetails.getDuration());
        hajjPackage.setPrice(hajjPackageDetails.getPrice());
        hajjPackage.setDescription(hajjPackageDetails.getDescription());
        hajjPackage.setStatus(hajjPackageDetails.getStatus());
        hajjPackage.setMaxGroupSize(hajjPackageDetails.getMaxGroupSize());
        hajjPackage.setDepartureDates(hajjPackageDetails.getDepartureDates());
        hajjPackage.setImages(hajjPackageDetails.getImages());
        hajjPackage.setAccommodation(hajjPackageDetails.getAccommodation());
        hajjPackage.setMeals(hajjPackageDetails.getMeals());
        hajjPackage.setTransport(hajjPackageDetails.getTransport());
        hajjPackage.setGuides(hajjPackageDetails.getGuides());
        hajjPackage.setVisa(hajjPackageDetails.getVisa());
        hajjPackage.setInsurance(hajjPackageDetails.getInsurance());
        hajjPackage.setInclusions(hajjPackageDetails.getInclusions());
        hajjPackage.setHighlights(hajjPackageDetails.getHighlights());
        return hajjPackageRepository.save(hajjPackage);
    }

    @Transactional
    public void deleteHajjPackage(String id) {
        HajjPackage hajjPackage = getHajjPackageById(id);
        hajjPackageRepository.delete(hajjPackage);
    }
}
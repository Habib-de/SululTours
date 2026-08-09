package com.sulultours.service;

import com.sulultours.entity.TourPackage;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TourPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TourPackageService {

    private final TourPackageRepository tourPackageRepository;

    @Transactional
    public TourPackage createTourPackage(TourPackage tourPackage) {
        return tourPackageRepository.save(tourPackage);
    }

    public TourPackage getTourPackageById(String id) {
        return tourPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + id));
    }

    public List<TourPackage> getTourPackagesByTenant(String tenantId) {
        return tourPackageRepository.findByTenantId(tenantId);
    }

    public List<TourPackage> getTourPackagesByTenantAndStatus(String tenantId, String status) {
        return tourPackageRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<TourPackage> getTourPackagesByCategory(String category) {
        return tourPackageRepository.findByCategory(category);
    }

    public List<TourPackage> getAllTourPackages() {
        return tourPackageRepository.findAll();
    }

    @Transactional
    public TourPackage updateTourPackage(String id, TourPackage tourPackageDetails) {
        TourPackage tourPackage = getTourPackageById(id);
        tourPackage.setName(tourPackageDetails.getName());
        tourPackage.setDestination(tourPackageDetails.getDestination());
        tourPackage.setDuration(tourPackageDetails.getDuration());
        tourPackage.setPrice(tourPackageDetails.getPrice());
        tourPackage.setDescription(tourPackageDetails.getDescription());
        tourPackage.setCategory(tourPackageDetails.getCategory());
        tourPackage.setStatus(tourPackageDetails.getStatus());
        tourPackage.setMaxGroupSize(tourPackageDetails.getMaxGroupSize());
        tourPackage.setDifficulty(tourPackageDetails.getDifficulty());
        tourPackage.setInclusions(tourPackageDetails.getInclusions());
        tourPackage.setExclusions(tourPackageDetails.getExclusions());
        tourPackage.setItinerary(tourPackageDetails.getItinerary());
        tourPackage.setHighlights(tourPackageDetails.getHighlights());
        tourPackage.setDepartureDates(tourPackageDetails.getDepartureDates());
        tourPackage.setImages(tourPackageDetails.getImages());
        return tourPackageRepository.save(tourPackage);
    }

    @Transactional
    public void deleteTourPackage(String id) {
        TourPackage tourPackage = getTourPackageById(id);
        tourPackageRepository.delete(tourPackage);
    }
}
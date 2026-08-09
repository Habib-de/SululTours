package com.sulultours.service;

import com.sulultours.entity.TourGuide;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.TourGuideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TourGuideService {

    private final TourGuideRepository tourGuideRepository;

    @Transactional
    public TourGuide createTourGuide(TourGuide tourGuide) {
        try {
            // Set defaults for null values
            if (tourGuide.getStatus() == null) {
                tourGuide.setStatus("active");
            }
            if (tourGuide.getAvailability() == null) {
                tourGuide.setAvailability("available");
            }
            if (tourGuide.getRating() == null) {
                tourGuide.setRating(java.math.BigDecimal.ZERO);
            }
            if (tourGuide.getReviews() == null) {
                tourGuide.setReviews(0);
            }
            if (tourGuide.getPricePerDay() == null) {
                tourGuide.setPricePerDay(java.math.BigDecimal.ZERO);
            }
            return tourGuideRepository.save(tourGuide);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    public TourGuide getTourGuideById(String id) {
        return tourGuideRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour guide not found with id: " + id));
    }

    public List<TourGuide> getTourGuidesByTenant(String tenantId) {
        return tourGuideRepository.findByTenantId(tenantId);
    }

    public List<TourGuide> getTourGuidesByTenantAndStatus(String tenantId, String status) {
        return tourGuideRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<TourGuide> getTourGuidesByAvailability(String availability) {
        return tourGuideRepository.findByAvailability(availability);
    }

    @Transactional
    public TourGuide updateTourGuide(String id, TourGuide tourGuideDetails) {
        TourGuide tourGuide = getTourGuideById(id);
        tourGuide.setName(tourGuideDetails.getName());
        tourGuide.setEmail(tourGuideDetails.getEmail());
        tourGuide.setPhone(tourGuideDetails.getPhone());
        tourGuide.setBio(tourGuideDetails.getBio());
        tourGuide.setSpecialties(tourGuideDetails.getSpecialties());
        tourGuide.setLanguages(tourGuideDetails.getLanguages());
        tourGuide.setExperience(tourGuideDetails.getExperience());
        tourGuide.setRating(tourGuideDetails.getRating());
        tourGuide.setReviews(tourGuideDetails.getReviews());
        tourGuide.setImage(tourGuideDetails.getImage());
        tourGuide.setStatus(tourGuideDetails.getStatus());
        tourGuide.setCertifications(tourGuideDetails.getCertifications());
        tourGuide.setAvailability(tourGuideDetails.getAvailability());
        tourGuide.setPricePerDay(tourGuideDetails.getPricePerDay());
        tourGuide.setCountry(tourGuideDetails.getCountry());
        tourGuide.setCity(tourGuideDetails.getCity());
        tourGuide.setUpdatedAt(java.time.LocalDateTime.now());
        return tourGuideRepository.save(tourGuide);
    }

    @Transactional
    public void deleteTourGuide(String id) {
        TourGuide tourGuide = getTourGuideById(id);
        tourGuideRepository.delete(tourGuide);
    }
}
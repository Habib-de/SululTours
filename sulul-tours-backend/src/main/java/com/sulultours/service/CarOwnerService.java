package com.sulultours.service;

import com.sulultours.entity.CarOwner;
import com.sulultours.entity.User;  // ✅ ADD THIS
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.CarOwnerRepository;
import com.sulultours.repository.UserRepository;  // ✅ ADD THIS
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarOwnerService {

    private final CarOwnerRepository carOwnerRepository;
    private final UserRepository userRepository;  // ✅ ADD THIS

    @Transactional
    public CarOwner createCarOwner(CarOwner carOwner) {
        return carOwnerRepository.save(carOwner);
    }

    public CarOwner getCarOwnerById(String id) {
        return carOwnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car owner not found with id: " + id));
    }

    public CarOwner getCarOwnerByUserId(String userId) {
        return carOwnerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Car owner not found for user: " + userId));
    }

    public List<CarOwner> getCarOwnersByTenant(String tenantId) {
        return carOwnerRepository.findByTenantId(tenantId);
    }

    public List<CarOwner> getCarOwnersByStatus(String status) {
        return carOwnerRepository.findByStatus(status);
    }

    public List<CarOwner> getAllCarOwners() {
        return carOwnerRepository.findAll();
    }

    @Transactional
    public CarOwner updateCarOwner(String id, CarOwner carOwnerDetails) {
        CarOwner carOwner = getCarOwnerById(id);
        carOwner.setName(carOwnerDetails.getName());
        carOwner.setEmail(carOwnerDetails.getEmail());
        carOwner.setPhone(carOwnerDetails.getPhone());
        carOwner.setIdNumber(carOwnerDetails.getIdNumber());
        carOwner.setAddress(carOwnerDetails.getAddress());
        carOwner.setCompanyName(carOwnerDetails.getCompanyName());
        carOwner.setStatus(carOwnerDetails.getStatus());
        if ("active".equals(carOwnerDetails.getStatus()) && carOwner.getApprovedAt() == null) {
            carOwner.setApprovedAt(LocalDateTime.now());
        }
        return carOwnerRepository.save(carOwner);
    }

    @Transactional
    public CarOwner approveCarOwner(String id) {
        CarOwner carOwner = getCarOwnerById(id);
        carOwner.setStatus("active");
        carOwner.setApprovedAt(LocalDateTime.now());
        carOwnerRepository.save(carOwner);
        
        // ✅ ALSO ACTIVATE THE USER
        User user = carOwner.getUser();
        if (user != null) {
            user.setStatus("active");
            userRepository.save(user);
        }
        
        return carOwner;
    }

    @Transactional
    public void deleteCarOwner(String id) {
        CarOwner carOwner = getCarOwnerById(id);
        carOwnerRepository.delete(carOwner);
    }
}
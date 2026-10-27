package com.sulultours.service;

import com.sulultours.entity.CarOwner;
import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.User;  // ✅ ADD THIS
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.CarOwnerRepository;
import com.sulultours.repository.UserRepository;  // ✅ ADD THIS
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
        if (carOwner.getApprovedAt() == null) {
            carOwner.setApprovedAt(LocalDateTime.now());
        }
        carOwnerRepository.save(carOwner);
        
        // ✅ ALSO ACTIVATE THE USER
        User user = carOwner.getUser();
        if (user != null && user.getRole() == RoleEnum.car_owner) {
            user.setStatus("active");
            userRepository.save(user);
        }
        
        return carOwner;
    }

    @Transactional
    public void deleteCarOwner(String id) {
        CarOwner carOwner = getCarOwnerById(id);

        // ✅ Block deletion if this profile belongs to a broker
        if (carOwner.getUser() != null
                && carOwner.getUser().getRole() == RoleEnum.broker) {
            throw new RuntimeException(
                "Cannot delete CarOwner profile for a broker — it is required for their vehicles");
        }

        carOwnerRepository.delete(carOwner);
    }

        /**
     * Get-or-create a CarOwner profile for the given user.
     *
     * - car_owner users → status = "pending_approval" (need FM approval)
     * - broker users    → status = "active"           (already trusted)
     */
    @Transactional
    public CarOwner getOrCreateProfileForUser(User user) {
        if (user == null) {
            throw new ResourceNotFoundException("User is required to create a CarOwner profile");
        }

        CarOwner existing = carOwnerRepository.findByUserId(user.getId()).orElse(null);
        if (existing != null) {
            return existing;
        }

        CarOwner owner = new CarOwner();
        owner.setId(UUID.randomUUID().toString());
        owner.setUser(user);
        owner.setTenant(user.getTenant());
        owner.setName(user.getName());
        owner.setEmail(user.getEmail());
        owner.setPhone(user.getPhone());
        owner.setIdNumber(user.getIdNumber());
        owner.setAddress(user.getAddress());
        owner.setCompanyName(null);
        owner.setVehicleCount(0);

        if (user.getRole() == RoleEnum.broker) {
            owner.setStatus("active");
            owner.setApprovedAt(LocalDateTime.now());
        } else {
            owner.setStatus("pending_approval");
        }

        return carOwnerRepository.save(owner);
    }
}
package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.FlightDTO;
import com.sulultours.entity.Flight;
import com.sulultours.entity.Tenant;
import com.sulultours.service.FlightService;
import com.sulultours.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/flights")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class FlightController {

    private final FlightService flightService;
    private final TenantService tenantService;  // ✅ ADD THIS

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<FlightDTO>>> getAllFlights() {
        List<Flight> flights = flightService.getAllFlights();
        List<FlightDTO> dtos = flights.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<FlightDTO>> createFlight(@RequestBody FlightDTO request) {
        try {
            System.out.println("📥 Creating flight:");
            System.out.println("  - airline: " + request.getAirline());
            System.out.println("  - flightNumber: " + request.getFlightNumber());
            System.out.println("  - tenantId: " + request.getTenantId());
            
            // ✅ Convert DTO to Entity
            Flight flight = new Flight();
            flight.setAirline(request.getAirline());
            flight.setFlightNumber(request.getFlightNumber());
            flight.setOrigin(request.getOrigin());
            flight.setDestination(request.getDestination());
            flight.setFlightType(request.getFlightType() != null ? request.getFlightType() : "international");
            flight.setDepartureDate(request.getDepartureDate());
            flight.setDepartureTime(request.getDepartureTime());
            flight.setArrivalDate(request.getArrivalDate());
            flight.setArrivalTime(request.getArrivalTime());
            flight.setDuration(request.getDuration());
            flight.setEconomyPrice(request.getEconomyPrice());
            flight.setBusinessPrice(request.getBusinessPrice());
            flight.setFirstClassPrice(request.getFirstClassPrice());
            flight.setEconomySeats(request.getEconomySeats() != null ? request.getEconomySeats() : 100);
            flight.setBusinessSeats(request.getBusinessSeats() != null ? request.getBusinessSeats() : 20);
            flight.setFirstClassSeats(request.getFirstClassSeats() != null ? request.getFirstClassSeats() : 10);
            flight.setStatus(request.getStatus() != null ? request.getStatus() : "active");
            flight.setTerminal(request.getTerminal());
            flight.setGate(request.getGate());
            flight.setBaggageAllowance(request.getBaggageAllowance() != null ? request.getBaggageAllowance() : "20kg");
            flight.setAmenities(request.getAmenities());
            flight.setImage(request.getImage());
            flight.setNotes(request.getNotes());
            
            // ✅ Set Tenant
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                Tenant tenant = tenantService.getTenantById(request.getTenantId());
                flight.setTenant(tenant);
                System.out.println("  ✅ Tenant set: " + tenant.getId());
            } else {
                System.out.println("  ⚠️ No tenantId provided");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("tenantId is required"));
            }
            
            Flight created = flightService.createFlight(flight);
            System.out.println("✅ Flight created with ID: " + created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Flight created successfully", convertToDTO(created)));
                    
        } catch (Exception e) {
            System.err.println("❌ Error creating flight: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create flight: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<FlightDTO>> getFlightById(@PathVariable String id) {
        try {
            Flight flight = flightService.getFlightById(id);
            return ResponseEntity.ok(ApiResponse.success(convertToDTO(flight)));
        } catch (Exception e) {
            System.err.println("❌ Error fetching flight: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching flight: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<FlightDTO>>> getFlightsByTenant(@PathVariable String tenantId) {
        try {
            List<Flight> flights = flightService.getFlightsByTenant(tenantId);
            List<FlightDTO> dtos = flights.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching flights by tenant: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching flights: " + e.getMessage()));
        }
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<FlightDTO>>> getFlightsByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        try {
            List<Flight> flights = flightService.getFlightsByTenantAndStatus(tenantId, status);
            List<FlightDTO> dtos = flights.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching flights by tenant and status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching flights: " + e.getMessage()));
        }
    }

    @GetMapping("/airline/{airline}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<FlightDTO>>> getFlightsByAirline(@PathVariable String airline) {
        try {
            List<Flight> flights = flightService.getFlightsByAirline(airline);
            List<FlightDTO> dtos = flights.stream().map(this::convertToDTO).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos));
        } catch (Exception e) {
            System.err.println("❌ Error fetching flights by airline: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error fetching flights: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<FlightDTO>> updateFlight(@PathVariable String id, @RequestBody FlightDTO request) {
        try {
            System.out.println("📥 Updating flight: " + id);
            
            // ✅ Get existing flight
            Flight existingFlight = flightService.getFlightById(id);
            
            // ✅ Update fields
            existingFlight.setAirline(request.getAirline());
            existingFlight.setFlightNumber(request.getFlightNumber());
            existingFlight.setOrigin(request.getOrigin());
            existingFlight.setDestination(request.getDestination());
            existingFlight.setFlightType(request.getFlightType() != null ? request.getFlightType() : "international");
            existingFlight.setDepartureDate(request.getDepartureDate());
            existingFlight.setDepartureTime(request.getDepartureTime());
            existingFlight.setArrivalDate(request.getArrivalDate());
            existingFlight.setArrivalTime(request.getArrivalTime());
            existingFlight.setDuration(request.getDuration());
            existingFlight.setEconomyPrice(request.getEconomyPrice());
            existingFlight.setBusinessPrice(request.getBusinessPrice());
            existingFlight.setFirstClassPrice(request.getFirstClassPrice());
            existingFlight.setEconomySeats(request.getEconomySeats() != null ? request.getEconomySeats() : 100);
            existingFlight.setBusinessSeats(request.getBusinessSeats() != null ? request.getBusinessSeats() : 20);
            existingFlight.setFirstClassSeats(request.getFirstClassSeats() != null ? request.getFirstClassSeats() : 10);
            existingFlight.setStatus(request.getStatus() != null ? request.getStatus() : "active");
            existingFlight.setTerminal(request.getTerminal());
            existingFlight.setGate(request.getGate());
            existingFlight.setBaggageAllowance(request.getBaggageAllowance() != null ? request.getBaggageAllowance() : "20kg");
            existingFlight.setAmenities(request.getAmenities());
            existingFlight.setImage(request.getImage());
            existingFlight.setNotes(request.getNotes());
            
            // ✅ Update tenant if provided
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                Tenant tenant = tenantService.getTenantById(request.getTenantId());
                existingFlight.setTenant(tenant);
            }
            
            Flight updated = flightService.updateFlight(id, existingFlight);
            System.out.println("✅ Flight updated: " + updated.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Flight updated successfully", convertToDTO(updated)));
            
        } catch (Exception e) {
            System.err.println("❌ Error updating flight: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update flight: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@PathVariable String id) {
        try {
            System.out.println("📥 Deleting flight: " + id);
            flightService.deleteFlight(id);
            System.out.println("✅ Flight deleted: " + id);
            return ResponseEntity.ok(ApiResponse.success("Flight deleted successfully", null));
        } catch (Exception e) {
            System.err.println("❌ Error deleting flight: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete flight: " + e.getMessage()));
        }
    }

    private FlightDTO convertToDTO(Flight flight) {
        FlightDTO dto = new FlightDTO();
        dto.setId(flight.getId());
        dto.setTenantId(flight.getTenant() != null ? flight.getTenant().getId() : null);
        dto.setAirline(flight.getAirline());
        dto.setFlightNumber(flight.getFlightNumber());
        dto.setOrigin(flight.getOrigin());
        dto.setDestination(flight.getDestination());
        dto.setFlightType(flight.getFlightType());
        dto.setDepartureDate(flight.getDepartureDate());
        dto.setDepartureTime(flight.getDepartureTime());
        dto.setArrivalDate(flight.getArrivalDate());
        dto.setArrivalTime(flight.getArrivalTime());
        dto.setDuration(flight.getDuration());
        dto.setEconomyPrice(flight.getEconomyPrice());
        dto.setBusinessPrice(flight.getBusinessPrice());
        dto.setFirstClassPrice(flight.getFirstClassPrice());
        dto.setEconomySeats(flight.getEconomySeats());
        dto.setBusinessSeats(flight.getBusinessSeats());
        dto.setFirstClassSeats(flight.getFirstClassSeats());
        dto.setStatus(flight.getStatus());
        dto.setTerminal(flight.getTerminal());
        dto.setGate(flight.getGate());
        dto.setBaggageAllowance(flight.getBaggageAllowance());
        dto.setAmenities(flight.getAmenities());
        dto.setImage(flight.getImage());
        dto.setNotes(flight.getNotes());
        dto.setCreatedAt(flight.getCreatedAt());
        return dto;
    }
}
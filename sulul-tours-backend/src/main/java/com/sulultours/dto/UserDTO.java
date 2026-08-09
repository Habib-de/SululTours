package com.sulultours.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private String id;
    private String tenantId;
    private String email;
    private String name;
    private String role;
    private String avatar;
    private String phone;
    private String idNumber;
    private String address;
    private String status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}